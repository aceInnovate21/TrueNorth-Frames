import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeBadge, BadgeSignals } from '@/lib/badges'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
}

// ── Seeded shuffle — consistent within a session, random across sessions ───────
// Uses a simple LCG so the same seed gives the same order (stable during scroll)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// GET /api/portfolio-reel
// Query params:
//   specialty  — filter by photographer specialty
//   tag        — filter by photo tag
//   seed       — integer seed for shuffle (client picks once per session, passes back)
//   page       — 1-based page (each page = 10 photographers, up to 6 photos each)
export async function GET(request: NextRequest) {
  const db = getDb()
  const sp = request.nextUrl.searchParams

  const specialty = sp.get('specialty')?.trim().toLowerCase() ?? ''
  const tag       = sp.get('tag')?.trim().toLowerCase()       ?? ''
  const seed      = parseInt(sp.get('seed') ?? '0') || Math.floor(Math.random() * 999999)
  const page      = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
  const PAGE_SIZE = 10  // photographers per page

  // ── 1. Fetch approved photographers with portfolio photos ─────────────────
  const { data: profiles } = await db
    .from('photographer_profiles')
    .select('id, username, display_name, location, avatar_url, trust_score, native_avg_rating, native_review_count, years_experience, website_url, profile_status')
    .eq('profile_status', 'approved')

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ reelPhotographers: [], seed, hasMore: false })
  }

  const allIds: string[] = profiles.map((p: any) => p.id)

  // ── 2. Fetch portfolio photos with tags (filter by tag if set) ────────────
  let photoQuery = db
    .from('portfolio_photos')
    .select('id, photographer_id, caption, tags, photo_taken_month, photo_taken_year, storage_asset_id')
    .in('photographer_id', allIds)

  // Tag filter — photos must contain this tag
  if (tag) {
    photoQuery = photoQuery.contains('tags', [tag])
  }

  const { data: allPhotos } = await photoQuery

  if (!allPhotos || allPhotos.length === 0) {
    return NextResponse.json({ reelPhotographers: [], seed, hasMore: false })
  }

  // ── 3. Fetch specialty map & filter photographers by specialty ────────────
  const { data: specialtyRows } = await db
    .from('photographer_specialties')
    .select('photographer_id, specialty')
    .in('photographer_id', allIds)

  const specialtyMap: Record<string, string[]> = {}
  for (const s of specialtyRows ?? []) {
    if (!specialtyMap[s.photographer_id]) specialtyMap[s.photographer_id] = []
    specialtyMap[s.photographer_id].push(s.specialty)
  }

  // ── 4. Group photos by photographer, keep only those with ≥ 1 photo ───────
  const photosByPhotographer: Record<string, any[]> = {}
  for (const ph of allPhotos) {
    if (!photosByPhotographer[ph.photographer_id]) photosByPhotographer[ph.photographer_id] = []
    photosByPhotographer[ph.photographer_id].push(ph)
  }

  // Filter photographers: must have photos AND pass specialty filter
  let eligibleIds = Object.keys(photosByPhotographer).filter(id => {
    if (!specialty) return true
    const sps = (specialtyMap[id] ?? []).map(s => s.toLowerCase())
    return sps.includes(specialty)
  })

  if (eligibleIds.length === 0) {
    return NextResponse.json({ reelPhotographers: [], seed, hasMore: false })
  }

  // ── 5. Shuffle eligible photographers with seed ───────────────────────────
  const shuffled = seededShuffle(eligibleIds, seed)
  const totalPages = Math.ceil(shuffled.length / PAGE_SIZE)
  const hasMore = page < totalPages
  const pageIds = shuffled.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (pageIds.length === 0) {
    return NextResponse.json({ reelPhotographers: [], seed, hasMore: false })
  }

  // ── 6. Resolve R2 URLs for photos in this page ───────────────────────────
  const pagePhotos = pageIds.flatMap(id => photosByPhotographer[id] ?? [])
  const assetIds = pagePhotos.map((p: any) => p.storage_asset_id).filter(Boolean)

  const assetKeyMap: Record<string, string> = {}
  if (assetIds.length > 0) {
    const { data: assets } = await db
      .from('storage_assets')
      .select('id, key')
      .in('id', assetIds)
    for (const a of assets ?? []) assetKeyMap[a.id] = a.key
  }

  const r2Base = process.env.R2_PUBLIC_URL ?? ''

  // ── 7. Fetch badge signals for page photographers ─────────────────────────
  const [
    { data: gbpLinks },
    { data: platformReviews },
    { data: completedBookings },
  ] = await Promise.all([
    db.from('external_platform_links').select('photographer_id, platform_review_count').eq('platform', 'google').in('photographer_id', pageIds),
    db.from('reviews').select('photographer_id').in('photographer_id', pageIds).eq('flag_status', 'none'),
    db.from('booking_requests').select('photographer_id').in('photographer_id', pageIds).eq('status', 'completed'),
  ])

  const gbpMap: Record<string, boolean>        = {}
  const platformReviewMap: Record<string, number> = {}
  const bookingMap: Record<string, number>        = {}

  for (const r of gbpLinks ?? [])        gbpMap[r.photographer_id] = (r.platform_review_count ?? 0) > 0
  for (const r of platformReviews ?? []) platformReviewMap[r.photographer_id] = (platformReviewMap[r.photographer_id] ?? 0) + 1
  for (const r of completedBookings ?? []) bookingMap[r.photographer_id] = (bookingMap[r.photographer_id] ?? 0) + 1

  // ── 8. Build the reel response ────────────────────────────────────────────
  const profileMap: Record<string, any> = {}
  for (const p of profiles) profileMap[p.id] = p

  const reelPhotographers = pageIds.map(photographerId => {
    const profile  = profileMap[photographerId]
    const photos   = (photosByPhotographer[photographerId] ?? []).map((ph: any) => ({
      id:               ph.id,
      src:              assetKeyMap[ph.storage_asset_id] ? `${r2Base}/${assetKeyMap[ph.storage_asset_id]}` : '',
      caption:          ph.caption ?? '',
      tags:             ph.tags ?? [],
      photo_taken_month: ph.photo_taken_month ?? null,
      photo_taken_year:  ph.photo_taken_year  ?? null,
    })).filter((ph: any) => ph.src)  // skip photos with no resolved URL

    if (photos.length === 0) return null

    const signals: BadgeSignals = {
      yearsExperience:     profile.years_experience ?? null,
      hasGbp:              !!gbpMap[photographerId],
      hasWebsite:          !!(profile.website_url?.trim()),
      hasGoogleReviews:    gbpMap[photographerId] ?? false,
      portfolioPhotoCount: photos.length,
      platformReviewCount: platformReviewMap[photographerId] ?? 0,
      completedBookings:   bookingMap[photographerId]        ?? 0,
      trustScore:          Number(profile.trust_score ?? 0),
      isMostReviewed:      false,
      isMostBooked:        false,
    }

    return {
      photographerId,
      username:           profile.username,
      displayName:        profile.display_name,
      location:           profile.location ?? '',
      avatarUrl:          profile.avatar_url ?? null,
      nativeAvgRating:    Number(profile.native_avg_rating ?? 0),
      nativeReviewCount:  profile.native_review_count ?? 0,
      trustScore:         Number(profile.trust_score ?? 0),
      specialties:        specialtyMap[photographerId] ?? [],
      badge:              computeBadge(signals),
      photos,             // up to all photos, client swipes left/right
    }
  }).filter(Boolean)

  return NextResponse.json({ reelPhotographers, seed, hasMore, page, totalPages })
}

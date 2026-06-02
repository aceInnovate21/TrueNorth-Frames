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
// Returns reel items — one per standalone photo OR one per album (swipeable).
// Standalone photos are individual cards. Album photos are grouped and swipeable left/right.
// Items from different photographers are shuffled together.
export async function GET(request: NextRequest) {
  const db = getDb()
  const sp = request.nextUrl.searchParams

  const specialty = sp.get('specialty')?.trim().toLowerCase() ?? ''
  const tag       = sp.get('tag')?.trim().toLowerCase()       ?? ''
  const seed      = parseInt(sp.get('seed') ?? '0') || Math.floor(Math.random() * 999999)
  const page      = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
  const PAGE_SIZE = 20  // reel items per page

  // ── 1. Approved photographers ─────────────────────────────────────────────
  const { data: profiles } = await db
    .from('photographer_profiles')
    .select('id, username, display_name, location, avatar_url, trust_score, native_avg_rating, native_review_count, years_experience, website_url, profile_status')
    .eq('profile_status', 'approved')

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ reelItems: [], seed, hasMore: false })
  }

  const allIds: string[] = profiles.map((p: any) => p.id)

  // ── 2. Fetch photos with album_id + tags ──────────────────────────────────
  let photoQuery = db
    .from('portfolio_photos')
    .select('id, photographer_id, album_id, caption, tags, photo_taken_month, photo_taken_year, storage_asset_id')
    .in('photographer_id', allIds)

  if (tag) photoQuery = photoQuery.contains('tags', [tag])

  const { data: allPhotos } = await photoQuery

  if (!allPhotos || allPhotos.length === 0) {
    return NextResponse.json({ reelItems: [], seed, hasMore: false })
  }

  // ── 3. Specialties ────────────────────────────────────────────────────────
  const { data: specialtyRows } = await db
    .from('photographer_specialties')
    .select('photographer_id, specialty')
    .in('photographer_id', allIds)

  const specialtyMap: Record<string, string[]> = {}
  for (const s of specialtyRows ?? []) {
    if (!specialtyMap[s.photographer_id]) specialtyMap[s.photographer_id] = []
    specialtyMap[s.photographer_id].push(s.specialty)
  }

  // ── 4. Filter by specialty ────────────────────────────────────────────────
  const photographerHasPhoto = new Set(allPhotos.map((p: any) => p.photographer_id))
  const eligibleIds = allIds.filter(id => {
    if (!photographerHasPhoto.has(id)) return false
    if (!specialty) return true
    return (specialtyMap[id] ?? []).some(s => s.toLowerCase() === specialty)
  })

  if (eligibleIds.length === 0) {
    return NextResponse.json({ reelItems: [], seed, hasMore: false })
  }

  // ── 5. Build reel items — one per standalone photo, one per album ─────────
  // Group photos by photographer → then by album
  const byPhotographer: Record<string, { standalone: any[]; byAlbum: Record<string, any[]> }> = {}
  for (const id of eligibleIds) {
    byPhotographer[id] = { standalone: [], byAlbum: {} }
  }
  for (const ph of allPhotos) {
    if (!byPhotographer[ph.photographer_id]) continue
    if (!ph.album_id) {
      byPhotographer[ph.photographer_id].standalone.push(ph)
    } else {
      const albumMap = byPhotographer[ph.photographer_id].byAlbum
      if (!albumMap[ph.album_id]) albumMap[ph.album_id] = []
      albumMap[ph.album_id].push(ph)
    }
  }

  // Each reel item is tagged with its photographer_id for badge/context lookup
  type ReelItem = { photographerId: string; albumId: string | null; photos: any[] }
  const allReelItems: ReelItem[] = []

  for (const photographerId of eligibleIds) {
    const { standalone, byAlbum } = byPhotographer[photographerId]
    // One card per standalone photo
    for (const ph of standalone) {
      allReelItems.push({ photographerId, albumId: null, photos: [ph] })
    }
    // One card per album (all album photos swipeable)
    for (const [albumId, photos] of Object.entries(byAlbum)) {
      allReelItems.push({ photographerId, albumId, photos })
    }
  }

  if (allReelItems.length === 0) {
    return NextResponse.json({ reelItems: [], seed, hasMore: false })
  }

  // ── 6. Shuffle all reel items together ────────────────────────────────────
  const shuffled = seededShuffle(allReelItems, seed)
  const totalPages = Math.ceil(shuffled.length / PAGE_SIZE)
  const hasMore = page < totalPages
  const pageItems = shuffled.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (pageItems.length === 0) {
    return NextResponse.json({ reelItems: [], seed, hasMore: false })
  }

  // ── 7. Resolve R2 URLs ────────────────────────────────────────────────────
  const assetIds = pageItems.flatMap(item => item.photos.map((p: any) => p.storage_asset_id)).filter(Boolean)
  const assetKeyMap: Record<string, string> = {}
  if (assetIds.length > 0) {
    const { data: assets } = await db.from('storage_assets').select('id, key').in('id', assetIds)
    for (const a of assets ?? []) assetKeyMap[a.id] = a.key
  }
  const r2Base = process.env.R2_PUBLIC_URL ?? ''

  // ── 8. Badge signals for photographers in this page ───────────────────────
  const pagePhotographerIds = pageItems.map(i => i.photographerId).filter((id, idx, arr) => arr.indexOf(id) === idx)
  const [{ data: gbpLinks }, { data: platformReviews }, { data: completedBookings }] = await Promise.all([
    db.from('external_platform_links').select('photographer_id, platform_review_count').eq('platform', 'google').in('photographer_id', pagePhotographerIds),
    db.from('reviews').select('photographer_id').in('photographer_id', pagePhotographerIds).eq('flag_status', 'none'),
    db.from('booking_requests').select('photographer_id').in('photographer_id', pagePhotographerIds).eq('status', 'completed'),
  ])

  const gbpMap: Record<string, boolean>          = {}
  const platformReviewMap: Record<string, number> = {}
  const bookingMap: Record<string, number>        = {}
  for (const r of gbpLinks ?? [])         gbpMap[r.photographer_id] = (r.platform_review_count ?? 0) > 0
  for (const r of platformReviews ?? [])  platformReviewMap[r.photographer_id] = (platformReviewMap[r.photographer_id] ?? 0) + 1
  for (const r of completedBookings ?? []) bookingMap[r.photographer_id] = (bookingMap[r.photographer_id] ?? 0) + 1

  const profileMap: Record<string, any> = {}
  for (const p of profiles) profileMap[p.id] = p

  // ── 9. Build response ─────────────────────────────────────────────────────
  const reelItems = pageItems.map(item => {
    const profile = profileMap[item.photographerId]
    const photos = item.photos.map((ph: any) => ({
      id:                ph.id,
      src:               assetKeyMap[ph.storage_asset_id] ? `${r2Base}/${assetKeyMap[ph.storage_asset_id]}` : '',
      caption:           ph.caption ?? '',
      tags:              ph.tags ?? [],
      photo_taken_month: ph.photo_taken_month ?? null,
      photo_taken_year:  ph.photo_taken_year  ?? null,
    })).filter((ph: any) => ph.src)

    if (photos.length === 0) return null

    const totalPhotos = [...(byPhotographer[item.photographerId]?.standalone ?? []), ...Object.values(byPhotographer[item.photographerId]?.byAlbum ?? {}).flat()]
    const signals: BadgeSignals = {
      yearsExperience:     profile.years_experience ?? null,
      hasGbp:              !!gbpMap[item.photographerId],
      hasWebsite:          !!(profile.website_url?.trim()),
      hasGoogleReviews:    gbpMap[item.photographerId] ?? false,
      portfolioPhotoCount: totalPhotos.length,
      platformReviewCount: platformReviewMap[item.photographerId] ?? 0,
      completedBookings:   bookingMap[item.photographerId]        ?? 0,
      trustScore:          Number(profile.trust_score ?? 0),
      isMostReviewed:      false,
      isMostBooked:        false,
    }

    return {
      photographerId: item.photographerId,
      albumId:        item.albumId,           // null = standalone photo(s), string = album
      isAlbum:        item.albumId !== null,   // convenience flag for client
      username:       profile.username,
      displayName:    profile.display_name,
      location:       profile.location ?? '',
      avatarUrl:      profile.avatar_url ?? null,
      nativeAvgRating:   Number(profile.native_avg_rating ?? 0),
      nativeReviewCount: profile.native_review_count ?? 0,
      trustScore:        Number(profile.trust_score ?? 0),
      specialties:    specialtyMap[item.photographerId] ?? [],
      badge:          computeBadge(signals),
      photos,
    }
  }).filter(Boolean)

  return NextResponse.json({ reelItems, seed, hasMore, page, totalPages })
}

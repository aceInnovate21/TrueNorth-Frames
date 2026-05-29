import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PAGE_SIZE = 12

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
}

// GET /api/photographers
// Query params: q, specialty, neighbourhood, min_rating, available_today, sort, page
export async function GET(request: NextRequest) {
  const db = getDb()
  const sp = request.nextUrl.searchParams

  const q             = sp.get('q')?.trim() ?? ''
  const specialty     = sp.get('specialty')?.trim() ?? ''
  const neighbourhood = sp.get('neighbourhood')?.trim() ?? ''
  const minRating     = parseFloat(sp.get('min_rating') ?? '0') || 0
  const availToday    = sp.get('available_today') === '1'
  const sort          = sp.get('sort') ?? 'rating'
  const page          = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
  const offset        = (page - 1) * PAGE_SIZE

  // ── Fetch approved profiles ──────────────────────────────────────────────
  let profileQuery = db
    .from('photographer_profiles')
    .select('id, username, display_name, tagline, bio, location, avatar_url, cover_image_url, rate_display, trust_score, native_avg_rating, native_review_count, created_at', { count: 'exact' })
    .eq('profile_status', 'approved')

  // Text search across name, bio, location
  if (q) {
    profileQuery = profileQuery.or(
      `display_name.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`
    )
  }

  if (minRating > 0) {
    profileQuery = profileQuery.gte('native_avg_rating', minRating)
  }

  // Sort
  switch (sort) {
    case 'reviews':
      profileQuery = profileQuery.order('native_review_count', { ascending: false })
      break
    case 'response':
      profileQuery = profileQuery.order('created_at', { ascending: true })
      break
    default: // 'rating'
      profileQuery = profileQuery.order('native_avg_rating', { ascending: false })
  }

  profileQuery = profileQuery.range(offset, offset + PAGE_SIZE - 1)

  const { data: profiles, error, count } = await profileQuery

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch photographers' }, { status: 500 })
  }

  const photographerIds: string[] = (profiles ?? []).map((p: any) => p.id)

  if (photographerIds.length === 0) {
    return NextResponse.json({ photographers: [], total: count ?? 0, page, pageSize: PAGE_SIZE })
  }

  // ── Fetch specialties for all returned profiles ──────────────────────────
  const { data: allSpecialties } = await db
    .from('photographer_specialties')
    .select('photographer_id, specialty')
    .in('photographer_id', photographerIds)

  const specialtyMap: Record<string, string[]> = {}
  for (const s of allSpecialties ?? []) {
    if (!specialtyMap[s.photographer_id]) specialtyMap[s.photographer_id] = []
    specialtyMap[s.photographer_id].push(s.specialty)
  }

  // ── Filter by specialty (post-fetch since specialties are in a join table) ─
  let filtered = (profiles ?? []).filter((p: any) => {
    if (!specialty) return true
    const sps = specialtyMap[p.id] ?? []
    return sps.some((s: string) => s.toLowerCase() === specialty.toLowerCase())
  })

  // ── Filter by neighbourhood (location contains the neighbourhood label) ──
  if (neighbourhood) {
    filtered = filtered.filter((p: any) =>
      (p.location ?? '').toLowerCase().includes(neighbourhood.toLowerCase())
    )
  }

  // ── Available today filter ────────────────────────────────────────────────
  let availableIds: Set<string> | null = null
  if (availToday) {
    const today = new Date().toISOString().slice(0, 10)
    const { data: avail } = await db
      .from('availability_day_status')
      .select('photographer_id')
      .eq('date', today)
      .eq('status', 'available')
      .in('photographer_id', photographerIds)

    availableIds = new Set((avail ?? []).map((a: any) => a.photographer_id))
    filtered = filtered.filter((p: any) => availableIds!.has(p.id))
  }

  // ── Check today availability for display purposes (even when not filtering) ─
  let availTodaySet: Set<string> = new Set()
  if (!availToday) {
    const today = new Date().toISOString().slice(0, 10)
    const filteredIds = filtered.map((p: any) => p.id)
    if (filteredIds.length > 0) {
      const { data: avail } = await db
        .from('availability_day_status')
        .select('photographer_id')
        .eq('date', today)
        .eq('status', 'available')
        .in('photographer_id', filteredIds)
      availTodaySet = new Set((avail ?? []).map((a: any) => a.photographer_id))
    }
  } else {
    availTodaySet = availableIds ?? new Set()
  }

  const photographers = filtered.map((p: any) => {
    const specialties = specialtyMap[p.id] ?? []

    return {
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      tagline: p.tagline ?? '',
      bio: p.bio ?? '',
      location: p.location ?? '',
      avatar_url: p.avatar_url ?? null,
      cover_src: p.cover_image_url ?? null,
      rate_display: p.rate_display ?? '',
      trust_score: Number(p.trust_score ?? 0),
      native_avg_rating: Number(p.native_avg_rating ?? 0),
      native_review_count: p.native_review_count ?? 0,
      specialties,
      available_today: availTodaySet.has(p.id),
    }
  })

  return NextResponse.json({
    photographers,
    total: count ?? photographers.length,
    page,
    pageSize: PAGE_SIZE,
  })
}

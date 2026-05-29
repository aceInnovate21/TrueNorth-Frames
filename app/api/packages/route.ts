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

// GET /api/packages
// Query params: q, billing_type, specialty, neighbourhood, min_price, max_price, sort, page
export async function GET(request: NextRequest) {
  const db = getDb()
  const sp = request.nextUrl.searchParams

  const q             = sp.get('q')?.trim() ?? ''
  const billingType   = sp.get('billing_type')?.trim() ?? ''  // 'hourly' | 'package'
  const specialty     = sp.get('specialty')?.trim() ?? ''
  const neighbourhood = sp.get('neighbourhood')?.trim() ?? ''
  const minPrice      = parseFloat(sp.get('min_price') ?? '0') || 0
  const maxPrice      = parseFloat(sp.get('max_price') ?? '0') || 0
  const sort          = sp.get('sort') ?? 'popular'           // 'popular' | 'price_asc' | 'price_desc'
  const page          = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
  const offset        = (page - 1) * PAGE_SIZE

  // ── Fetch active packages from approved photographers ────────────────────
  let pkgQuery = db
    .from('packages')
    .select(`
      id, name, description, billing_type, price, deliverables, is_popular, sort_order, banner_url, specialty,
      photographer:photographer_profiles!photographer_id (
        id, username, display_name, location, avatar_url,
        profile_status
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .eq('photographer.profile_status', 'approved')

  if (billingType === 'hourly' || billingType === 'package') {
    pkgQuery = pkgQuery.eq('billing_type', billingType)
  }

  // ── Specialty filter directly on package.specialty column ────────────────
  if (specialty) {
    pkgQuery = pkgQuery.ilike('specialty', specialty)
  }

  if (q) {
    pkgQuery = pkgQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }

  if (minPrice > 0) pkgQuery = pkgQuery.gte('price', minPrice)
  if (maxPrice > 0) pkgQuery = pkgQuery.lte('price', maxPrice)

  switch (sort) {
    case 'price_asc':  pkgQuery = pkgQuery.order('price', { ascending: true });  break
    case 'price_desc': pkgQuery = pkgQuery.order('price', { ascending: false }); break
    default:           pkgQuery = pkgQuery.order('is_popular', { ascending: false }).order('sort_order', { ascending: true })
  }

  pkgQuery = pkgQuery.range(offset, offset + PAGE_SIZE - 1)

  const { data: packages, error, count } = await pkgQuery

  if (error) {
    console.error('[/api/packages] query error:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }

  // Filter out packages where photographer join returned null (non-approved)
  let filtered = (packages ?? []).filter((pkg: any) => pkg.photographer != null)

  // ── Neighbourhood filter ──────────────────────────────────────────────────
  if (neighbourhood) {
    filtered = filtered.filter((pkg: any) =>
      (pkg.photographer.location ?? '').toLowerCase().includes(neighbourhood.toLowerCase())
    )
  }

  // ── Search photographer name too ──────────────────────────────────────────
  if (q) {
    const ql = q.toLowerCase()
    filtered = filtered.filter((pkg: any) =>
      pkg.name?.toLowerCase().includes(ql) ||
      pkg.description?.toLowerCase().includes(ql) ||
      pkg.photographer.display_name?.toLowerCase().includes(ql)
    )
  }

  // ── Fetch photographer specialties for card display ───────────────────────
  const photographerIds = Array.from(new Set(filtered.map((pkg: any) => pkg.photographer.id))) as string[]
  let specialtyMap: Record<string, string[]> = {}
  if (photographerIds.length > 0) {
    const { data: specs } = await db
      .from('photographer_specialties')
      .select('photographer_id, specialty')
      .in('photographer_id', photographerIds)
    for (const s of specs ?? []) {
      if (!specialtyMap[s.photographer_id]) specialtyMap[s.photographer_id] = []
      specialtyMap[s.photographer_id].push(s.specialty)
    }
  }

  const result = filtered.map((pkg: any) => ({
    id:           pkg.id,
    name:         pkg.name,
    description:  pkg.description ?? '',
    billing_type: pkg.billing_type,
    price:        Number(pkg.price),
    deliverables: pkg.deliverables ?? [],
    is_popular:   pkg.is_popular ?? false,
    banner_url:   pkg.banner_url ?? null,
    specialty:    pkg.specialty ?? null,
    photographer: {
      id:           pkg.photographer.id,
      username:     pkg.photographer.username,
      display_name: pkg.photographer.display_name,
      location:     pkg.photographer.location ?? '',
      avatar_url:   pkg.photographer.avatar_url ?? null,
      specialties:  specialtyMap[pkg.photographer.id] ?? [],
    },
  }))

  return NextResponse.json({
    packages: result,
    total: count ?? result.length,
    page,
    pageSize: PAGE_SIZE,
  })
}

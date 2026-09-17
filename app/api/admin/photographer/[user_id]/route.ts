import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, notFound } from '@/lib/api-helpers'
import { computeCompleteness } from '@/lib/completeness'

// GET /api/admin/photographer/[user_id]
// Admin-only. Returns a photographer's full submitted profile — regardless of
// profile_status — so an admin can vet the account before approving. The public
// profile API filters to approved profiles, so it can't preview a pending one.
export async function GET(
  _request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: me } = await db.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profile } = await db
    .from('photographer_profiles')
    .select(`
      id, user_id, username, display_name, tagline, bio, location,
      avatar_url, cover_image_url, website_url, instagram_url,
      contact_instagram_url, contact_facebook_url,
      rate_display, rate_note, trust_score, native_avg_rating, native_review_count,
      years_experience, completeness_score, profile_status, status_note, created_at
    `)
    .eq('user_id', params.user_id)
    .maybeSingle()

  if (!profile) return notFound('Photographer profile not found')

  const photographerId = profile.id

  const [
    { data: account },
    { data: specialties },
    { data: links },
    { data: packages },
    { data: faqs },
    { data: portfolioPhotos },
    { data: weeklySlots },
    { data: dayStatuses },
  ] = await Promise.all([
    db.from('users').select('email, full_name, account_status, created_at').eq('id', params.user_id).maybeSingle(),
    db.from('photographer_specialties').select('specialty').eq('photographer_id', photographerId),
    db.from('external_platform_links')
      .select('platform, profile_url, platform_rating, platform_review_count, platform_username, is_verified, is_oauth_connected')
      .eq('photographer_id', photographerId),
    db.from('packages')
      .select('id, name, description, billing_type, price, is_active, specialty')
      .eq('photographer_id', photographerId)
      .order('sort_order', { ascending: true }),
    db.from('photographer_faqs')
      .select('id, question, answer')
      .eq('photographer_id', photographerId)
      .order('sort_order', { ascending: true }),
    db.from('portfolio_photos')
      .select('id, caption, storage_asset_id, sort_order')
      .eq('photographer_id', photographerId)
      .order('sort_order', { ascending: true }),
    db.from('weekly_time_slots').select('day_of_week').eq('photographer_id', photographerId).eq('is_active', true),
    db.from('availability_day_status').select('status').eq('photographer_id', photographerId),
  ])

  // Resolve portfolio photo storage keys → public R2 URLs.
  const assetIds = Array.from(new Set((portfolioPhotos ?? []).map((p: any) => p.storage_asset_id).filter(Boolean)))
  const keyMap: Record<string, string> = {}
  if (assetIds.length > 0) {
    const { data: assets } = await db.from('storage_assets').select('id, key').in('id', assetIds)
    for (const a of assets ?? []) keyMap[a.id] = a.key
  }
  const r2Base = process.env.R2_PUBLIC_URL ?? ''

  // Completeness is derived live from real signals — the stored
  // completeness_score column is not kept up to date (defaults to 0).
  const gbpConnected = (links ?? []).some(
    (l: any) => l.platform === 'google' && l.is_oauth_connected
  )
  const availabilitySet =
    (weeklySlots ?? []).length > 0 ||
    (dayStatuses ?? []).some((d: any) => ['available', 'busy', 'tentative'].includes(d.status))
  const completenessScore = computeCompleteness({
    displayName:         profile.display_name,
    bio:                 profile.bio,
    location:            profile.location,
    rate:                profile.rate_display,
    avatarUrl:           profile.avatar_url,
    specialtyCount:      (specialties ?? []).length,
    portfolioPhotoCount: (portfolioPhotos ?? []).length,
    availabilitySet,
    faqCount:            (faqs ?? []).length,
    isGbpOAuthConnected: gbpConnected,
  })

  return NextResponse.json({
    user_id: profile.user_id,
    username: profile.username,
    display_name: profile.display_name,
    tagline: profile.tagline ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    avatar_url: profile.avatar_url ?? null,
    cover_image_url: profile.cover_image_url ?? null,
    website_url: profile.website_url ?? '',
    instagram_url: profile.instagram_url ?? '',
    contact_instagram_url: profile.contact_instagram_url ?? null,
    contact_facebook_url: profile.contact_facebook_url ?? null,
    rate_display: profile.rate_display ?? '',
    rate_note: profile.rate_note ?? '',
    trust_score: profile.trust_score ?? 0,
    native_avg_rating: profile.native_avg_rating ?? 0,
    native_review_count: profile.native_review_count ?? 0,
    years_experience: profile.years_experience ?? null,
    completeness_score: completenessScore,
    profile_status: profile.profile_status,
    status_note: profile.status_note ?? null,
    created_at: profile.created_at,
    email: account?.email ?? null,
    full_name: account?.full_name ?? null,
    account_status: account?.account_status ?? null,
    specialties: (specialties ?? []).map((s: any) => s.specialty),
    links: (links ?? []).map((l: any) => ({
      platform: l.platform,
      url: l.profile_url,
      username: l.platform_username ?? null,
      rating: l.platform_rating ?? null,
      review_count: l.platform_review_count ?? null,
      is_verified: l.is_verified ?? false,
      is_oauth_connected: l.is_oauth_connected ?? false,
    })),
    packages: (packages ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      billingType: p.billing_type,
      price: p.price,
      isActive: p.is_active ?? true,
      specialty: p.specialty ?? null,
    })),
    faqs: (faqs ?? []).map((f: any) => ({ id: f.id, question: f.question, answer: f.answer })),
    portfolio_photos: (portfolioPhotos ?? []).map((ph: any) => ({
      id: ph.id,
      src: keyMap[ph.storage_asset_id] ? `${r2Base}/${keyMap[ph.storage_asset_id]}` : '',
      caption: ph.caption ?? '',
    })),
  })
}

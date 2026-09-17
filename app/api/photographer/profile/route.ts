import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

// Parse "$150 / hr" → { amount: "150", unit: "hr" }
function parseRateDisplay(rateDisplay: string | null): { amount: string; unit: string } {
  if (!rateDisplay) return { amount: '', unit: 'hr' }
  const match = rateDisplay.match(/\$?(\d+(?:\.\d+)?)\s*\/\s*(.+)/)
  if (!match) return { amount: '', unit: 'hr' }
  const unitMap: Record<string, string> = { hr: 'hr', 'half day': 'half', 'full day': 'full' }
  return { amount: match[1], unit: unitMap[match[2].trim()] ?? 'hr' }
}

function formatRateDisplay(amount: string, unit: string): string | null {
  if (!amount) return null
  const labelMap: Record<string, string> = { hr: 'hr', half: 'half day', full: 'full day' }
  return `$${parseFloat(amount).toFixed(0)} / ${labelMap[unit] ?? 'hr'}`
}

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data: profile, error: profileError } = await db
    .from('photographer_profiles')
    .select('id, username, display_name, bio, location, rate_display, website_url, instagram_url, avatar_url, cover_image_url, contact_instagram_url, contact_facebook_url, completeness_score, trust_score, native_avg_rating, native_review_count, years_experience, created_at, profile_status, status_note')
    .eq('user_id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    return serverError('Failed to load profile')
  }

  const photographerId = profile?.id ?? null

  let specialties: string[] = []
  let linksMap: Record<string, string> = {}
  let gbpReviewCount = 0
  let isGbpOAuthConnected = false
  let portfolioPhotoCount = 0
  let completedBookings = 0

  if (photographerId) {
    const [
      { data: specialtyRows },
      { data: linkRows },
      { data: gbpLink },
      { data: oauthRow },
      { data: photoRows },
      { count: bookingCount },
    ] = await Promise.all([
      db.from('photographer_specialties').select('specialty').eq('photographer_id', photographerId),
      db.from('external_platform_links').select('platform, profile_url').eq('photographer_id', photographerId),
      db.from('external_platform_links').select('platform_review_count').eq('photographer_id', photographerId).eq('platform', 'google').maybeSingle(),
      db.from('platform_oauth_tokens').select('photographer_id').eq('photographer_id', photographerId).eq('platform', 'google').eq('is_active', true).maybeSingle(),
      db.from('portfolio_photos').select('id').eq('photographer_id', photographerId),
      db.from('booking_requests').select('*', { count: 'exact', head: true }).eq('photographer_id', photographerId).eq('status', 'completed'),
    ])

    specialties = (specialtyRows ?? []).map((s: { specialty: string }) => s.specialty)
    for (const link of linkRows ?? []) linksMap[link.platform] = link.profile_url
    gbpReviewCount = gbpLink?.platform_review_count ?? 0
    isGbpOAuthConnected = !!oauthRow
    portfolioPhotoCount = (photoRows ?? []).length
    completedBookings = bookingCount ?? 0
  }

  // Read the onboarding-tour flag separately and defensively: if migration 036
  // hasn't been applied yet, this column won't exist — swallow the error and
  // treat the tour as "not completed" rather than 500-ing the whole profile.
  let onboardingTourCompleted = false
  if (photographerId) {
    try {
      const { data: tourRow } = await db
        .from('photographer_profiles')
        .select('onboarding_tour_completed_at')
        .eq('id', photographerId)
        .single()
      onboardingTourCompleted = !!tourRow?.onboarding_tour_completed_at
    } catch {
      onboardingTourCompleted = false
    }
  }

  const { amount, unit } = parseRateDisplay(profile?.rate_display ?? null)

  const accountAgeDays = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 86400))
    : 0

  return NextResponse.json({
    username:              profile?.username ?? '',
    display_name:          profile?.display_name ?? '',
    bio:                   profile?.bio ?? '',
    location:              profile?.location ?? '',
    rate_amount:           amount,
    rate_unit:             unit,
    website_url:           profile?.website_url ?? '',
    avatar_url:            profile?.avatar_url ?? '',
    cover_image_url:       profile?.cover_image_url ?? '',
    specialties,
    google_url:            linksMap['google'] ?? '',
    instagram_url:         profile?.instagram_url ?? linksMap['instagram'] ?? '',
    yelp_url:              linksMap['yelp'] ?? '',
    contact_instagram_url: profile?.contact_instagram_url ?? '',
    contact_facebook_url:  profile?.contact_facebook_url ?? '',
    // Badge signal data
    completeness_score:    Number(profile?.completeness_score ?? 0),
    trust_score:           Number(profile?.trust_score ?? 0),
    native_avg_rating:     Number(profile?.native_avg_rating ?? 0),
    native_review_count:   profile?.native_review_count ?? 0,
    years_experience:      profile?.years_experience ?? null,
    profile_status:        profile?.profile_status ?? 'pending',
    status_note:           profile?.status_note ?? null,
    onboarding_tour_completed: onboardingTourCompleted,
    portfolio_photo_count: portfolioPhotoCount,
    completed_bookings:    completedBookings,
    is_gbp_oauth_connected: isGbpOAuthConnected,
    gbp_review_count:      gbpReviewCount,
    account_age_days:      accountAgeDays,
  })
}

export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { section } = body

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')
  const photographerId = profile.id

  if (section === 'basics') {
    const { display_name, bio, location, rate_amount, rate_unit, website_url, years_experience } = body

    if (!display_name?.trim()) return badRequest('display_name is required')

    const rateDisplay = formatRateDisplay(rate_amount, rate_unit)

    const { error: userError } = await db
      .from('users')
      .update({ full_name: display_name.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (userError) return serverError(`Failed to update name: ${userError.message}`)

    const { error: profileError } = await db
      .from('photographer_profiles')
      .update({
        display_name: display_name.trim(),
        bio: bio?.trim() || null,
        location: location?.trim() || null,
        rate_display: rateDisplay,
        website_url: website_url?.trim() || null,
        ...(years_experience != null ? { years_experience: Number(years_experience) } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', photographerId)

    if (profileError) return serverError(`Failed to update profile: ${profileError.message}`)

    return NextResponse.json({ success: true })
  }

  if (section === 'specialties') {
    const { specialties } = body
    if (!Array.isArray(specialties)) return badRequest('specialties must be an array')
    if (specialties.length > 5) return badRequest('Maximum 5 specialties')

    await db.from('photographer_specialties').delete().eq('photographer_id', photographerId)

    if (specialties.length > 0) {
      const rows = specialties.map((s: string) => ({
        photographer_id: photographerId,
        specialty: s,
      }))
      const { error } = await db.from('photographer_specialties').insert(rows)
      if (error) return serverError('Failed to save specialties')
    }

    return NextResponse.json({ success: true })
  }

  if (section === 'links') {
    const { google_url, instagram_url, yelp_url } = body

    // instagram_url lives directly on photographer_profiles as well
    await db
      .from('photographer_profiles')
      .update({ instagram_url: instagram_url?.trim() || null })
      .eq('id', photographerId)

    const platforms = [
      { platform: 'google', url: google_url?.trim() || null },
      { platform: 'instagram', url: instagram_url?.trim() || null },
      { platform: 'yelp', url: yelp_url?.trim() || null },
    ]

    for (const { platform, url } of platforms) {
      if (url) {
        await db
          .from('external_platform_links')
          .upsert(
            { photographer_id: photographerId, platform, profile_url: url, is_verified: false },
            { onConflict: 'photographer_id,platform' }
          )
      } else {
        await db
          .from('external_platform_links')
          .delete()
          .eq('photographer_id', photographerId)
          .eq('platform', platform)
      }
    }

    return NextResponse.json({ success: true })
  }

  if (section === 'contacts') {
    const { contact_instagram_url, contact_facebook_url, website_url } = body

    const { error } = await db
      .from('photographer_profiles')
      .update({
        website_url: website_url?.trim() || null,
        contact_instagram_url: contact_instagram_url?.trim() || null,
        contact_facebook_url: contact_facebook_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', photographerId)

    if (error) return serverError(`Failed to save links: ${error.message}`)
    return NextResponse.json({ success: true })
  }

  return badRequest('Unknown section')
}

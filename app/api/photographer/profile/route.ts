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

  // Try with new contact columns first; fall back to base select if columns don't exist yet
  let profileResult = await db
    .from('photographer_profiles')
    .select('id, username, display_name, bio, location, rate_display, website_url, instagram_url, avatar_url, cover_image_url, contact_instagram_url, contact_facebook_url')
    .eq('user_id', user.id)
    .single()

  if (profileResult.error && profileResult.error.code !== 'PGRST116') {
    // Columns may not exist yet — retry with minimal set
    profileResult = await db
      .from('photographer_profiles')
      .select('id, username, display_name, bio, location, rate_display, website_url, instagram_url, avatar_url, cover_image_url')
      .eq('user_id', user.id)
      .single()
    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      return serverError('Failed to load profile')
    }
  }

  const { data: profile } = profileResult

  const photographerId = profile?.id ?? null

  let specialties: string[] = []
  let linksMap: Record<string, string> = {}

  if (photographerId) {
    const { data: specialtyRows } = await db
      .from('photographer_specialties')
      .select('specialty')
      .eq('photographer_id', photographerId)

    specialties = (specialtyRows ?? []).map((s: { specialty: string }) => s.specialty)

    const { data: linkRows } = await db
      .from('external_platform_links')
      .select('platform, profile_url')
      .eq('photographer_id', photographerId)

    for (const link of linkRows ?? []) {
      linksMap[link.platform] = link.profile_url
    }
  }

  const { amount, unit } = parseRateDisplay(profile?.rate_display ?? null)

  return NextResponse.json({
    username: profile?.username ?? '',
    display_name: profile?.display_name ?? '',
    bio: profile?.bio ?? '',
    location: profile?.location ?? '',
    rate_amount: amount,
    rate_unit: unit,
    website_url: profile?.website_url ?? '',
    avatar_url: profile?.avatar_url ?? '',
    cover_image_url: profile?.cover_image_url ?? '',
    specialties,
    google_url: linksMap['google'] ?? '',
    instagram_url: profile?.instagram_url ?? linksMap['instagram'] ?? '',
    yelp_url: linksMap['yelp'] ?? '',
    contact_instagram_url: profile?.contact_instagram_url ?? '',
    contact_facebook_url: profile?.contact_facebook_url ?? '',
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
    const { display_name, bio, location, rate_amount, rate_unit, website_url } = body

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

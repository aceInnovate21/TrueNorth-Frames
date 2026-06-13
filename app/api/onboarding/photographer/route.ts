import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { Resend } from 'resend'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

async function uniqueUsername(db: any, base: string): Promise<string> {
  let username = slugify(base)
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? username : `${username}-${suffix}`
    const { data } = await db
      .from('photographer_profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle()
    if (!data) return candidate
    suffix++
  }
}

export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const {
    first_name, last_name, display_name, bio, location, rate,
    specialties = [], website_url, years_experience,
    has_gbp, has_gbp_reviews, has_website,
  } = body

  if (!display_name?.trim()) return badRequest('display_name is required')
  if (!bio?.trim() || bio.trim().length < 20) return badRequest('bio must be at least 20 characters')
  if (!location?.trim()) return badRequest('location is required')
  if (!rate) return badRequest('rate is required')

  console.log('[onboarding/photographer] user:', user.id, 'display_name:', display_name)

  const fullName = first_name && last_name
    ? `${first_name.trim()} ${last_name.trim()}`
    : display_name.trim()

  const db = adminDb as any

  // Ensure public.users row exists — Google OAuth users sometimes reach onboarding
  // without completing role-select (e.g. direct URL navigation). Insert only if missing.
  const { data: existingUser } = await db.from('users').select('id').eq('id', user.id).maybeSingle()
  if (!existingUser) {
    const { error: userInsertError } = await db.from('users').insert({
      id: user.id,
      email: user.email,
      role: 'photographer',
      full_name: fullName,
      account_status: 'active',
      is_verified: false,
    })
    if (userInsertError) {
      console.error('[onboarding/photographer] users insert error:', JSON.stringify(userInsertError))
      return serverError('Failed to create user record')
    }
  }

  // Update public.users name
  await db
    .from('users')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  const rateNum = parseFloat(rate)
  const rateDisplay = `$${rateNum.toFixed(0)} / hr`

  // Check if profile already exists — if so, keep the existing username
  const { data: existingProfile } = await db
    .from('photographer_profiles')
    .select('id, username')
    .eq('user_id', user.id)
    .maybeSingle()

  // Only generate a new username for brand-new profiles
  const username = existingProfile?.username ?? await uniqueUsername(db, display_name)

  // Delete-then-insert — avoids upsert/conflict issues (same pattern as client_profiles)
  await db.from('photographer_profiles').delete().eq('user_id', user.id)

  const { data: profile, error: profileError } = await db
    .from('photographer_profiles')
    .insert({
      user_id: user.id,
      username,
      display_name: display_name.trim(),
      bio: bio.trim().slice(0, 1200),
      location: location.trim(),
      rate_display: rateDisplay,
      profile_status: 'pending',
      ...(years_experience != null ? { years_experience: Number(years_experience) } : {}),
      website_url: website_url?.trim() || null,
      ...(has_gbp != null ? { has_gbp_self_reported: has_gbp } : {}),
      ...(has_gbp_reviews != null ? { has_gbp_reviews_self_reported: has_gbp_reviews } : {}),
      ...(has_website != null ? { has_website_self_reported: has_website } : {}),
    })
    .select('id')
    .single()

  if (profileError || !profile) {
    console.error('[onboarding/photographer] insert error:', JSON.stringify(profileError))
    return serverError('Failed to save photographer profile')
  }

  const photographerId = profile.id

  // Insert specialties
  if (specialties.length > 0) {
    const rows = specialties
      .slice(0, 5)
      .map((s: string) => ({ photographer_id: photographerId, specialty: s }))

    await db
      .from('photographer_specialties')
      .upsert(rows, { onConflict: 'photographer_id,specialty' })
  }

  // Send welcome email now that onboarding is complete
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const firstName = fullName.split(' ')[0]
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'hello@thetruenorthframes.com',
      to: user.email!,
      template: {
        id: process.env.RESEND_TEMPLATE_WELCOME_PHOTOGRAPHER!,
        variables: { USER_NAME: firstName },
      },
    } as any)
  } catch (e) {
    console.error('[onboarding/photographer] welcome email error:', e)
  }

  return NextResponse.json({ success: true, username })
}

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

  // public.users is guaranteed to exist by DB trigger on auth.users INSERT.
  // Just update role + name now that we know the real values.
  const { error: upsertUserError } = await db.from('users').upsert({
    id: user.id,
    email: user.email,
    role: 'photographer',
    full_name: fullName,
    account_status: 'active',
    is_verified: false,
  }, { onConflict: 'id', ignoreDuplicates: false })

  if (upsertUserError) {
    console.error('[onboarding/photographer] users upsert error:', JSON.stringify(upsertUserError))
    return serverError('Failed to update user record')
  }

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

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const firstName = fullName.split(' ')[0]

  // Welcome email to photographer
  try {
    await resend.emails.send({
      from: `TrueNorth Frames <${process.env.RESEND_FROM_EMAIL ?? 'no-reply@thetruenorthframes.com'}>`,
      to: user.email!,
      template: {
        id: process.env.RESEND_TEMPLATE_WELCOME_PHOTOGRAPHER!,
        variables: { USER_NAME: firstName },
      },
    } as any)
  } catch (e) {
    console.error('[onboarding/photographer] welcome email error:', e)
  }

  // Notify admin — new photographer needs approval
  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'aceinnovate21@gmail.com'
    await resend.emails.send({
      from: `TrueNorth Frames <${process.env.RESEND_FROM_EMAIL ?? 'no-reply@thetruenorthframes.com'}>`,
      to: adminEmail,
      template: {
        id: process.env.RESEND_TEMPLATE_SUPPORT_TICKET_CREATED!,
        variables: {
          TICKET_ID: `TNF-${photographerId.slice(0, 6).toUpperCase()}`,
          SUBJECT: `New photographer profile — ${display_name.trim()}`,
          CATEGORY: 'photographer_approval',
          SUBMITTER_NAME: fullName,
          SUBMITTER_ROLE: 'photographer',
          DESCRIPTION: `${fullName} (${user.email}) has completed onboarding and is waiting for approval.\n\nBio: ${bio.trim().slice(0, 200)}\nLocation: ${location}\nRate: ${rateDisplay}\nUsername: ${username}`,
        },
      },
    } as any)
  } catch (e) {
    console.error('[onboarding/photographer] admin notification error:', e)
  }

  return NextResponse.json({ success: true, username })
}

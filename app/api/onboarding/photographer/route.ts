import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

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
    specialties = [], website_url,
  } = body

  if (!display_name?.trim()) return badRequest('display_name is required')
  if (!bio?.trim() || bio.trim().length < 20) return badRequest('bio must be at least 20 characters')
  if (!location?.trim()) return badRequest('location is required')
  if (!rate) return badRequest('rate is required')

  const fullName = first_name && last_name
    ? `${first_name.trim()} ${last_name.trim()}`
    : display_name.trim()

  const db = adminDb as any

  // Update public.users name
  await db
    .from('users')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  // Generate unique username from display name
  const username = await uniqueUsername(db, display_name)

  const rateNum = parseFloat(rate)
  const rateDisplay = `$${rateNum.toFixed(0)} / hr`

  // Upsert photographer_profiles
  const { data: profile, error: profileError } = await db
    .from('photographer_profiles')
    .upsert({
      user_id: user.id,
      username,
      display_name: display_name.trim(),
      bio: bio.trim().slice(0, 1200),
      location: location.trim(),
      rate_display: rateDisplay,
      profile_status: 'approved',
      approved_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('id')
    .single()

  if (profileError || !profile) return serverError('Failed to save photographer profile')

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

  // Save website to photographer_profiles
  if (website_url?.trim()) {
    await db
      .from('photographer_profiles')
      .update({ website_url: website_url.trim() })
      .eq('id', photographerId)
  }

  return NextResponse.json({ success: true, username })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { first_name, last_name, location } = body

  if (!first_name?.trim() || !last_name?.trim()) {
    return badRequest('first_name and last_name are required')
  }

  const fullName = `${first_name.trim()} ${last_name.trim()}`
  const db = adminDb as any

  // public.users is guaranteed to exist by DB trigger on auth.users INSERT.
  // Just update role + name now that we know the real values.
  const { error: upsertUserError } = await db.from('users').upsert({
    id: user.id,
    email: user.email,
    role: 'client',
    full_name: fullName,
    account_status: 'active',
    is_verified: false,
  }, { onConflict: 'id', ignoreDuplicates: false })

  if (upsertUserError) {
    console.error('[onboarding/client] users upsert error:', JSON.stringify(upsertUserError))
    return serverError('Failed to update user record')
  }

  // Delete existing row then insert fresh — avoids any upsert/conflict issues
  await db.from('client_profiles').delete().eq('user_id', user.id)

  const { error } = await db
    .from('client_profiles')
    .insert({ user_id: user.id, location: location?.trim() || null })

  if (error) {
    console.error('[onboarding/client] insert error:', JSON.stringify(error))
    return serverError('Failed to save profile')
  }

  // Send welcome email now that onboarding is complete
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const firstName = fullName.split(' ')[0]
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'hello@thetruenorthframes.com',
      to: user.email!,
      template: {
        id: process.env.RESEND_TEMPLATE_WELCOME_CLIENT!,
        variables: { USER_NAME: firstName },
      },
    } as any)
  } catch (e) {
    console.error('[onboarding/client] welcome email error:', e)
  }

  return NextResponse.json({ success: true })
}

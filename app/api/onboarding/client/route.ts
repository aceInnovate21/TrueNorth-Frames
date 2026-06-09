import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

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

  // Ensure public.users row exists before touching client_profiles (FK constraint).
  // /api/auth/register may not have committed yet if the user navigated here quickly.
  const { data: existingUser } = await db.from('users').select('id').eq('id', user.id).maybeSingle()
  if (!existingUser) {
    const { error: userInsertError } = await db.from('users').insert({
      id: user.id,
      email: user.email,
      role: 'client',
      full_name: fullName,
      account_status: 'active',
      is_verified: false,
    })
    if (userInsertError && userInsertError.code !== '23505') {
      console.error('[onboarding/client] users insert error:', JSON.stringify(userInsertError))
      return serverError('Failed to create user record')
    }
  }

  // Update name in public.users
  await db
    .from('users')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  // Delete existing row then insert fresh — avoids any upsert/conflict issues
  await db.from('client_profiles').delete().eq('user_id', user.id)

  const { error } = await db
    .from('client_profiles')
    .insert({ user_id: user.id, location: location?.trim() || null })

  if (error) {
    console.error('[onboarding/client] insert error:', JSON.stringify(error))
    return serverError('Failed to save profile')
  }

  return NextResponse.json({ success: true })
}

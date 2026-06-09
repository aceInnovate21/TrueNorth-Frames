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

  // Update public.users name
  const { error: userError } = await db
    .from('users')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (userError) return serverError('Failed to update user')

  // Check if client_profile exists — update if so, insert if not
  const { data: existing } = await db
    .from('client_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error: profileError } = await db
      .from('client_profiles')
      .update({ location: location?.trim() || null })
      .eq('user_id', user.id)
    if (profileError) return serverError('Failed to update profile')
  } else {
    const { error: profileError } = await db
      .from('client_profiles')
      .insert({ user_id: user.id, location: location?.trim() || null })
    if (profileError) return serverError('Failed to save profile')
  }

  return NextResponse.json({ success: true })
}

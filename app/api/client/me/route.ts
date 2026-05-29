import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

// GET /api/client/me
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const [{ data: userData }, { data: profile }, { data: interests }] = await Promise.all([
    db.from('users').select('id, full_name, email, created_at, role').eq('id', user.id).single(),
    db.from('client_profiles').select('bio, location, avatar_url').eq('user_id', user.id).maybeSingle(),
    db.from('client_interests').select('interest').eq('user_id', user.id),
  ])

  if (!userData) return serverError('User not found')

  return NextResponse.json({
    id: userData.id,
    full_name: userData.full_name,
    email: userData.email,
    role: userData.role,
    created_at: userData.created_at,
    bio: profile?.bio ?? '',
    location: profile?.location ?? '',
    avatar_url: profile?.avatar_url ?? null,
    interests: (interests ?? []).map((i: any) => i.interest),
  })
}

// PATCH /api/client/me — update profile fields and interests
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { full_name, bio, location, interests } = body

  if (full_name !== undefined && !full_name?.trim()) return badRequest('Name cannot be empty')

  // Update users.full_name
  if (full_name !== undefined) {
    const { error } = await db
      .from('users')
      .update({ full_name: full_name.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) return serverError('Failed to update name')
  }

  // Upsert client_profiles
  if (bio !== undefined || location !== undefined) {
    const { error } = await db
      .from('client_profiles')
      .upsert({
        user_id: user.id,
        ...(bio !== undefined ? { bio: bio?.trim() ?? null } : {}),
        ...(location !== undefined ? { location: location?.trim() ?? null } : {}),
      }, { onConflict: 'user_id' })
    if (error) return serverError('Failed to update profile')
  }

  // Replace interests (delete + insert)
  if (Array.isArray(interests)) {
    await db.from('client_interests').delete().eq('user_id', user.id)
    if (interests.length > 0) {
      const rows = interests.slice(0, 6).map((i: string) => ({ user_id: user.id, interest: i }))
      const { error } = await db.from('client_interests').insert(rows)
      if (error) return serverError('Failed to save interests')
    }
  }

  return NextResponse.json({ success: true })
}

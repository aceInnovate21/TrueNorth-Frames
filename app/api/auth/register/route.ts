import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { badRequest, serverError } from '@/lib/api-helpers'

// Called right after supabase.auth.signUp() on the client.
// Accepts either access_token (if email confirmation is off) or user_id directly.
// Inserts the public.users row using the service role key (bypasses RLS).
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { access_token, user_id, role, full_name, email } = body

  if (!role || !['photographer', 'client'].includes(role)) return badRequest('Invalid role')
  if (!full_name?.trim()) return badRequest('full_name is required')

  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any

  let resolvedUserId = user_id as string | undefined

  // If we have an access token, verify it to get the user id
  if (access_token && !resolvedUserId) {
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: { user } } = await authClient.auth.getUser(access_token)
    resolvedUserId = user?.id
  }

  if (!resolvedUserId) return NextResponse.json({ error: 'Could not resolve user' }, { status: 401 })

  const { error } = await adminDb.from('users').insert({
    id: resolvedUserId,
    email,
    role,
    full_name: full_name.trim(),
    account_status: 'active',
    is_verified: false,
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: true }) // already exists
    return serverError(`Failed to create user record: ${error.message}`)
  }

  return NextResponse.json({ success: true })
}

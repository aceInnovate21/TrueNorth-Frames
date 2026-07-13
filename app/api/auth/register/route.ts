import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { badRequest, serverError } from '@/lib/api-helpers'

// Called right after supabase.auth.signUp() / OAuth on the client.
// Inserts the public.users row using the service role key (bypasses RLS).
//
// SECURITY: identity (user id + email) is derived ONLY from the verified
// access_token — never trusted from the request body. This prevents a caller
// from creating a users row for an arbitrary auth id. The body's user_id/email
// are ignored for identity; role and full_name are the only trusted body fields.
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { access_token, role, full_name } = body

  if (!role || !['photographer', 'client'].includes(role)) return badRequest('Invalid role')
  if (!full_name?.trim()) return badRequest('full_name is required')
  if (!access_token || typeof access_token !== 'string') {
    return NextResponse.json({ error: 'access_token is required' }, { status: 401 })
  }

  // Verify the token → the ONLY source of truth for user id and email.
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user: authUser } } = await authClient.auth.getUser(access_token)

  if (!authUser) return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })

  const resolvedUserId = authUser.id
  const resolvedEmail = authUser.email

  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any

  const { error } = await adminDb.from('users').insert({
    id: resolvedUserId,
    email: resolvedEmail,
    role,
    full_name: full_name.trim(),
    account_status: 'active',
    is_verified: false,
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: true }) // already exists
    return serverError(`Failed to create user record: ${error.message}`)
  }

  // Welcome email is sent from onboarding completion, not here
  return NextResponse.json({ success: true })
}

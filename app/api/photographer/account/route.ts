import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any
  const { data } = await db
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ email: data?.email ?? user.email ?? '' })
}

export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { email } = body

  if (!email?.trim()) return badRequest('Email is required')

  const newEmail = email.trim().toLowerCase()

  // Basic format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return badRequest('Enter a valid email address')
  }

  const db = adminDb as any

  // Layer 1: check public.users for duplicate
  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('email', newEmail)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'This email address is already in use by another account.' },
      { status: 409 }
    )
  }

  // Layer 2: update Supabase Auth — it enforces uniqueness at the Auth level
  // Use admin client so no re-authentication is required
  const authAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error: authError } = await authAdmin.auth.admin.updateUserById(user.id, {
    email: newEmail,
  })

  if (authError) {
    // Supabase returns 422 when the email is already registered in Auth
    if (
      authError.message.toLowerCase().includes('already') ||
      authError.message.toLowerCase().includes('in use') ||
      authError.status === 422
    ) {
      return NextResponse.json(
        { error: 'This email address is already registered.' },
        { status: 409 }
      )
    }
    return serverError(`Failed to update email: ${authError.message}`)
  }

  // Sync public.users to match
  const { error: dbError } = await db
    .from('users')
    .update({ email: newEmail, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (dbError) {
    return serverError('Email updated in Auth but failed to sync to profile — contact support')
  }

  return NextResponse.json({ success: true, email: newEmail })
}

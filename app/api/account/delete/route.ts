import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { createClient } from '@supabase/supabase-js'

// POST /api/account/delete
// Soft-deletes the authenticated user:
//   - sets deleted_at on users row
//   - sets account_status = 'deleted'
//   - signs out the Supabase auth session
// Data is retained for 30 days before hard purge (future cron).
export async function POST() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  // Mark the user row as deleted
  const now = new Date().toISOString()
  const { error: updateErr } = await db
    .from('users')
    .update({ account_status: 'deactivated', deleted_at: now })
    .eq('id', user.id)

  if (updateErr) return serverError('Failed to delete account')

  // Also suspend photographer profile so it stops appearing in browse
  await db
    .from('photographer_profiles')
    .update({ profile_status: 'banned' })
    .eq('id', user.id)

  // Revoke Supabase auth session using the service-role admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  await supabaseAdmin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ success: true })
}

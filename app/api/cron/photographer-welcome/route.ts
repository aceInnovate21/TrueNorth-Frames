import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailDirect } from '@/lib/email/client'

// GET/POST /api/cron/photographer-welcome
// Runs daily. Sends the single "keep your business on TrueNorth Frames" email
// once per photographer, ~a day after they are approved — spaced so it doesn't
// stack with the approval email. The [1 day, 4 days] approved_at window scopes
// it to newly-approved photographers, so existing accounts are never
// mass-emailed when this first ships.
async function processWelcome(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  const isAuthorized =
    authHeader?.replace('Bearer ', '') === process.env.CRON_SECRET ||
    cronHeader === process.env.CRON_SECRET
  if (!isAuthorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ) as any

  const now = Date.now()
  const approvedBefore = new Date(now - 20 * 60 * 60 * 1000).toISOString()      // approved ≥ ~1 day ago
  const approvedAfter = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()   // …but within the last 4 days

  const firstNameOf = (full?: string | null) => (full ?? 'there').split(' ')[0]

  const { data: batch } = await db
    .from('photographer_profiles')
    .select('id, approved_at, welcome_biz_email_at, user:users!user_id(email, full_name)')
    .eq('profile_status', 'approved')
    .lte('approved_at', approvedBefore)
    .gte('approved_at', approvedAfter)
    .is('welcome_biz_email_at', null)

  let sent = 0
  for (const p of batch ?? []) {
    const email: string | undefined = p.user?.email
    if (email) {
      const res = await sendEmailDirect({
        to: email,
        templateId: 'photographer_local_business',
        payload: { firstName: firstNameOf(p.user?.full_name) },
      })
      if (!res.ok) continue
      sent++
    }
    // Stamp regardless of a missing email so the row isn't re-scanned forever.
    await db.from('photographer_profiles')
      .update({ welcome_biz_email_at: new Date().toISOString() })
      .eq('id', p.id)
  }

  return NextResponse.json({ candidates: (batch ?? []).length, sent })
}

export async function GET(request: NextRequest)  { return processWelcome(request) }
export async function POST(request: NextRequest) { return processWelcome(request) }

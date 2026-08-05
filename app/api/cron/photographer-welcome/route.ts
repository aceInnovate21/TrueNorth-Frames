import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailDirect } from '@/lib/email/client'

// GET/POST /api/cron/photographer-welcome
// Runs daily. Drives the 2-part "keep your business on TrueNorth Frames" welcome
// series for newly-approved photographers:
//   • Email 1 — approved within the last 3 days and not yet sent
//   • Email 2 — ~1 day after email 1, once
// The 3-day window on email 1 scopes it to newly-approved photographers, so
// existing approved accounts are never mass-emailed when this first ships.
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
  const approvedSince = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
  const emailedBefore = new Date(now - 20 * 60 * 60 * 1000).toISOString()

  const firstNameOf = (full?: string | null) => (full ?? 'there').split(' ')[0]

  let sent1 = 0
  let sent2 = 0

  // ── Email 1 — newly approved, not yet sent ─────────────────────────────────
  const { data: batch1 } = await db
    .from('photographer_profiles')
    .select('id, welcome_biz_email_1_at, user:users!user_id(email, full_name)')
    .eq('profile_status', 'approved')
    .gte('approved_at', approvedSince)
    .is('welcome_biz_email_1_at', null)

  for (const p of batch1 ?? []) {
    const email: string | undefined = p.user?.email
    if (email) {
      const res = await sendEmailDirect({
        to: email,
        templateId: 'photographer_local_business',
        payload: { firstName: firstNameOf(p.user?.full_name) },
      })
      if (!res.ok) continue
      sent1++
    }
    // Stamp regardless of a missing email so we don't re-scan the row forever.
    await db.from('photographer_profiles')
      .update({ welcome_biz_email_1_at: new Date().toISOString() })
      .eq('id', p.id)
  }

  // ── Email 2 — ~1 day after email 1, once ───────────────────────────────────
  const { data: batch2 } = await db
    .from('photographer_profiles')
    .select('id, user:users!user_id(email, full_name)')
    .not('welcome_biz_email_1_at', 'is', null)
    .lte('welcome_biz_email_1_at', emailedBefore)
    .is('welcome_biz_email_2_at', null)

  for (const p of batch2 ?? []) {
    const email: string | undefined = p.user?.email
    if (email) {
      const res = await sendEmailDirect({
        to: email,
        templateId: 'photographer_local_business_followup',
        payload: { firstName: firstNameOf(p.user?.full_name) },
      })
      if (!res.ok) continue
      sent2++
    }
    await db.from('photographer_profiles')
      .update({ welcome_biz_email_2_at: new Date().toISOString() })
      .eq('id', p.id)
  }

  return NextResponse.json({ email1_sent: sent1, email2_sent: sent2 })
}

export async function GET(request: NextRequest)  { return processWelcome(request) }
export async function POST(request: NextRequest) { return processWelcome(request) }

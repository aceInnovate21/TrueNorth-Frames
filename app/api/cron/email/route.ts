import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/client'
import { EmailTemplateId, EmailPayload } from '@/lib/email/templates'

const BATCH_SIZE = 20
const MAX_ATTEMPTS = 3

async function processCronEmail(request: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  // Manual calls can use x-cron-secret header
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  const bearerSecret = authHeader?.replace('Bearer ', '')
  const isAuthorized =
    bearerSecret === process.env.CRON_SECRET ||
    cronHeader === process.env.CRON_SECRET
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: rows, error } = await db
    .from('email_queue')
    .select('id, to_email, template_id, payload, attempts')
    .eq('status', 'queued')
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })

  const results = { sent: 0, failed: 0, skipped: 0 }

  for (const row of rows ?? []) {
    const now = new Date().toISOString()

    const { ok, error: sendErr } = await sendEmail({
      to:         row.to_email,
      templateId: row.template_id as EmailTemplateId,
      payload:    row.payload as EmailPayload,
    })

    if (ok) {
      await db.from('email_queue').update({
        status: 'sent',
        sent_at: now,
        last_attempted_at: now,
        attempts: row.attempts + 1,
      }).eq('id', row.id)
      results.sent++
    } else {
      const newAttempts = row.attempts + 1
      await db.from('email_queue').update({
        status: newAttempts >= MAX_ATTEMPTS ? 'failed' : 'queued',
        error: sendErr ?? 'Unknown error',
        last_attempted_at: now,
        attempts: newAttempts,
      }).eq('id', row.id)
      results.failed++
    }
  }

  return NextResponse.json({ ...results, total: (rows ?? []).length })
}

// Vercel Cron calls GET; manual/admin calls can use POST
export async function GET(request: NextRequest)  { return processCronEmail(request) }
export async function POST(request: NextRequest) { return processCronEmail(request) }

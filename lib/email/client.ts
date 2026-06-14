import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'hello@thetruenorthframes.com'

// Maps our template IDs to Resend template UUIDs via env vars
const TEMPLATE_ENV_MAP: Record<string, string> = {
  booking_reminder_client:       'RESEND_TEMPLATE_BOOKING_REMINDER_CLIENT',
  booking_reminder_photographer: 'RESEND_TEMPLATE_BOOKING_REMINDER_PHOTOGRAPHER',
  booking_received:              'RESEND_TEMPLATE_BOOKING_RECEIVED',
  booking_confirmed:             'RESEND_TEMPLATE_BOOKING_CONFIRMED',
  booking_declined:              'RESEND_TEMPLATE_BOOKING_DECLINED',
  booking_cancelled_by_client:   'RESEND_TEMPLATE_BOOKING_CANCELLED',
  booking_completed:             'RESEND_TEMPLATE_BOOKING_COMPLETED',
  review_received:               'RESEND_TEMPLATE_REVIEW_RECEIVED',
  review_reply:                  'RESEND_TEMPLATE_REVIEW_REPLY',
  photographer_approved:         'RESEND_TEMPLATE_PHOTOGRAPHER_APPROVED',
  photographer_rejected:         'RESEND_TEMPLATE_PHOTOGRAPHER_REJECTED',
  photographer_suspended:        'RESEND_TEMPLATE_PHOTOGRAPHER_SUSPENDED',
  support_ticket_created:        'RESEND_TEMPLATE_SUPPORT_TICKET_CREATED',
  support_ticket_resolved:       'RESEND_TEMPLATE_SUPPORT_TICKET_RESOLVED',
  welcome_client:                'RESEND_TEMPLATE_WELCOME_CLIENT',
  welcome_photographer:          'RESEND_TEMPLATE_WELCOME_PHOTOGRAPHER',
}

// Maps old camelCase payload keys to Resend UPPER_SNAKE_CASE variable names
function normaliseVariables(payload: Record<string, any>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(payload)) {
    if (v == null) continue
    // Convert camelCase → UPPER_SNAKE_CASE
    const key = k.replace(/([A-Z])/g, '_$1').toUpperCase()
    out[key] = String(v)
  }
  return out
}

// ── Queue a booking-reminder email (only type cron should queue) ──────────────
export async function queueEmail({
  to,
  templateId,
  payload,
}: {
  to: string
  templateId: string
  payload: Record<string, any>
}): Promise<void> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    await db.from('email_queue').insert({ to_email: to, template_id: templateId, payload })
  } catch {
    // Never propagate — email is best-effort
  }
}

// ── Send one email immediately via Resend template ────────────────────────────
export async function sendEmail({
  to,
  templateId,
  payload,
}: {
  to: string
  templateId: string
  payload: Record<string, any>
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const envKey = TEMPLATE_ENV_MAP[templateId]
    const resendTemplateId = envKey ? process.env[envKey] : undefined

    if (!resendTemplateId) {
      console.error(`[sendEmail] No Resend template ID found for "${templateId}" (env key: ${envKey})`)
      return { ok: false, error: `Template not configured: ${templateId}` }
    }

    const variables = normaliseVariables(payload)

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      template: {
        id: resendTemplateId,
        variables,
      },
    } as any)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unknown error' }
  }
}

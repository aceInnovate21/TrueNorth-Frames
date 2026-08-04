import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { renderTemplate, type EmailTemplateId, type EmailPayload } from '@/lib/email/templates'
import { emailAllowedForTemplate } from '@/lib/notification-preferences'

// Lazily construct the Resend client on first use. Instantiating at module load
// with a non-null-asserted key throws "Missing API key" the moment RESEND_API_KEY
// is absent — which crashes `next build` during page-data collection, since Next
// imports every route module. Deferring construction keeps the build resilient and
// scopes any missing-key failure to the one send attempt that needs it.
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}
const FROM = `TrueNorth Frames <${process.env.RESEND_FROM_EMAIL ?? 'no-reply@thetruenorthframes.com'}>`

// Resolve a recipient email → users.id and check the email preference for this
// template's category. Fail-open: if we cannot resolve the user or the category
// is transactional (not gate-able), the email is sent. Only an explicit opt-out
// on a matching category suppresses it.
async function emailSuppressedByPreference(to: string, templateId: string): Promise<boolean> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    ) as any
    const { data: userRow } = await db
      .from('users').select('id').eq('email', to).maybeSingle()
    if (!userRow?.id) return false // recipient not a known user → always send
    const allowed = await emailAllowedForTemplate(db, userRow.id, templateId)
    return !allowed
  } catch {
    return false // fail-open — never drop mail on a lookup error
  }
}

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
    if (await emailSuppressedByPreference(to, templateId)) return { ok: true }

    const envKey = TEMPLATE_ENV_MAP[templateId]
    const resendTemplateId = envKey ? process.env[envKey] : undefined

    if (!resendTemplateId) {
      console.error(`[sendEmail] No Resend template ID found for "${templateId}" (env key: ${envKey})`)
      return { ok: false, error: `Template not configured: ${templateId}` }
    }

    const variables = normaliseVariables(payload)

    const { error } = await getResend().emails.send({
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

// ── Send using local HTML templates (no Resend template UUID needed) ──────────
export async function sendEmailDirect({
  to,
  templateId,
  payload,
}: {
  to: string
  templateId: EmailTemplateId
  payload: EmailPayload
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (await emailSuppressedByPreference(to, templateId)) return { ok: true }
    const { subject, html } = renderTemplate(templateId, payload)
    const { error } = await getResend().emails.send({ from: FROM, to, subject, html })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unknown error' }
  }
}

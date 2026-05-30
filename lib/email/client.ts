import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { renderTemplate, EmailTemplateId, EmailPayload } from './templates'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@truenorthframes.ca'

// ── Queue an email (fire-and-forget safe) ─────────────────────────────────────
// Inserts into email_queue; the cron job /api/cron/email drains it.
export async function queueEmail({
  to,
  templateId,
  payload,
}: {
  to: string
  templateId: EmailTemplateId
  payload: EmailPayload
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

// ── Send one email immediately via Resend ─────────────────────────────────────
// Used by the cron processor only.
export async function sendEmail({
  to,
  templateId,
  payload,
}: {
  to: string
  templateId: EmailTemplateId
  payload: EmailPayload
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { subject, html } = renderTemplate(templateId, payload)
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unknown error' }
  }
}

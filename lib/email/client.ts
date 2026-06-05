import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { renderTemplate, EmailTemplateId, EmailPayload } from './templates'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

// ── Strip HTML to plain text (good enough for email clients, no deps) ─────────
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '  ')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/‌/g, '')           // zero-width non-joiner (preheader filler)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

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
// Used by welcome emails (immediate) and the cron processor.
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
    const text = htmlToPlainText(html)

    const { error } = await resend.emails.send({
      from:     FROM,
      to,
      subject,
      html,
      text,
      // reply-to support@ so replies from users land somewhere useful
      replyTo: 'support@truenorthframes.ca',
      headers: {
        // Marks as transactional — helps bypass promotional tabs in Gmail
        'X-Entity-Ref-ID': `tnf-${templateId}-${Date.now()}`,
      },
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unknown error' }
  }
}

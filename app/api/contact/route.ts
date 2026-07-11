import { NextRequest, NextResponse } from 'next/server'
import { badRequest, serverError } from '@/lib/api-helpers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const SUBJECT_LABELS: Record<string, string> = {
  technical: 'Technical issue',
  account:   'Account help',
  billing:   'Billing',
  general:   'General question',
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, subject, message } = body

  if (!name?.trim()) return badRequest('name is required')
  if (!email?.includes('@')) return badRequest('valid email is required')
  if (!subject || !SUBJECT_LABELS[subject]) return badRequest('subject is required')
  if (!message?.trim() || message.trim().length < 20) return badRequest('message too short')

  const subjectLabel = SUBJECT_LABELS[subject]
  const supportEmail = process.env.SUPPORT_EMAIL ?? 'yogeshstrategyandanalytics@gmail.com'

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to: supportEmail,
      replyTo: email.trim(),
      subject: `[TrueNorth Support] ${subjectLabel} — ${name.trim()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #0a0a0a;">
          <div style="background: #0a0a0a; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <p style="color: white; font-weight: 700; margin: 0; font-size: 16px;">TrueNorth Frames — Support Request</p>
          </div>
          <div style="background: #f9f9f8; padding: 24px; border: 1px solid #e5e5e0; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 13px; width: 100px;">Name</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${name.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 13px;">Email</td>
                <td style="padding: 6px 0; font-size: 13px;">${email.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666; font-size: 13px;">Category</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 600;">${subjectLabel}</td>
              </tr>
            </table>
            <div style="background: white; border: 1px solid #e5e5e0; border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #999;">Message</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
            </div>
            <p style="margin: 16px 0 0; font-size: 11px; color: #aaa;">Reply directly to this email to respond to ${name.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}.</p>
          </div>
        </div>
      `,
    })
  } catch {
    return serverError('Failed to send message. Please try again.')
  }

  return NextResponse.json({ success: true })
}

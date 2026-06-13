/**
 * Creates + publishes all TrueNorth Frames email templates in Resend.
 * Run: npx tsx --env-file=.env.local scripts/setup-resend-templates.ts
 *
 * To recreate existing templates, set RESEND_RECREATE=1
 */

import * as fs from 'fs'
import * as path from 'path'

const API_KEY  = process.env.RESEND_API_KEY!
const FROM     = process.env.RESEND_FROM_EMAIL ?? 'hello@thetruenorthframes.com'
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thetruenorthframes.com'
const SUPPORT  = process.env.SUPPORT_EMAIL ?? 'aceinnovate21@gmail.com'
const LOGO_URL = 'https://pub-cfa5cec7115b44fd80799055729b4709.r2.dev/assets/black-logo.png'

if (!API_KEY) { console.error('❌  RESEND_API_KEY not set'); process.exit(1) }

// ─── Layout ───────────────────────────────────────────────────────────────────

function base({ preheader, body, accent = '#0ea5e9' }: { preheader: string; body: string; accent?: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>TrueNorth Frames</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;color:#f4f4f2;font-size:1px;">${preheader}&nbsp;&#847;&#847;&#847;&#847;&#847;</div>

<table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f2;">
<tr><td align="center" style="padding:32px 12px;">
<table cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- ── Hero header ── -->
  <tr><td style="background:#111111;padding:28px 36px 24px;">
    <table cellspacing="0" cellpadding="0" width="100%"><tr>
      <td style="vertical-align:middle;">
        <img src="${LOGO_URL}" alt="TrueNorth Frames" width="48" height="48"
          style="display:block;border-radius:10px;border:0;outline:none;text-decoration:none;"/>
      </td>
      <td style="vertical-align:middle;padding-left:14px;">
        <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1;">
          TrueNorth<span style="color:${accent};">·</span>Frames
        </div>
        <div style="font-size:11px;color:#666666;letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;">
          Edmonton's Photographer Marketplace
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Accent strip -->
  <tr><td style="height:3px;background:${accent};font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- ── Body ── -->
  <tr><td style="padding:36px 40px 28px;">${body}</td></tr>

  <!-- ── Footer ── -->
  <tr><td style="background:#f8f8f7;border-top:1px solid #e8e8e6;padding:24px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:#888;">
      <strong style="color:#444;">TrueNorth Frames</strong> &nbsp;·&nbsp; Edmonton, AB
    </p>
    <p style="margin:0 0 6px;font-size:12px;color:#bbb;">
      Questions? <a href="mailto:${SUPPORT}" style="color:#888;text-decoration:underline;">${SUPPORT}</a>
    </p>
    <p style="margin:0;font-size:11px;color:#ccc;">
      You're receiving this because you have a TrueNorth Frames account.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Snippets ─────────────────────────────────────────────────────────────────

const h1 = (t: string) => `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.5px;line-height:1.2;">${t}</h1>`
const lead = (t: string) => `<p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.55;">${t}</p>`
const p = (t: string) => `<p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.65;">${t}</p>`
const divider = () => `<div style="height:1px;background:#e8e8e6;margin:24px 0;font-size:0;">&nbsp;</div>`
const btn = (label: string, href: string, color = '#111111') =>
  `<table cellspacing="0" cellpadding="0" style="margin:24px 0 8px;"><tr>
    <td style="border-radius:10px;background:${color};">
      <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:-0.2px;">${label} &nbsp;→</a>
    </td></tr></table>`
const alert = (t: string, color = '#0284c7') =>
  `<div style="background:${color}11;border-left:3px solid ${color};border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 20px;font-size:14px;color:#333;line-height:1.6;">${t}</div>`
const infoRow = (label: string, value: string) =>
  `<tr><td style="padding:10px 16px;border-bottom:1px solid #e8e8e6;">
    <div style="font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">${label}</div>
    <div style="font-size:14px;color:#111;font-weight:500;line-height:1.4;">${value}</div>
  </td></tr>`
const infoBox = (rows: [string, string][]) =>
  `<table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8e8e6;border-radius:10px;overflow:hidden;margin:20px 0;">
    ${rows.map(([l, v]) => infoRow(l, v)).join('')}
  </table>`
const quote = (t: string) =>
  `<div style="background:#f8f8f7;border-left:3px solid #ddd;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 20px;font-size:14px;color:#555;line-height:1.65;font-style:italic;">&ldquo;${t}&rdquo;</div>`
const ul = (items: string[]) =>
  `<ul style="margin:0 0 20px;padding-left:22px;font-size:14px;color:#333;line-height:1.8;">${items.map(i => `<li>${i}</li>`).join('')}</ul>`

// ─── Template definitions ─────────────────────────────────────────────────────

interface Template {
  envKey: string
  name: string
  subject: string
  html: string
  variables: { key: string; type: 'string' | 'number'; fallbackValue: string }[]
}

const TEMPLATES: Template[] = [

  // ── 1. Welcome — Client ───────────────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_WELCOME_CLIENT',
    name: 'welcome_client',
    subject: `Welcome to TrueNorth Frames, {{{USER_NAME}}} — you're in!`,
    variables: [{ key: 'USER_NAME', type: 'string', fallbackValue: 'there' }],
    html: base({
      accent: '#16a34a',
      preheader: `Edmonton's best photographers are waiting. Browse, message, book — completely free.`,
      body: `
        ${h1(`You're in, {{{USER_NAME}}}! 🎉`)}
        ${lead(`Welcome to TrueNorth Frames — Edmonton's home for finding and booking local photographers.`)}
        ${divider()}
        ${p(`Here's what makes TrueNorth Frames different:`)}
        <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
          <tr><td style="padding:12px 0;border-bottom:1px solid #e8e8e6;">
            <div style="font-size:20px;margin-bottom:4px;">📷</div>
            <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px;">Real Edmonton photographers</div>
            <div style="font-size:13px;color:#666;line-height:1.5;">Every photographer is reviewed by our team before going live. No random freelancers.</div>
          </td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #e8e8e6;">
            <div style="font-size:20px;margin-bottom:4px;">💬</div>
            <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px;">Message directly — no middleman</div>
            <div style="font-size:13px;color:#666;line-height:1.5;">Talk to photographers directly. Ask questions, share your vision, get a feel before booking.</div>
          </td></tr>
          <tr><td style="padding:12px 0;">
            <div style="font-size:20px;margin-bottom:4px;">✅</div>
            <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px;">Zero fees. Always.</div>
            <div style="font-size:13px;color:#666;line-height:1.5;">Browsing, messaging, and booking are completely free — always.</div>
          </td></tr>
        </table>
        ${btn('Find Your Photographer', `${APP_URL}/photographers`, '#16a34a')}
        ${divider()}
        ${p(`We're a small Edmonton team building something we genuinely believe in. Reply to this email anytime — a real person will read it.`)}
        <p style="margin:0;font-size:13px;color:#888;">— The TrueNorth Frames Team 🌲</p>
      `,
    }),
  },

  // ── 2. Welcome — Photographer ────────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_WELCOME_PHOTOGRAPHER',
    name: 'welcome_photographer',
    subject: `Welcome to TrueNorth Frames, {{{USER_NAME}}} — let's get you live 📸`,
    variables: [{ key: 'USER_NAME', type: 'string', fallbackValue: 'there' }],
    html: base({
      accent: '#0ea5e9',
      preheader: `Your profile is under review. Here's how to set yourself up for success while you wait.`,
      body: `
        ${h1(`Welcome aboard, {{{USER_NAME}}}!`)}
        ${lead(`Thank you for joining TrueNorth Frames — Edmonton's dedicated marketplace for local photographers.`)}
        ${divider()}
        ${alert(`<strong>Your profile is now under review.</strong> Our team manually reviews every photographer to keep the quality high for clients. You'll hear back within <strong>1–2 business days</strong>.`, '#0284c7')}
        ${p(`While you wait, make the most of your dashboard:`)}
        <table width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e6;"><div style="font-size:13px;color:#111;line-height:1.6;"><strong>1. Upload your portfolio</strong> — aim for 8–12 of your strongest shots.</div></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e6;"><div style="font-size:13px;color:#111;line-height:1.6;"><strong>2. Set your specialties &amp; rate</strong> — clients filter by specialty and budget.</div></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e6;"><div style="font-size:13px;color:#111;line-height:1.6;"><strong>3. Add your availability</strong> — photographers with availability set get 2× more enquiries.</div></td></tr>
          <tr><td style="padding:10px 0;"><div style="font-size:13px;color:#111;line-height:1.6;"><strong>4. Connect your Google Business Profile</strong> — your reviews power your trust score.</div></td></tr>
        </table>
        ${btn('Go to My Dashboard', `${APP_URL}/dashboard/photographer`)}
        ${divider()}
        ${p(`Questions before you hear back? Reply to this email — we're quick to respond.`)}
        <p style="margin:0;font-size:13px;color:#888;">— The TrueNorth Frames Team 🌲</p>
      `,
    }),
  },

  // ── 3. Booking received → photographer ───────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_BOOKING_RECEIVED',
    name: 'booking_received',
    subject: `📅 New booking request from {{{CLIENT_NAME}}}`,
    variables: [
      { key: 'CLIENT_NAME', type: 'string', fallbackValue: 'A client' },
      { key: 'SESSION_TYPE', type: 'string', fallbackValue: 'session' },
      { key: 'DATE', type: 'string', fallbackValue: 'TBD' },
      { key: 'LOCATION', type: 'string', fallbackValue: 'TBD' },
      { key: 'NOTES', type: 'string', fallbackValue: 'None provided' },
    ],
    html: base({
      preheader: `{{{CLIENT_NAME}}} wants to book a session with you. Respond within 24 hours.`,
      body: `
        ${h1('New Booking Request 📅')}
        ${lead(`A client wants to book a session with you. Photographers who reply within 24 hours get significantly more bookings.`)}
        ${divider()}
        ${infoBox([['Client', '{{{CLIENT_NAME}}}'], ['Session type', '{{{SESSION_TYPE}}}'], ['Requested date', '{{{DATE}}}'], ['Location', '{{{LOCATION}}}'], ['Notes', '{{{NOTES}}}']])}
        ${btn('Accept or Decline', `${APP_URL}/dashboard/photographer?tab=requests`)}
        ${divider()}
        ${p(`You can also message the client directly from your dashboard if you have questions before deciding.`)}
      `,
    }),
  },

  // ── 4. Booking confirmed → client ────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_BOOKING_CONFIRMED',
    name: 'booking_confirmed',
    subject: `🎉 Booking confirmed with {{{PHOTOGRAPHER_NAME}}}!`,
    variables: [
      { key: 'PHOTOGRAPHER_NAME', type: 'string', fallbackValue: 'Your photographer' },
      { key: 'SESSION_TYPE', type: 'string', fallbackValue: 'session' },
      { key: 'DATE', type: 'string', fallbackValue: 'TBD' },
      { key: 'LOCATION', type: 'string', fallbackValue: 'TBD' },
    ],
    html: base({
      accent: '#16a34a',
      preheader: `{{{PHOTOGRAPHER_NAME}}} accepted your booking for {{{DATE}}}. You're all set!`,
      body: `
        ${h1('Your Booking is Confirmed! 🎉')}
        ${lead(`{{{PHOTOGRAPHER_NAME}}} has accepted your request — you're all set for your session.`)}
        ${divider()}
        ${infoBox([['Photographer', '{{{PHOTOGRAPHER_NAME}}}'], ['Session type', '{{{SESSION_TYPE}}}'], ['Date', '{{{DATE}}}'], ['Location', '{{{LOCATION}}}']])}
        ${alert(`<strong>Tip:</strong> Message your photographer to confirm final details, share your vision, and ask any last-minute questions.`, '#16a34a')}
        ${btn('View My Bookings', `${APP_URL}/dashboard/client`, '#16a34a')}
        ${divider()}
        ${p(`After your session, you'll be able to leave a review — it helps other Edmonton clients find great photographers.`)}
      `,
    }),
  },

  // ── 5. Booking declined → client ─────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_BOOKING_DECLINED',
    name: 'booking_declined',
    subject: `Booking update from {{{PHOTOGRAPHER_NAME}}}`,
    variables: [
      { key: 'PHOTOGRAPHER_NAME', type: 'string', fallbackValue: 'Your photographer' },
      { key: 'DATE', type: 'string', fallbackValue: 'TBD' },
      { key: 'SESSION_TYPE', type: 'string', fallbackValue: 'session' },
    ],
    html: base({
      preheader: `{{{PHOTOGRAPHER_NAME}}} is unable to take your booking for {{{DATE}}}.`,
      body: `
        ${h1('Booking Not Available')}
        ${lead(`Unfortunately, {{{PHOTOGRAPHER_NAME}}} couldn't accept your request for {{{DATE}}}.`)}
        ${divider()}
        ${infoBox([['Photographer', '{{{PHOTOGRAPHER_NAME}}}'], ['Date', '{{{DATE}}}'], ['Session type', '{{{SESSION_TYPE}}}']])}
        ${p(`Don't worry — there are many great photographers on TrueNorth Frames. Browse others with similar styles and availability.`)}
        ${btn('Find Another Photographer', `${APP_URL}/photographers`)}
      `,
    }),
  },

  // ── 6. Booking cancelled by client → photographer ────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_BOOKING_CANCELLED',
    name: 'booking_cancelled_by_client',
    subject: `Booking cancelled by {{{CLIENT_NAME}}}`,
    variables: [
      { key: 'CLIENT_NAME', type: 'string', fallbackValue: 'A client' },
      { key: 'DATE', type: 'string', fallbackValue: 'TBD' },
      { key: 'SESSION_TYPE', type: 'string', fallbackValue: 'session' },
    ],
    html: base({
      accent: '#d97706',
      preheader: `{{{CLIENT_NAME}}} has cancelled their booking for {{{DATE}}}.`,
      body: `
        ${h1('Booking Cancelled')}
        ${lead(`{{{CLIENT_NAME}}} has cancelled their booking for {{{DATE}}}.`)}
        ${divider()}
        ${infoBox([['Client', '{{{CLIENT_NAME}}}'], ['Date', '{{{DATE}}}'], ['Session type', '{{{SESSION_TYPE}}}']])}
        ${p(`This time slot has been freed up on your availability calendar. No action required.`)}
        ${btn('View Your Calendar', `${APP_URL}/dashboard/photographer?tab=availability`)}
      `,
    }),
  },

  // ── 7. Booking completed → client (review prompt) ────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_BOOKING_COMPLETED',
    name: 'booking_completed',
    subject: `How was your session with {{{PHOTOGRAPHER_NAME}}}? ⭐`,
    variables: [
      { key: 'PHOTOGRAPHER_NAME', type: 'string', fallbackValue: 'your photographer' },
      { key: 'DATE', type: 'string', fallbackValue: 'recently' },
    ],
    html: base({
      accent: '#f59e0b',
      preheader: `Your session is complete — leave a quick review and help the Edmonton photography community.`,
      body: `
        ${h1('Session Complete! 📸')}
        ${lead(`Hope you had an amazing shoot with {{{PHOTOGRAPHER_NAME}}} on {{{DATE}}}.`)}
        ${divider()}
        ${p(`Reviews help other Edmonton clients make great decisions — and they mean the world to independent photographers. It takes less than 60 seconds.`)}
        ${alert(`Your review is visible on the photographer's public profile and helps build trust in the Edmonton community.`, '#f59e0b')}
        ${btn('Leave a Review', `${APP_URL}/dashboard/client`, '#f59e0b')}
        ${divider()}
        ${p(`If anything didn't go as expected, contact our support team and we'll look into it promptly.`)}
      `,
    }),
  },

  // ── 8. Booking reminder → client ─────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_BOOKING_REMINDER_CLIENT',
    name: 'booking_reminder_client',
    subject: `📸 Reminder: your session with {{{PHOTOGRAPHER_NAME}}} is tomorrow`,
    variables: [
      { key: 'PHOTOGRAPHER_NAME', type: 'string', fallbackValue: 'your photographer' },
      { key: 'DATE', type: 'string', fallbackValue: 'tomorrow' },
      { key: 'TIME_SLOT', type: 'string', fallbackValue: 'TBD' },
      { key: 'LOCATION', type: 'string', fallbackValue: 'TBD' },
      { key: 'SESSION_TYPE', type: 'string', fallbackValue: 'session' },
    ],
    html: base({
      preheader: `Just a heads-up — your photography session is tomorrow. Here are the details.`,
      body: `
        ${h1('Session Tomorrow! 📅')}
        ${lead(`Your booking with {{{PHOTOGRAPHER_NAME}}} is confirmed for tomorrow.`)}
        ${divider()}
        ${infoBox([['Photographer', '{{{PHOTOGRAPHER_NAME}}}'], ['Date', '{{{DATE}}}'], ['Time', '{{{TIME_SLOT}}}'], ['Location', '{{{LOCATION}}}'], ['Session type', '{{{SESSION_TYPE}}}']])}
        ${p(`Have last-minute questions? Message your photographer directly from your dashboard.`)}
        ${btn('View Booking Details', `${APP_URL}/dashboard/client`)}
        ${divider()}
        ${p(`After your session, please leave a review — it takes less than a minute and makes a real difference for independent photographers.`)}
      `,
    }),
  },

  // ── 9. Booking reminder → photographer ───────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_BOOKING_REMINDER_PHOTOGRAPHER',
    name: 'booking_reminder_photographer',
    subject: `📅 Reminder: session with {{{CLIENT_NAME}}} is tomorrow`,
    variables: [
      { key: 'CLIENT_NAME', type: 'string', fallbackValue: 'your client' },
      { key: 'DATE', type: 'string', fallbackValue: 'tomorrow' },
      { key: 'TIME_SLOT', type: 'string', fallbackValue: 'TBD' },
      { key: 'LOCATION', type: 'string', fallbackValue: 'TBD' },
      { key: 'SESSION_TYPE', type: 'string', fallbackValue: 'session' },
    ],
    html: base({
      preheader: `You have a photography session booked for tomorrow — here are the details.`,
      body: `
        ${h1('Session Tomorrow 📅')}
        ${lead(`Just a reminder about your confirmed booking for tomorrow.`)}
        ${divider()}
        ${infoBox([['Client', '{{{CLIENT_NAME}}}'], ['Date', '{{{DATE}}}'], ['Time', '{{{TIME_SLOT}}}'], ['Location', '{{{LOCATION}}}'], ['Session type', '{{{SESSION_TYPE}}}']])}
        ${p(`Need to reach your client? Message them directly from your dashboard.`)}
        ${btn('View Booking Details', `${APP_URL}/dashboard/photographer?tab=requests`)}
      `,
    }),
  },

  // ── 10. Review received → photographer ───────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_REVIEW_RECEIVED',
    name: 'review_received',
    subject: `⭐ {{{CLIENT_NAME}}} left you a {{{RATING}}}-star review`,
    variables: [
      { key: 'CLIENT_NAME', type: 'string', fallbackValue: 'A client' },
      { key: 'RATING', type: 'string', fallbackValue: '5' },
      { key: 'DATE', type: 'string', fallbackValue: 'recently' },
      { key: 'REVIEW_BODY', type: 'string', fallbackValue: '' },
    ],
    html: base({
      accent: '#f59e0b',
      preheader: `See what your client said about your work — and reply to build your reputation.`,
      body: `
        ${h1('New Review ⭐')}
        ${lead(`{{{CLIENT_NAME}}} reviewed your session on {{{DATE}}}.`)}
        ${divider()}
        ${alert(`<strong>Rating: {{{RATING}}} / 5 stars</strong>`, '#f59e0b')}
        ${quote('{{{REVIEW_BODY}}}')}
        ${p(`Responding to reviews shows professionalism and builds trust with future clients.`)}
        ${btn('View & Reply to Review', `${APP_URL}/dashboard/photographer?tab=reviews`, '#f59e0b')}
      `,
    }),
  },

  // ── 11. Review reply → client ─────────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_REVIEW_REPLY',
    name: 'review_reply',
    subject: `{{{PHOTOGRAPHER_NAME}}} replied to your review`,
    variables: [
      { key: 'PHOTOGRAPHER_NAME', type: 'string', fallbackValue: 'Your photographer' },
      { key: 'REVIEW_BODY', type: 'string', fallbackValue: '' },
      { key: 'REPLY_BODY', type: 'string', fallbackValue: '' },
      { key: 'PHOTOGRAPHER_USERNAME', type: 'string', fallbackValue: '' },
    ],
    html: base({
      preheader: `Your photographer responded to the review you left — see what they said.`,
      body: `
        ${h1('Your Review Got a Reply')}
        ${lead(`{{{PHOTOGRAPHER_NAME}}} responded to your review.`)}
        ${divider()}
        ${p(`Your review:`)}
        ${quote('{{{REVIEW_BODY}}}')}
        ${p(`<strong>{{{PHOTOGRAPHER_NAME}}}'s reply:</strong>`)}
        <div style="background:#f0f7ff;border-left:3px solid #0284c7;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 24px;font-size:14px;color:#1a1a1a;line-height:1.65;font-style:italic;">&ldquo;{{{REPLY_BODY}}}&rdquo;</div>
        ${btn('View on TrueNorth Frames', `${APP_URL}/photographers/{{{PHOTOGRAPHER_USERNAME}}}`)}
      `,
    }),
  },

  // ── 12. Photographer approved ─────────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_PHOTOGRAPHER_APPROVED',
    name: 'photographer_approved',
    subject: `🎉 You're live on TrueNorth Frames, {{{USER_NAME}}}!`,
    variables: [
      { key: 'USER_NAME', type: 'string', fallbackValue: 'there' },
      { key: 'USERNAME', type: 'string', fallbackValue: '' },
    ],
    html: base({
      accent: '#16a34a',
      preheader: `Your photographer profile is approved — Edmonton clients can now find and book you.`,
      body: `
        ${h1(`You're Live, {{{USER_NAME}}}! 🎉`)}
        ${lead(`Your TrueNorth Frames profile has been approved and is publicly visible to Edmonton clients.`)}
        ${divider()}
        ${alert(`Photographers with complete profiles get 3× more enquiries. Take 5 minutes to finish your setup.`, '#16a34a')}
        ${p(`A few things to maximise your bookings:`)}
        ${ul(['Upload 8–12 of your best portfolio shots', 'Connect your Google Business Profile to unlock your trust score', 'Set clear pricing and weekly availability', 'Share your profile link on Instagram and Facebook'])}
        ${btn('View Your Public Profile', `${APP_URL}/photographers/{{{USERNAME}}}`, '#16a34a')}
        ${divider()}
        ${p(`Your profile link: <a href="${APP_URL}/photographers/{{{USERNAME}}}" style="color:#333;font-weight:600;">${APP_URL}/photographers/{{{USERNAME}}}</a>`)}
      `,
    }),
  },

  // ── 13. Photographer rejected ─────────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_PHOTOGRAPHER_REJECTED',
    name: 'photographer_rejected',
    subject: `Your TrueNorth Frames profile needs a few updates`,
    variables: [
      { key: 'USER_NAME', type: 'string', fallbackValue: 'there' },
      { key: 'REASON', type: 'string', fallbackValue: '' },
    ],
    html: base({
      accent: '#d97706',
      preheader: `We couldn't approve your profile yet — here's exactly what to fix.`,
      body: `
        ${h1('Profile Needs Some Work')}
        ${lead(`Your profile isn't quite ready yet — but your account is still active and you can fix it now.`)}
        ${divider()}
        ${p(`Hi {{{USER_NAME}}}, after reviewing your profile, our team wasn't able to approve it at this time.`)}
        ${alert(`<strong>Reason from our team:</strong> {{{REASON}}}`, '#d97706')}
        ${p(`The most common reasons profiles aren't approved:`)}
        ${ul(['Bio is too short or doesn\'t describe your photography work', 'No portfolio photos uploaded', 'Rate or location not set', 'Profile photo missing'])}
        ${p(`Your account is still active. Log in, fix the issues, and your updated profile will be reviewed within 1–2 business days.`)}
        ${btn('Fix My Profile', `${APP_URL}/dashboard/photographer`, '#d97706')}
        ${divider()}
        ${p(`Questions? Just reply to this email — we'll help you get approved.`)}
      `,
    }),
  },

  // ── 14. Photographer suspended ────────────────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_PHOTOGRAPHER_SUSPENDED',
    name: 'photographer_suspended',
    subject: `Important notice about your TrueNorth Frames account`,
    variables: [
      { key: 'USER_NAME', type: 'string', fallbackValue: 'there' },
      { key: 'REASON', type: 'string', fallbackValue: 'Our team found activity that requires review.' },
    ],
    html: base({
      accent: '#dc2626',
      preheader: `Your account has been suspended — please contact us to resolve this.`,
      body: `
        ${h1('Account Suspended')}
        ${divider()}
        ${p(`Hi {{{USER_NAME}}}, your TrueNorth Frames account has been temporarily suspended.`)}
        ${alert(`<strong>Reason:</strong> {{{REASON}}}`, '#dc2626')}
        ${p(`While suspended, your profile is hidden from the marketplace and you cannot receive new booking requests.`)}
        ${p(`To appeal this decision or get more information, email us directly:`)}
        ${btn('Contact Support', `mailto:${SUPPORT}?subject=Account suspension`, '#dc2626')}
      `,
    }),
  },

  // ── 15. Support ticket created → admin ───────────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_SUPPORT_TICKET_CREATED',
    name: 'support_ticket_created',
    subject: `[Support #{{{TICKET_ID}}}] {{{SUBJECT}}}`,
    variables: [
      { key: 'TICKET_ID', type: 'string', fallbackValue: '--------' },
      { key: 'SUBJECT', type: 'string', fallbackValue: 'New ticket' },
      { key: 'CATEGORY', type: 'string', fallbackValue: 'general' },
      { key: 'SUBMITTER_NAME', type: 'string', fallbackValue: 'User' },
      { key: 'SUBMITTER_ROLE', type: 'string', fallbackValue: 'client' },
      { key: 'DESCRIPTION', type: 'string', fallbackValue: '' },
    ],
    html: base({
      accent: '#dc2626',
      preheader: `New support ticket from {{{SUBMITTER_NAME}}} — action required.`,
      body: `
        ${h1('New Support Ticket')}
        ${alert(`<strong>Action Required</strong> — new ticket submitted.`, '#dc2626')}
        ${divider()}
        ${infoBox([['Ticket ID', '#{{{TICKET_ID}}}'], ['Category', '{{{CATEGORY}}}'], ['Submitted by', '{{{SUBMITTER_NAME}}} ({{{SUBMITTER_ROLE}}})'], ['Subject', '{{{SUBJECT}}}']])}
        ${p(`<strong>Message:</strong>`)}
        ${quote('{{{DESCRIPTION}}}')}
        ${btn('View in Admin Portal', `${APP_URL}/admin/support`, '#dc2626')}
      `,
    }),
  },

  // ── 16. Support ticket resolved → submitter ───────────────────────────────
  {
    envKey: 'RESEND_TEMPLATE_SUPPORT_TICKET_RESOLVED',
    name: 'support_ticket_resolved',
    subject: `✅ Your support ticket has been resolved`,
    variables: [
      { key: 'USER_NAME', type: 'string', fallbackValue: 'there' },
      { key: 'TICKET_ID', type: 'string', fallbackValue: '--------' },
      { key: 'SUBJECT', type: 'string', fallbackValue: '' },
      { key: 'RESOLUTION_NOTE', type: 'string', fallbackValue: 'Our team has reviewed your ticket and taken appropriate action.' },
      { key: 'ROLE', type: 'string', fallbackValue: 'client' },
    ],
    html: base({
      accent: '#16a34a',
      preheader: `We've resolved your support request — here's what happened.`,
      body: `
        ${h1('Ticket Resolved ✅')}
        ${lead(`Support ticket #{{{TICKET_ID}}} — {{{SUBJECT}}}`)}
        ${divider()}
        ${p(`Hi {{{USER_NAME}}}, your support request has been reviewed and resolved by our team.`)}
        ${alert(`<strong>Resolution:</strong> {{{RESOLUTION_NOTE}}}`, '#16a34a')}
        ${p(`If you have further questions or the issue persists, don't hesitate to reach out again — just reply to this email.`)}
        ${btn('Back to Dashboard', `${APP_URL}/dashboard/{{{ROLE}}}`, '#16a34a')}
      `,
    }),
  },

]

// ─── API helpers ──────────────────────────────────────────────────────────────

async function listExisting(): Promise<Record<string, string>> {
  const res = await fetch('https://api.resend.com/templates', {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  })
  const data = await res.json() as any
  const map: Record<string, string> = {}
  for (const t of (data.data ?? [])) map[t.name] = t.id
  return map
}

async function deleteTemplate(id: string): Promise<void> {
  await fetch(`https://api.resend.com/templates/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  })
}

async function createTemplate(t: Template): Promise<string> {
  const res = await fetch('https://api.resend.com/templates', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: t.name, from: FROM, subject: t.subject, html: t.html, variables: t.variables }),
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(`Create failed for "${t.name}": ${JSON.stringify(data)}`)
  return data.id as string
}

async function publishTemplate(id: string): Promise<void> {
  const res = await fetch(`https://api.resend.com/templates/${id}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`Publish failed: ${JSON.stringify(data)}`)
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const recreate = process.env.RESEND_RECREATE === '1'
  console.log(`\n🚀 Setting up ${TEMPLATES.length} Resend templates...\n`)

  const existing = await listExisting()
  if (Object.keys(existing).length > 0) {
    console.log(`Found ${Object.keys(existing).length} existing templates`)
    if (recreate) {
      console.log('RESEND_RECREATE=1 — deleting and recreating all...\n')
      for (const [name, id] of Object.entries(existing)) {
        await deleteTemplate(id)
        console.log(`  🗑  Deleted "${name}"`)
      }
    } else {
      console.log('Skipping existing ones (set RESEND_RECREATE=1 to recreate all)\n')
    }
  }

  const freshExisting = recreate ? {} : existing
  const envLines: string[] = []

  for (const t of TEMPLATES) {
    if (freshExisting[t.name]) {
      console.log(`⏭  "${t.name}" already exists → ${freshExisting[t.name]}`)
      envLines.push(`${t.envKey}=${freshExisting[t.name]}`)
      continue
    }
    const id = await createTemplate(t)
    await sleep(400)
    await publishTemplate(id)
    await sleep(400)
    console.log(`✅  "${t.name}" created + published → ${id}`)
    envLines.push(`${t.envKey}=${id}`)
  }

  // Write IDs to .env.local
  const envPath = path.resolve(process.cwd(), '.env.local')
  let envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envLines) {
    const key = line.split('=')[0]
    const regex = new RegExp(`^${key}=.*`, 'm')
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, line)
    } else {
      envContent = envContent.trimEnd() + '\n' + line + '\n'
    }
  }
  fs.writeFileSync(envPath, envContent)

  console.log('\n─────────────────────────────────────────────────────')
  console.log('All template IDs written to .env.local')
  console.log('Run `vercel env` commands below to push to production:')
  console.log('─────────────────────────────────────────────────────')
  for (const line of envLines) console.log(line)
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) })

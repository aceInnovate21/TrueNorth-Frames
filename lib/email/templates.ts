// ─────────────────────────────────────────────────────────────────────────────
// TrueNorth Frames — Email Templates
// Designed to render well in Gmail, Apple Mail, Outlook, and mobile clients.
// No external images (broken without domain). Text-based logo only.
// All templates return { subject, html }.
// ─────────────────────────────────────────────────────────────────────────────

export type EmailTemplateId =
  | 'welcome_client'
  | 'welcome_photographer'
  | 'booking_received'
  | 'booking_confirmed'
  | 'booking_declined'
  | 'booking_completed'
  | 'booking_cancelled_by_client'      // → photographer: client cancelled
  | 'booking_cancellation_confirmed'   // → client: photographer confirmed cancellation
  | 'new_conversation'
  | 'review_received'
  | 'review_reply'
  | 'support_ticket_created'
  | 'support_ticket_resolved'
  | 'photographer_approved'
  | 'photographer_suspended'
  | 'review_removed'
  | 'review_dismissed'
  | 'photographer_rejected'
  | 'booking_reminder_client'
  | 'booking_reminder_photographer'

export type EmailPayload = Record<string, string | number | undefined | null>

const SUPPORT_EMAIL = () => process.env.SUPPORT_EMAIL ?? 'yogeshstrategyandanalytics@gmail.com'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const BRAND = {
  black:    '#111111',
  offwhite: '#f8f8f7',
  border:   '#e8e8e6',
  muted:    '#888888',
  faint:    '#cccccc',
  green:    '#16a34a',
  red:      '#dc2626',
  amber:    '#d97706',
  blue:     '#0284c7',
  accent:   '#0ea5e9',   // sky-500 — the single brand accent used in header strip
}

// ─── Base layout ──────────────────────────────────────────────────────────────

function base({ preheader, body, accentColor = BRAND.accent }: {
  preheader: string
  body: string
  accentColor?: string
}): string {
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thetruenorthframes.com'
  const supportEmail = process.env.SUPPORT_EMAIL ?? 'yogeshstrategyandanalytics@gmail.com'

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>TrueNorth Frames</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width:620px){
      .card{ width:100%!important; border-radius:0!important; }
      .body-cell{ padding:28px 20px!important; }
      .footer-cell{ padding:20px!important; }
      .cta-table{ width:100%!important; }
      .cta-td{ width:100%!important; display:block!important; text-align:center!important; }
      .info-label{ display:block!important; width:auto!important; padding-bottom:2px!important; }
      .info-value{ display:block!important; width:auto!important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:#f4f4f2;font-size:1px;line-height:1px;">
    ${preheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f2;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!-- Card wrapper -->
        <table role="presentation" class="card" cellspacing="0" cellpadding="0" border="0"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">

          <!-- ── Header ── -->
          <tr>
            <td style="background-color:${BRAND.black};padding:24px 36px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <!-- Text-based logo — no broken images -->
                    <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1;">
                      TrueNorth<span style="color:${accentColor};">·</span>Frames
                    </div>
                    <div style="font-size:11px;color:#777777;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">
                      Edmonton's Photographer Marketplace
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent strip -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${accentColor} 0%,${accentColor}88 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td class="body-cell" style="padding:36px 40px 28px;">
              ${body}
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td class="footer-cell" style="background-color:${BRAND.offwhite};border-top:1px solid ${BRAND.border};padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};line-height:1.5;">
                <strong style="color:#444;">TrueNorth Frames</strong> &nbsp;·&nbsp; Edmonton, AB
              </p>
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.faint};line-height:1.5;">
                Questions? &nbsp;<a href="mailto:${supportEmail}" style="color:#888;text-decoration:underline;">${supportEmail}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cccccc;line-height:1.5;">
                You're receiving this because you have a TrueNorth Frames account. &nbsp;
                <a href="${appUrl}/dashboard" style="color:#bbbbbb;text-decoration:underline;">Manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`
}

// ─── Reusable snippets ────────────────────────────────────────────────────────

function h1(text: string) {
  return `<h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:${BRAND.black};letter-spacing:-0.5px;line-height:1.2;">${text}</h1>`
}

function lead(text: string) {
  return `<p style="margin:0 0 24px;font-size:15px;color:#666666;line-height:1.55;">${text}</p>`
}

function p_(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.65;">${text}</p>`
}

function divider() {
  return `<div style="height:1px;background:${BRAND.border};margin:24px 0;font-size:0;line-height:0;">&nbsp;</div>`
}

// CTA button — full-width on mobile via class, inline otherwise
function cta(label: string, href: string, color: string = BRAND.black) {
  return `
  <table role="presentation" class="cta-table" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px;">
    <tr>
      <td class="cta-td" style="border-radius:10px;background-color:${color};">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
          ${label} &nbsp;→
        </a>
      </td>
    </tr>
  </table>`
}

// Info box — stacked rows, mobile-safe (no percentage widths)
function infoBox(rows: { label: string; value: string }[]) {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid ${BRAND.border};">
        <div class="info-label" style="font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">${r.label}</div>
        <div class="info-value" style="font-size:14px;color:${BRAND.black};font-weight:500;line-height:1.4;">${r.value}</div>
      </td>
    </tr>`).join('')

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;margin:20px 0;">
    ${rowsHtml}
  </table>`
}

function starRating(rating: number) {
  const n = Math.round(Math.max(0, Math.min(5, rating)))
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="font-size:20px;color:${i < n ? '#f59e0b' : '#e5e7eb'};">&#9733;</span>`
  ).join('&thinsp;')
  return `<div style="margin:12px 0 16px;">${stars} <span style="font-size:14px;font-weight:600;color:#333;vertical-align:middle;margin-left:4px;">${rating}/5</span></div>`
}

function alertBox(text: string, color: string = BRAND.blue) {
  return `<div style="background:${color}11;border-left:3px solid ${color};border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 20px;font-size:14px;color:#333;line-height:1.6;">${text}</div>`
}

function quoteBlock(text: string) {
  return `<div style="background:#f8f8f7;border-left:3px solid #dddddd;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 20px;font-size:14px;color:#555555;line-height:1.65;font-style:italic;">&ldquo;${text}&rdquo;</div>`
}

function ul(items: string[]) {
  const lis = items.map(i => `<li style="margin-bottom:6px;">${i}</li>`).join('')
  return `<ul style="margin:0 0 20px;padding-left:22px;font-size:14px;color:#333333;line-height:1.7;">${lis}</ul>`
}

function badge(text: string, color: string = BRAND.black) {
  return `<span style="display:inline-block;background:${color}18;color:${color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.05em;text-transform:uppercase;">${text}</span>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<EmailTemplateId, (p: EmailPayload) => { subject: string; html: string }> = {

  // ── Welcome — Client ──────────────────────────────────────────────────────

  welcome_client: (p) => ({
    subject: `Welcome to TrueNorth Frames, ${p.firstName} — you're in!`,
    html: base({
      preheader: `Edmonton's best photographers are waiting. Browse, message, and book — completely free.`,
      accentColor: BRAND.green,
      body: `
        ${h1(`You're in, ${p.firstName}! 🎉`)}
        ${lead('Welcome to TrueNorth Frames — Edmonton\'s home for finding and booking local photographers.')}
        ${divider()}
        ${p_('Your account is live and ready. Here\'s what makes TrueNorth Frames different:')}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};">
              <div style="font-size:20px;margin-bottom:4px;">📷</div>
              <div style="font-size:14px;font-weight:700;color:${BRAND.black};margin-bottom:2px;">Real Edmonton photographers</div>
              <div style="font-size:13px;color:#666;line-height:1.5;">Every photographer is reviewed by our team before going live. No random freelancers.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};">
              <div style="font-size:20px;margin-bottom:4px;">💬</div>
              <div style="font-size:14px;font-weight:700;color:${BRAND.black};margin-bottom:2px;">Message directly — no middleman</div>
              <div style="font-size:13px;color:#666;line-height:1.5;">Talk to photographers directly. Ask questions, share your vision, get a feel before booking.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;">
              <div style="font-size:20px;margin-bottom:4px;">✅</div>
              <div style="font-size:14px;font-weight:700;color:${BRAND.black};margin-bottom:2px;">Zero fees. Always.</div>
              <div style="font-size:13px;color:#666;line-height:1.5;">Browsing, messaging, and booking are free. We never take a cut from you or the photographer.</div>
            </td>
          </tr>
        </table>
        ${cta('Find Your Photographer', `${process.env.NEXT_PUBLIC_APP_URL}/photographers`, BRAND.green)}
        ${divider()}
        ${p_('We\'re a small Edmonton team building something we genuinely believe in. If you have questions, feedback, or just want to say hi — reply to this email. A real person will read it.')}
        <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">— The TrueNorth Frames Team 🌲</p>
      `,
    }),
  }),

  // ── Welcome — Photographer ────────────────────────────────────────────────

  welcome_photographer: (p) => ({
    subject: `Welcome to TrueNorth Frames, ${p.firstName} — let's get you live 📸`,
    html: base({
      preheader: `Your profile is under review. Here's how to set yourself up for success while you wait.`,
      body: `
        ${h1(`Welcome aboard, ${p.firstName}!`)}
        ${lead('Thank you for joining TrueNorth Frames — Edmonton\'s dedicated marketplace for local photographers.')}
        ${divider()}
        ${alertBox(`<strong>Your profile is now under review.</strong> Our team manually reviews every photographer to keep the quality high for clients. You'll hear back within <strong>1–2 business days</strong>.`, BRAND.blue)}
        ${p_('While you wait, make the most of your dashboard:')}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
              <div style="font-size:13px;color:${BRAND.black};line-height:1.6;"><span style="font-weight:700;">1. Upload your portfolio</span> — aim for 8–12 of your strongest shots. First impressions matter.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
              <div style="font-size:13px;color:${BRAND.black};line-height:1.6;"><span style="font-weight:700;">2. Set your specialties &amp; rate</span> — clients filter by specialty and budget. Be specific.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
              <div style="font-size:13px;color:${BRAND.black};line-height:1.6;"><span style="font-weight:700;">3. Add your availability</span> — photographers with availability set get 2× more enquiries.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <div style="font-size:13px;color:${BRAND.black};line-height:1.6;"><span style="font-weight:700;">4. Connect your Google Business Profile</span> — your reviews power your trust score and badge.</div>
            </td>
          </tr>
        </table>
        ${cta('Go to My Dashboard', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer`)}
        ${divider()}
        ${p_('We built TrueNorth Frames because we believe Edmonton photographers deserve a platform that works for them — not against them. No commissions. No hidden fees. Just direct bookings.')}
        ${p_(`Questions before you hear back? Reply to this email or reach us at <a href="mailto:${SUPPORT_EMAIL()}" style="color:#333;font-weight:600;">${SUPPORT_EMAIL()}</a> — we're quick to respond.`)}
        <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">— The TrueNorth Frames Team 🌲</p>
      `,
    }),
  }),

  // ── Booking received (→ photographer) ────────────────────────────────────

  booking_received: (p) => ({
    subject: `📅 New booking request from ${p.clientName}`,
    html: base({
      preheader: `${p.clientName} wants to book a ${p.sessionType} session on ${p.date}. Respond within 24 hours.`,
      body: `
        ${h1('New Booking Request')}
        ${lead('A client wants to book a session with you. Respond quickly — photographers who reply within 24 hours get significantly more bookings.')}
        ${divider()}
        ${infoBox([
          { label: 'Client',        value: String(p.clientName) },
          { label: 'Session type',  value: String(p.sessionType) },
          { label: 'Requested date',value: String(p.date) },
          { label: 'Location',      value: String(p.location ?? 'TBD') },
          { label: 'Notes',         value: String(p.notes ?? 'None provided') },
        ])}
        ${cta('Accept or Decline', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?tab=requests`)}
        ${divider()}
        ${p_('You can also message the client directly from your dashboard if you have questions before deciding.')}
      `,
    }),
  }),

  // ── Booking confirmed (→ client) ──────────────────────────────────────────

  booking_confirmed: (p) => ({
    subject: `🎉 Booking confirmed with ${p.photographerName}!`,
    html: base({
      preheader: `${p.photographerName} has accepted your booking for ${p.date}. You're all set.`,
      accentColor: BRAND.green,
      body: `
        ${h1('Your Booking is Confirmed!')}
        ${lead(`${p.photographerName} has accepted your request — you're all set for your session.`)}
        ${divider()}
        ${infoBox([
          { label: 'Photographer', value: String(p.photographerName) },
          { label: 'Session type', value: String(p.sessionType) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Location',     value: String(p.location ?? 'TBD') },
        ])}
        ${p.photographerNote ? alertBox(`<strong>Note from ${p.photographerName}:</strong> ${p.photographerNote}`, BRAND.blue) : ''}
        ${p_('Your photographer may reach out with more details. You can also message them anytime from your dashboard.')}
        ${cta('View My Bookings', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client`, BRAND.green)}
        ${divider()}
        ${p_('After your session, you\'ll be able to leave a review — it helps other Edmonton clients find great photographers.')}
      `,
    }),
  }),

  // ── Booking declined (→ client) ───────────────────────────────────────────

  booking_declined: (p) => ({
    subject: `Booking update from ${p.photographerName}`,
    html: base({
      preheader: `${p.photographerName} is unable to take your booking for ${p.date}. Browse other photographers.`,
      body: `
        ${h1('Booking Not Available')}
        ${lead(`Unfortunately, ${p.photographerName} couldn't accept your request for ${p.date}.`)}
        ${divider()}
        ${infoBox([
          { label: 'Photographer', value: String(p.photographerName) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Session type', value: String(p.sessionType) },
        ])}
        ${p.photographerNote
          ? alertBox(`<strong>Message from ${p.photographerName}:</strong> ${p.photographerNote}`, BRAND.amber)
          : p_('No reason was provided.')}
        ${p_('Don\'t worry — there are many great photographers on TrueNorth Frames. Browse others with similar styles and availability.')}
        ${cta('Find Another Photographer', `${process.env.NEXT_PUBLIC_APP_URL}/photographers`)}
      `,
    }),
  }),

  // ── Booking completed (→ client) ──────────────────────────────────────────

  booking_completed: (p) => ({
    subject: `How was your session with ${p.photographerName}? ⭐`,
    html: base({
      preheader: `Your session is complete — leave a quick review to help the Edmonton photography community.`,
      accentColor: BRAND.amber,
      body: `
        ${h1('Session Complete!')}
        ${lead(`Hope you had an amazing shoot with ${p.photographerName} on ${p.date}. 📸`)}
        ${divider()}
        ${p_('Reviews help other Edmonton clients make great decisions — and they mean the world to independent photographers. It takes less than 60 seconds.')}
        ${alertBox('Your review is visible on the photographer\'s public profile and helps build trust in the Edmonton community.', BRAND.amber)}
        ${cta('Leave a Review', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client`, BRAND.amber)}
        ${divider()}
        ${p_('If anything didn\'t go as expected, contact our support team and we\'ll look into it promptly.')}
      `,
    }),
  }),

  // ── New conversation (→ photographer) ────────────────────────────────────

  new_conversation: (p) => ({
    subject: `💬 ${p.clientName} sent you a message`,
    html: base({
      preheader: `A new client has reached out — reply quickly to win the booking.`,
      body: `
        ${h1(`Message from ${p.clientName}`)}
        ${lead('A client wants to connect with you on TrueNorth Frames.')}
        ${divider()}
        ${quoteBlock(String(p.messagePreview))}
        ${p_('Photographers who respond within a few hours get significantly more bookings. Head to your dashboard to reply.')}
        ${cta('Reply to Message', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?tab=messages`)}
        ${divider()}
        ${p_('If this message seems inappropriate or is spam, you can report it from within the conversation.')}
      `,
    }),
  }),

  // ── Review received (→ photographer) ─────────────────────────────────────

  review_received: (p) => ({
    subject: `⭐ ${p.clientName} left you a ${p.rating}-star review`,
    html: base({
      preheader: `See what your client said about your work — and reply to build your reputation.`,
      accentColor: BRAND.amber,
      body: `
        ${h1('New Review')}
        ${lead(`${p.clientName} reviewed your session on ${p.date}.`)}
        ${divider()}
        ${starRating(Number(p.rating))}
        ${p.reviewBody ? quoteBlock(String(p.reviewBody)) : p_('Rating only — no written review.')}
        ${p_('Responding to reviews shows professionalism and builds trust with future clients. You can reply directly from your dashboard.')}
        ${cta('View & Reply to Review', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?tab=reviews`)}
      `,
    }),
  }),

  // ── Review reply (→ client) ───────────────────────────────────────────────

  review_reply: (p) => ({
    subject: `${p.photographerName} replied to your review`,
    html: base({
      preheader: `Your photographer responded to the review you left — see what they said.`,
      body: `
        ${h1('Your Review Got a Reply')}
        ${lead(`${p.photographerName} responded to your review.`)}
        ${divider()}
        ${p_('Your review:')}
        ${quoteBlock(String(p.reviewBody))}
        ${p_(`<strong>${p.photographerName}'s reply:</strong>`)}
        <div style="background:#f0f7ff;border-left:3px solid ${BRAND.blue};border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 24px;font-size:14px;color:#1a1a1a;line-height:1.65;font-style:italic;">&ldquo;${p.replyBody}&rdquo;</div>
        ${cta('View on TrueNorth Frames', `${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.photographerUsername}`)}
      `,
    }),
  }),

  // ── Support ticket created (→ admin) ──────────────────────────────────────

  support_ticket_created: (p) => ({
    subject: `[TNF-${String(p.ticketId).slice(0, 6).toUpperCase()}] ${p.subject}`,
    html: base({
      preheader: `New support ticket from ${p.submitterName} — action required.`,
      accentColor: BRAND.red,
      body: `
        ${h1('New Support Ticket')}
        ${badge('Action Required', BRAND.red)}
        ${divider()}
        ${infoBox([
          { label: 'Ticket ID',    value: `TNF-${String(p.ticketId).slice(0, 6).toUpperCase()}` },
          { label: 'Category',     value: String(p.category).replace(/_/g, ' ') },
          { label: 'Submitted by', value: `${p.submitterName} (${p.submitterRole})` },
          { label: 'Subject',      value: String(p.subject) },
        ])}
        ${p_('<strong>Message:</strong>')}
        ${quoteBlock(String(p.description))}
        ${cta('View in Admin Portal', `${process.env.NEXT_PUBLIC_APP_URL}/admin/support`, BRAND.red)}
      `,
    }),
  }),

  // ── Support ticket resolved (→ submitter) ─────────────────────────────────

  support_ticket_resolved: (p) => ({
    subject: `✅ Your support ticket has been resolved`,
    html: base({
      preheader: `We've resolved your support request — here's what happened.`,
      accentColor: BRAND.green,
      body: `
        ${h1('Ticket Resolved')}
        ${lead(`Support ticket TNF-${String(p.ticketId).slice(0, 6).toUpperCase()} — ${p.subject}`)}
        ${divider()}
        ${p_(`Hi ${p.firstName}, your support request has been reviewed and resolved by our team.`)}
        ${p.resolutionNote
          ? alertBox(`<strong>Resolution:</strong><br/>${p.resolutionNote}`, BRAND.green)
          : p_('Our team has reviewed your ticket and taken appropriate action.')}
        ${p_('If you have further questions or the issue persists, don\'t hesitate to reach out again — just reply to this email.')}
        ${cta('Back to Dashboard', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${p.role === 'photographer' ? 'photographer' : 'client'}`, BRAND.green)}
      `,
    }),
  }),

  // ── Photographer approved ─────────────────────────────────────────────────

  photographer_approved: (p) => ({
    subject: `🎉 You're live on TrueNorth Frames, ${p.firstName}!`,
    html: base({
      preheader: `Your photographer profile is approved — Edmonton clients can now find and book you.`,
      accentColor: BRAND.green,
      body: `
        ${h1(`You're Live, ${p.firstName}!`)}
        ${lead('Your TrueNorth Frames profile has been approved and is publicly visible to Edmonton clients.')}
        ${divider()}
        ${alertBox('Photographers with complete profiles get 3× more enquiries. Take 5 minutes to finish your setup.', BRAND.green)}
        ${p_('A few things to do to maximise your bookings:')}
        ${ul([
          'Upload 8–12 of your best portfolio shots',
          'Connect your Google Business Profile to unlock your trust score',
          'Set clear pricing and weekly availability',
          'Share your profile link on Instagram and Facebook',
        ])}
        ${cta('View Your Public Profile', `${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.username}`, BRAND.green)}
        ${divider()}
        ${p_(`Your profile link: <a href="${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.username}" style="color:#333;font-weight:600;word-break:break-all;">${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.username}</a>`)}
      `,
    }),
  }),

  // ── Photographer suspended ────────────────────────────────────────────────

  photographer_suspended: (p) => ({
    subject: `Important notice about your TrueNorth Frames account`,
    html: base({
      preheader: `Your account has been suspended — please contact us to resolve this.`,
      accentColor: BRAND.red,
      body: `
        ${h1('Account Suspended')}
        ${badge('Action Required', BRAND.red)}
        ${divider()}
        ${p_(`Hi ${p.firstName}, your TrueNorth Frames account has been temporarily suspended.`)}
        ${p.reason
          ? alertBox(`<strong>Reason:</strong> ${p.reason}`, BRAND.red)
          : p_('Our team found activity on your account that requires review.')}
        ${p_('While suspended, your profile is hidden from the marketplace and you cannot receive new booking requests. Existing conversations remain accessible.')}
        ${p_('To appeal this decision or get more information, email us directly:')}
        ${cta('Contact Support', `mailto:${SUPPORT_EMAIL()}?subject=Account suspension — ${encodeURIComponent(String(p.email))}`, BRAND.red)}
      `,
    }),
  }),

  // ── Review removed by admin (→ photographer) ──────────────────────────────

  review_removed: (p) => ({
    subject: `A review on your profile has been removed`,
    html: base({
      preheader: `After investigation, we removed a review that violated our policies.`,
      accentColor: BRAND.green,
      body: `
        ${h1('Review Removed')}
        ${lead('A flagged review has been taken down from your profile.')}
        ${divider()}
        ${p_(`Hi ${p.firstName}, after reviewing your report, our team found the review violated TrueNorth Frames' policies.`)}
        ${alertBox('The review has been <strong>permanently removed</strong> from your public profile and will no longer affect your ratings. Your trust score will update at the next sync.', BRAND.green)}
        ${cta('View Your Profile', `${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.username}`, BRAND.green)}
        ${divider()}
        ${p_('Thank you for helping keep TrueNorth Frames trustworthy. If you have any questions, reply to this email.')}
      `,
    }),
  }),

  // ── Review flag dismissed (→ photographer) ────────────────────────────────

  review_dismissed: (p) => ({
    subject: `Update on your review report`,
    html: base({
      preheader: `Our team reviewed your report — the review will remain on your profile.`,
      body: `
        ${h1('Review Report Update')}
        ${lead('Our team has completed its review of your flagged report.')}
        ${divider()}
        ${p_(`Hi ${p.firstName}, thank you for flagging a review — we take every report seriously.`)}
        ${alertBox('After careful investigation, our team determined the review does not violate our policies and it will <strong>remain on your profile</strong>.', BRAND.amber)}
        ${p_('If you believe there are additional details we should consider, contact our support team directly and we\'ll take another look.')}
        ${cta('Contact Support', `mailto:${SUPPORT_EMAIL()}?subject=Review dispute — ${encodeURIComponent(String(p.username))}`)}
      `,
    }),
  }),

  // ── Profile rejected ──────────────────────────────────────────────────────

  photographer_rejected: (p) => ({
    subject: `Your TrueNorth Frames profile needs a few updates`,
    html: base({
      preheader: `We couldn't approve your profile yet — here's exactly what to fix.`,
      accentColor: BRAND.amber,
      body: `
        ${h1('Profile Needs Some Work')}
        ${lead('Your profile isn\'t quite ready yet — but your account is still active and you can fix it now.')}
        ${divider()}
        ${p_(`Hi ${p.firstName}, thank you for joining TrueNorth Frames. After reviewing your profile, our team wasn't able to approve it at this time.`)}
        ${p.reason ? alertBox(`<strong>Reason from our team:</strong> ${p.reason}`, BRAND.amber) : ''}
        ${p_('The most common reasons profiles aren\'t approved:')}
        ${ul([
          'Bio is too short or doesn\'t describe your photography work',
          'No portfolio photos uploaded',
          'Rate or location not set',
          'Profile photo missing',
        ])}
        ${p_('Your account is still active. Log in, fix the issues, and your updated profile will be automatically reviewed within 1–2 business days.')}
        ${cta('Fix My Profile', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer`, BRAND.amber)}
        ${divider()}
        ${p_('Questions? Just reply to this email — we\'ll help you get approved.')}
      `,
    }),
  }),

  // ── Booking cancelled by client (→ photographer) ─────────────────────────

  booking_cancelled_by_client: (p) => ({
    subject: `Booking cancelled by ${p.clientName}`,
    html: base({
      preheader: `${p.clientName} has cancelled their booking for ${p.date}.`,
      accentColor: BRAND.amber,
      body: `
        ${h1('Booking Cancelled')}
        ${lead(`${p.clientName} has cancelled their booking for ${p.date}.`)}
        ${divider()}
        ${infoBox([
          { label: 'Client',       value: String(p.clientName) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Session type', value: String(p.sessionType) },
        ])}
        ${p.reason ? alertBox(`<strong>Reason from client:</strong> ${p.reason}`, BRAND.amber) : ''}
        ${p_('This time slot has been freed up on your availability calendar. No action required.')}
        ${cta('View Your Calendar', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?tab=availability`)}
      `,
    }),
  }),

  // ── Cancellation confirmed by photographer (→ client) ─────────────────────

  booking_cancellation_confirmed: (p) => ({
    subject: `Your cancellation request has been confirmed`,
    html: base({
      preheader: `${p.photographerName} has confirmed the cancellation of your session on ${p.date}.`,
      body: `
        ${h1('Cancellation Confirmed')}
        ${lead(`${p.photographerName} has accepted your cancellation request.`)}
        ${divider()}
        ${infoBox([
          { label: 'Photographer', value: String(p.photographerName) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Session type', value: String(p.sessionType) },
        ])}
        ${p_('Your booking has been fully cancelled. If you\'d like to rebook or find another photographer, browse the marketplace anytime.')}
        ${cta('Browse Photographers', `${process.env.NEXT_PUBLIC_APP_URL}/photographers`)}
      `,
    }),
  }),

  // ── Booking reminder → client ─────────────────────────────────────────────

  booking_reminder_client: (p) => ({
    subject: `📸 Reminder: your session with ${p.photographerName} is tomorrow`,
    html: base({
      preheader: `Just a heads-up — your photography session is tomorrow. Here are the details.`,
      body: `
        ${h1('Session Tomorrow!')}
        ${lead(`Your booking with ${p.photographerName} is confirmed for tomorrow.`)}
        ${divider()}
        ${infoBox([
          { label: 'Photographer', value: String(p.photographerName) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Time',         value: String(p.timeSlot) },
          { label: 'Location',     value: String(p.location ?? 'TBD — confirm with your photographer') },
          { label: 'Session type', value: String(p.sessionType) },
        ])}
        ${p_('Have last-minute questions? Message your photographer directly from your dashboard.')}
        ${cta('View Booking Details', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client`)}
        ${divider()}
        ${p_('After your session, please leave a review — it takes less than a minute and makes a real difference for independent photographers.')}
      `,
    }),
  }),

  // ── Booking reminder → photographer ──────────────────────────────────────

  booking_reminder_photographer: (p) => ({
    subject: `📅 Reminder: session with ${p.clientName} is tomorrow`,
    html: base({
      preheader: `You have a photography session booked for tomorrow — here are the details.`,
      body: `
        ${h1('Session Tomorrow')}
        ${lead(`Just a reminder about your confirmed booking for tomorrow.`)}
        ${divider()}
        ${infoBox([
          { label: 'Client',       value: String(p.clientName) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Time',         value: String(p.timeSlot) },
          { label: 'Location',     value: String(p.location ?? 'TBD') },
          { label: 'Session type', value: String(p.sessionType) },
        ])}
        ${p.clientNote ? quoteBlock(String(p.clientNote)) : ''}
        ${p_('Need to reach your client? Message them directly from your dashboard.')}
        ${cta('View Booking Details', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?tab=requests`)}
      `,
    }),
  }),

}

// ─── Renderer ─────────────────────────────────────────────────────────────────

export function renderTemplate(
  templateId: EmailTemplateId,
  payload: EmailPayload
): { subject: string; html: string } {
  const fn = TEMPLATES[templateId]
  if (!fn) throw new Error(`Unknown email template: ${templateId}`)
  return fn(payload)
}

// ─────────────────────────────────────────────────────────────────────────────
// TrueNorth Frames — Email Templates
// All emails share the same base layout (dark header, white body, clean footer).
// Each template function returns { subject, html }.
// ─────────────────────────────────────────────────────────────────────────────

export type EmailTemplateId =
  | 'welcome_client'
  | 'welcome_photographer'
  | 'booking_received'          // → photographer: you got a new booking request
  | 'booking_confirmed'         // → client: photographer approved
  | 'booking_declined'          // → client: photographer declined
  | 'booking_completed'         // → client: session marked complete, leave a review
  | 'new_conversation'          // → photographer: client started a conversation
  | 'review_received'           // → photographer: client left you a review
  | 'review_reply'              // → client: photographer replied to your review
  | 'support_ticket_created'    // → admin: new support ticket submitted
  | 'support_ticket_resolved'   // → submitter: your ticket was resolved
  | 'photographer_approved'     // → photographer: your profile was approved
  | 'photographer_suspended'    // → photographer: your account was suspended
  | 'review_removed'            // → photographer: a review was removed by admin
  | 'review_dismissed'          // → photographer: a review flag was dismissed (review stays)
  | 'booking_reminder_client'   // → client: session tomorrow reminder
  | 'booking_reminder_photographer' // → photographer: session tomorrow reminder

export type EmailPayload = Record<string, string | number | undefined | null>

// ─── Shared layout ────────────────────────────────────────────────────────────

function base({
  preheader,
  body,
}: {
  preheader: string
  body: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TrueNorth Frames</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- preheader -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f5f5f3;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f3;">
    <tr><td align="center" style="padding:32px 16px;">

      <!-- Card -->
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a1a;padding:24px 36px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align:middle;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="vertical-align:middle;padding-right:12px;">
                        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="TrueNorth Frames" width="36" height="36" style="display:block;border-radius:8px;" />
                      </td>
                      <td style="vertical-align:middle;">
                        <div style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1.2;">TrueNorth Frames</div>
                        <div style="font-size:11px;color:#888;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">Edmonton's Photographer Marketplace</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f8;border-top:1px solid #ebebeb;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#999;">
              TrueNorth Frames &middot; Edmonton, AB
            </p>
            <p style="margin:0;font-size:11px;color:#bbb;">
              Questions? Email us at
              <a href="mailto:support@truenorthframes.ca" style="color:#555;text-decoration:underline;">support@truenorthframes.ca</a>
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#ccc;">
              You're receiving this because you have an account on TrueNorth Frames.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Reusable HTML snippets ───────────────────────────────────────────────────

function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.4px;">${text}</h1>`
}

function subtitle(text: string) {
  return `<p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.5;">${text}</p>`
}

function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.65;">${text}</p>`
}

function cta(label: string, href: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px;">
    <tr>
      <td style="background:#1a1a1a;border-radius:10px;padding:14px 28px;">
        <a href="${href}" style="font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;white-space:nowrap;">${label}</a>
      </td>
    </tr>
  </table>`
}

function infoBox(rows: { label: string; value: string }[]) {
  const inner = rows
    .map(
      (r) =>
        `<tr>
          <td style="padding:8px 16px;font-size:13px;color:#888;width:40%;vertical-align:top;">${r.label}</td>
          <td style="padding:8px 16px;font-size:13px;color:#1a1a1a;font-weight:500;vertical-align:top;">${r.value}</td>
        </tr>`
    )
    .join('<tr><td colspan="2" style="padding:0 16px;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>')

  return `<table role="presentation" width="100%" style="border:1px solid #ebebeb;border-radius:10px;overflow:hidden;margin:20px 0;">
    ${inner}
  </table>`
}

function divider() {
  return `<div style="height:1px;background:#f0f0f0;margin:24px 0;"></div>`
}

function starRating(rating: number) {
  const filled = Math.round(Math.max(0, Math.min(5, rating)))
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="font-size:18px;color:${i < filled ? '#f59e0b' : '#e5e7eb'};">★</span>`
  ).join('')
  return `<div style="margin:12px 0;">${stars}</div>`
}

function badge(text: string, color: string = '#1a1a1a') {
  return `<span style="display:inline-block;background:${color}18;color:${color};font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;letter-spacing:0.04em;">${text.toUpperCase()}</span>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Template definitions
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<EmailTemplateId, (p: EmailPayload) => { subject: string; html: string }> = {

  // ── Welcome — Client ────────────────────────────────────────────────────────
  welcome_client: (p) => ({
    subject: `Welcome to TrueNorth Frames, ${p.firstName}!`,
    html: base({
      preheader: `Find Edmonton's best photographers — completely free.`,
      body: `
        ${h1(`Welcome, ${p.firstName}! 👋`)}
        ${subtitle('Your free TrueNorth Frames account is ready.')}
        ${divider()}
        ${p_(`Browse our curated list of Edmonton photographers, send a message, and book a session — all at zero cost. No platform fees, ever.`)}
        ${p_(`Here's what you can do right now:`)}
        <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#333;line-height:2;">
          <li>Browse verified photographers by specialty &amp; neighbourhood</li>
          <li>Message photographers directly</li>
          <li>Save your favourites for later</li>
          <li>Request and manage bookings</li>
        </ul>
        ${cta('Browse Photographers', `${process.env.NEXT_PUBLIC_APP_URL}/photographers`)}
        ${divider()}
        ${p_(`Need help getting started? Reply to this email — we're a small Edmonton team and we actually read every message.`)}
      `,
    }),
  }),

  // ── Welcome — Photographer ──────────────────────────────────────────────────
  welcome_photographer: (p) => ({
    subject: `Your TrueNorth Frames application is under review`,
    html: base({
      preheader: `We've received your profile — our team will review it within 48 hours.`,
      body: `
        ${h1(`Thanks for joining, ${p.firstName}!`)}
        ${subtitle('Your photographer profile is under review.')}
        ${divider()}
        ${p_(`We've received your profile and our team will review it within <strong>48 hours</strong>. You'll get an email as soon as it's approved and live on the marketplace.`)}
        ${p_(`While you wait, you can still log in and complete your profile:`)}
        <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#333;line-height:2;">
          <li>Upload portfolio photos</li>
          <li>Add your specialties &amp; pricing</li>
          <li>Connect your Google Business Profile for a trust score</li>
        </ul>
        ${cta('Complete Your Profile', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer`)}
        ${divider()}
        ${p_(`Questions about the review process? Email <a href="mailto:support@truenorthframes.ca" style="color:#1a1a1a;">support@truenorthframes.ca</a> — we respond within one business day.`)}
      `,
    }),
  }),

  // ── Booking received (→ photographer) ──────────────────────────────────────
  booking_received: (p) => ({
    subject: `New booking request from ${p.clientName}`,
    html: base({
      preheader: `${p.clientName} wants to book a ${p.sessionType} session on ${p.date}.`,
      body: `
        ${h1('New Booking Request')}
        ${subtitle(`You have a new request waiting for your response.`)}
        ${divider()}
        ${infoBox([
          { label: 'Client',        value: String(p.clientName) },
          { label: 'Session type',  value: String(p.sessionType) },
          { label: 'Date',          value: String(p.date) },
          { label: 'Location',      value: String(p.location ?? 'TBD') },
          { label: 'Notes',         value: String(p.notes ?? 'None') },
        ])}
        ${p_(`Head to your dashboard to <strong>accept or decline</strong> this request. Clients appreciate a quick response — aim to reply within 24 hours.`)}
        ${cta('View Booking Request', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer`)}
        ${divider()}
        ${p_(`If you have questions for the client, you can message them directly from your dashboard after viewing the request.`)}
      `,
    }),
  }),

  // ── Booking confirmed (→ client) ────────────────────────────────────────────
  booking_confirmed: (p) => ({
    subject: `Your booking with ${p.photographerName} is confirmed! 🎉`,
    html: base({
      preheader: `${p.photographerName} has accepted your booking for ${p.date}.`,
      body: `
        ${h1('Booking Confirmed!')}
        ${subtitle(`Great news — your session is locked in.`)}
        ${divider()}
        ${infoBox([
          { label: 'Photographer', value: String(p.photographerName) },
          { label: 'Session type', value: String(p.sessionType) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Location',     value: String(p.location ?? 'TBD') },
        ])}
        ${p_(`Your photographer may reach out with more details. You can also message them directly from your dashboard at any time.`)}
        ${p.photographerNote ? p_(`<strong>Note from ${p.photographerName}:</strong> "${p.photographerNote}"`) : ''}
        ${cta('View My Bookings', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client`)}
        ${divider()}
        ${p_(`After your session, you'll be able to leave a review to help other Edmonton clients find great photographers.`)}
      `,
    }),
  }),

  // ── Booking declined (→ client) ─────────────────────────────────────────────
  booking_declined: (p) => ({
    subject: `Booking update from ${p.photographerName}`,
    html: base({
      preheader: `${p.photographerName} is unable to take your booking for ${p.date}.`,
      body: `
        ${h1('Booking Not Available')}
        ${subtitle(`Unfortunately, ${p.photographerName} couldn't accept this request.`)}
        ${divider()}
        ${infoBox([
          { label: 'Photographer', value: String(p.photographerName) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Session type', value: String(p.sessionType) },
        ])}
        ${p.photographerNote ? p_(`<strong>Reason from ${p.photographerName}:</strong> "${p.photographerNote}"`) : p_(`No reason was provided.`)}
        ${p_(`Don't worry — there are plenty of great photographers on TrueNorth Frames. Browse others with similar styles and availability.`)}
        ${cta('Find Another Photographer', `${process.env.NEXT_PUBLIC_APP_URL}/photographers`)}
      `,
    }),
  }),

  // ── Booking completed (→ client) ────────────────────────────────────────────
  booking_completed: (p) => ({
    subject: `How was your session with ${p.photographerName}?`,
    html: base({
      preheader: `Your session is complete — leave a review to help the Edmonton community.`,
      body: `
        ${h1('Session Complete!')}
        ${subtitle(`Hope you had an amazing shoot. 📸`)}
        ${divider()}
        ${p_(`Your session with <strong>${p.photographerName}</strong> on <strong>${p.date}</strong> has been marked as complete.`)}
        ${p_(`Reviews help other Edmonton clients make great decisions — and they mean the world to independent photographers. Takes less than 60 seconds.`)}
        ${cta('Leave a Review', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client`)}
        ${divider()}
        ${p_(`If anything didn't go as expected, you can also contact our support team and we'll look into it.`)}
      `,
    }),
  }),

  // ── New conversation (→ photographer) ──────────────────────────────────────
  new_conversation: (p) => ({
    subject: `${p.clientName} sent you a message`,
    html: base({
      preheader: `A new client has reached out — reply to keep the conversation going.`,
      body: `
        ${h1(`New Message from ${p.clientName}`)}
        ${subtitle(`A client wants to connect with you on TrueNorth Frames.`)}
        ${divider()}
        <div style="background:#f9f9f8;border-left:3px solid #1a1a1a;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;font-size:14px;color:#333;line-height:1.6;font-style:italic;">
          "${p.messagePreview}"
        </div>
        ${p_(`Photographers who respond within a few hours get significantly more bookings. Head to your dashboard to reply.`)}
        ${cta('Reply to Message', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer`)}
        ${divider()}
        ${p_(`If this message seems inappropriate or is spam, you can report it from within the conversation.`)}
      `,
    }),
  }),

  // ── Review received (→ photographer) ───────────────────────────────────────
  review_received: (p) => ({
    subject: `${p.clientName} left you a ${p.rating}★ review`,
    html: base({
      preheader: `See what your client said about your work.`,
      body: `
        ${h1('New Review')}
        ${subtitle(`${p.clientName} reviewed your session on ${p.date}.`)}
        ${divider()}
        ${starRating(Number(p.rating))}
        ${p.reviewBody ? `<div style="background:#f9f9f8;border-radius:10px;padding:16px 20px;margin:0 0 24px;font-size:14px;color:#333;line-height:1.65;font-style:italic;">"${p.reviewBody}"</div>` : p_('No written review — rating only.')}
        ${p_(`Responding to reviews shows professionalism and builds trust with future clients. You can reply from your dashboard.`)}
        ${cta('View & Reply to Review', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer`)}
      `,
    }),
  }),

  // ── Review reply (→ client) ─────────────────────────────────────────────────
  review_reply: (p) => ({
    subject: `${p.photographerName} replied to your review`,
    html: base({
      preheader: `Your photographer responded to the review you left.`,
      body: `
        ${h1('Your Review Got a Reply')}
        ${subtitle(`${p.photographerName} responded to your review.`)}
        ${divider()}
        ${p_(`Your original review:`)}
        <div style="background:#f9f9f8;border-radius:10px;padding:14px 18px;margin:0 0 16px;font-size:13px;color:#555;line-height:1.6;font-style:italic;">"${p.reviewBody}"</div>
        ${p_(`<strong>${p.photographerName}'s reply:</strong>`)}
        <div style="background:#f0f4ff;border-radius:10px;padding:14px 18px;margin:0 0 24px;font-size:14px;color:#1a1a1a;line-height:1.65;font-style:italic;">"${p.replyBody}"</div>
        ${cta('View on TrueNorth Frames', `${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.photographerUsername}`)}
      `,
    }),
  }),

  // ── Support ticket created (→ admin notification email) ────────────────────
  support_ticket_created: (p) => ({
    subject: `[Support #${p.ticketId?.toString().slice(0, 8)}] New ticket: ${p.subject}`,
    html: base({
      preheader: `A new support ticket requires your attention.`,
      body: `
        ${h1('New Support Ticket')}
        ${subtitle(`Submitted by ${p.submitterName} · ${p.category}`)}
        ${divider()}
        ${infoBox([
          { label: 'Ticket ID',   value: `#${String(p.ticketId).slice(0, 8)}` },
          { label: 'Category',    value: String(p.category).replace(/_/g, ' ') },
          { label: 'Submitted by',value: String(p.submitterName) },
          { label: 'Role',        value: String(p.submitterRole) },
          { label: 'Subject',     value: String(p.subject) },
        ])}
        <div style="background:#f9f9f8;border-radius:10px;padding:14px 18px;margin:0 0 24px;font-size:14px;color:#333;line-height:1.65;">
          ${String(p.description)}
        </div>
        ${cta('View in Admin Portal', `${process.env.NEXT_PUBLIC_APP_URL}/admin/support`)}
      `,
    }),
  }),

  // ── Support ticket resolved (→ submitter) ───────────────────────────────────
  support_ticket_resolved: (p) => ({
    subject: `Your support ticket has been resolved`,
    html: base({
      preheader: `We've resolved your support request — here's what happened.`,
      body: `
        ${h1('Ticket Resolved')}
        ${subtitle(`Support ticket #${String(p.ticketId).slice(0, 8)} · ${String(p.subject)}`)}
        ${divider()}
        ${p_(`Hi ${p.firstName}, your support request has been reviewed and resolved by our team.`)}
        ${p.resolutionNote
          ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin:0 0 24px;font-size:14px;color:#166534;line-height:1.65;">
              <strong>Resolution:</strong><br/>${p.resolutionNote}
            </div>`
          : p_(`Our team has reviewed your ticket and taken appropriate action.`)
        }
        ${p_(`If you have further questions or the issue persists, don't hesitate to reach out again.`)}
        ${cta('Back to Dashboard', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${p.role === 'photographer' ? 'photographer' : 'client'}`)}
      `,
    }),
  }),

  // ── Photographer approved (→ photographer) ──────────────────────────────────
  photographer_approved: (p) => ({
    subject: `You're live on TrueNorth Frames! 🎉`,
    html: base({
      preheader: `Your photographer profile has been approved — clients can now find you.`,
      body: `
        ${h1(`You're Live, ${p.firstName}!`)}
        ${subtitle('Your TrueNorth Frames profile is now publicly visible.')}
        ${divider()}
        ${p_(`Congratulations — your profile has been reviewed and approved. Edmonton clients can now discover and contact you through the marketplace.`)}
        ${p_(`A few things to do to maximise your bookings:`)}
        <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#333;line-height:2;">
          <li>Upload 6–12 of your best portfolio shots</li>
          <li>Connect your Google Business Profile to unlock your trust score</li>
          <li>Add clear pricing and availability details</li>
          <li>Share your public profile link on social media</li>
        </ul>
        ${cta('View Your Public Profile', `${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.username}`)}
        ${divider()}
        ${p_(`Your profile link: <a href="${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.username}" style="color:#1a1a1a;font-weight:500;">${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.username}</a>`)}
      `,
    }),
  }),

  // ── Photographer suspended (→ photographer) ─────────────────────────────────
  photographer_suspended: (p) => ({
    subject: `Important notice regarding your TrueNorth Frames account`,
    html: base({
      preheader: `Your account has been suspended — please contact us to resolve this.`,
      body: `
        ${h1('Account Suspended')}
        ${badge('Action Required', '#dc2626')}
        ${divider()}
        ${p_(`Hi ${p.firstName}, your TrueNorth Frames account has been temporarily suspended.`)}
        ${p.reason
          ? `${p_(`<strong>Reason:</strong> ${p.reason}`)}`
          : p_(`Our team found activity on your account that requires review.`)
        }
        ${p_(`While suspended, your profile is hidden from the marketplace and you cannot receive new bookings. Existing conversations remain accessible.`)}
        ${p_(`To appeal this decision or get more information, please email us directly.`)}
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px;">
          <tr>
            <td style="background:#1a1a1a;border-radius:10px;padding:14px 28px;">
              <a href="mailto:support@truenorthframes.ca?subject=Account suspension appeal — ${encodeURIComponent(String(p.email))}" style="font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Contact Support</a>
            </td>
          </tr>
        </table>
      `,
    }),
  }),

  // ── Review removed by admin (→ photographer) ────────────────────────────────
  review_removed: (p) => ({
    subject: `A review on your profile has been removed`,
    html: base({
      preheader: `After investigation, we've removed a review that violated our policies.`,
      body: `
        ${h1('Review Removed')}
        ${subtitle('A flagged review has been taken down from your profile.')}
        ${divider()}
        ${p_(`Hi ${p.firstName}, after reviewing the report you submitted, our team found that the review in question violated TrueNorth Frames' review policies.`)}
        ${p_(`The review has been <strong>permanently removed</strong> from your public profile and will no longer appear or affect your ratings.`)}
        ${p_(`Your trust score and rating averages will update at the next sync.`)}
        ${cta('View Your Profile', `${process.env.NEXT_PUBLIC_APP_URL}/photographers/${p.username}`)}
        ${divider()}
        ${p_(`Thank you for helping keep TrueNorth Frames trustworthy. If you have any questions, reply to this email.`)}
      `,
    }),
  }),

  // ── Review flag dismissed (→ photographer) ──────────────────────────────────
  review_dismissed: (p) => ({
    subject: `Update on your review report`,
    html: base({
      preheader: `Our team has reviewed your report and the review will remain on your profile.`,
      body: `
        ${h1('Review Report Update')}
        ${subtitle('Our team has completed its review of your report.')}
        ${divider()}
        ${p_(`Hi ${p.firstName}, thank you for flagging a review on your profile. We take every report seriously and reviewed this one carefully.`)}
        ${p_(`After investigation, our team determined the review does not violate our policies and it will <strong>remain on your profile</strong>.`)}
        ${p_(`If you believe there are additional details we should consider, please contact our support team directly and we'll take another look.`)}
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px;">
          <tr>
            <td style="background:#1a1a1a;border-radius:10px;padding:14px 28px;">
              <a href="mailto:support@truenorthframes.ca?subject=Review dispute — ${encodeURIComponent(String(p.username))}" style="font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Contact Support</a>
            </td>
          </tr>
        </table>
      `,
    }),
  }),

  // ── Booking reminder → client ───────────────────────────────────────────────
  booking_reminder_client: (p) => ({
    subject: `Reminder: your session with ${p.photographerName} is tomorrow`,
    html: base({
      preheader: `Just a heads-up — your photography session is tomorrow.`,
      body: `
        ${h1('Session Tomorrow! 📸')}
        ${subtitle(`Your booking with ${p.photographerName} is confirmed for tomorrow.`)}
        ${divider()}
        ${infoBox([
          { label: 'Photographer', value: String(p.photographerName) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Time',         value: String(p.timeSlot) },
          { label: 'Location',     value: String(p.location ?? 'TBD — check with your photographer') },
          { label: 'Session type', value: String(p.sessionType) },
        ])}
        ${p_(`Have any last-minute questions? Message your photographer directly from your dashboard.`)}
        ${cta('View Booking', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client`)}
        ${divider()}
        ${p_(`After your session, you'll be able to leave a review. It takes less than a minute and makes a big difference for independent photographers.`)}
      `,
    }),
  }),

  // ── Booking reminder → photographer ────────────────────────────────────────
  booking_reminder_photographer: (p) => ({
    subject: `Reminder: session with ${p.clientName} is tomorrow`,
    html: base({
      preheader: `You have a photography session booked for tomorrow.`,
      body: `
        ${h1('Session Tomorrow')}
        ${subtitle(`Just a reminder about your booking for tomorrow.`)}
        ${divider()}
        ${infoBox([
          { label: 'Client',       value: String(p.clientName) },
          { label: 'Date',         value: String(p.date) },
          { label: 'Time',         value: String(p.timeSlot) },
          { label: 'Location',     value: String(p.location ?? 'TBD') },
          { label: 'Session type', value: String(p.sessionType) },
        ])}
        ${p.clientNote ? p_(`<strong>Client note:</strong> "${p.clientNote}"`) : ''}
        ${p_(`Need to reach your client? You can message them directly from your dashboard.`)}
        ${cta('View Booking', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer`)}
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

// ─── Internal alias (avoids name collision with template p() helper) ──────────
function p_(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.65;">${text}</p>`
}

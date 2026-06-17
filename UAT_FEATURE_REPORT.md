# TrueNorth Frames — UAT Feature Report
**Platform:** thetruenorthframes.com
**Market:** Edmonton, Alberta
**Date:** June 2026
**Status:** Ready for User Acceptance Testing

---

## What is TrueNorth Frames?

TrueNorth Frames is Edmonton's dedicated photography marketplace — a free platform that connects clients who need a photographer with local professionals who want more bookings. No commission, no booking fees, no middlemen.

---

## What Is Live and Working

### Authentication

| Feature | Status |
|---|---|
| Email + password signup with confirmation | Live |
| Google sign-in (one-click) | Live |
| Password reset / forgot password | Live |
| Secure session management | Live |
| Account deletion (self-service) | Live |

---

## For Clients

### Find a Photographer

- **Browse page** with three views: a Pinterest-style photo masonry grid, a photographer directory, and a packages listing
- **Filter by** specialty, neighbourhood, minimum rating, and availability today
- **Sort by** rating, most reviewed, or newest
- **Compare** two photographers side by side (rates, rating, reviews, trust score, badges, specialties)
- **Save** photographers to a shortlist and revisit from your dashboard

### Know Who You're Hiring

Every photographer has a public profile showing:
- Display name, bio, location, hourly rate, years of experience
- Portfolio albums with photos and videos in a lightbox carousel
- Trust Score (see Trust Score section below)
- Average star rating and review count
- Active specialties (e.g. Wedding, Portrait, Newborn, Corporate)
- Service packages with pricing
- FAQ answers the photographer has written
- Badge (Rising Talent, Verified Pro, Trusted Pro — earned, not purchased)

### Book a Session

- Submit a booking request directly from the photographer's profile — date, time, occasion, and a short description
- Receive an email the moment the photographer accepts
- Automated 24-hour reminder email before every shoot
- Cancel a pending or approved booking with a reason — the photographer confirms the cancellation
- Full booking history in your dashboard with statuses: Pending, Confirmed, Declined, Cancelled, Completed

### Message Directly

- Threaded direct messages with any photographer you've connected with
- File and image attachments supported in conversations
- Unread count badge on the message icon
- Full conversation history always accessible from your dashboard

### Reviews

- After a completed session, leave a star rating and written review
- Rate overall (required) plus optional sub-categories: Communication, Photo Quality, Punctuality, Value for Money
- Photographers can reply publicly; you can follow up on their reply
- All reviews are visible on the photographer's public profile

### Stay Up to Date

- In-app notification centre — booking updates, messages, and review replies surface automatically
- Email notifications for every key event
- Control your notification preferences from settings

---

## For Photographers

### A Free Professional Profile

- Dedicated public profile at `thetruenorthframes.com/photographers/your-username`
- Avatar and cover photo
- Bio, location, hourly rate, years of experience, and website link
- **Zero commission** — every booking enquiry comes directly to you, you negotiate the deal

### Portfolio That Does the Selling

- Organise work into named albums
- Upload photos with captions, tags, and shoot date metadata
- Upload video reels
- Set a cover photo per album
- Drag to reorder photos within an album
- Public-facing view adapts: masonry grid on desktop, swipeable vertical reel on mobile
- Clients can filter your portfolio by tag or specialty

### The Trust Score

- A calculated credibility rating — the platform's way of surfacing quality photographers to clients
- Built from real signals:
  - **Google Business Profile** — star rating, review count, account age, verification status (connected via OAuth)
  - **Platform activity** — profile completeness, booking history, native review average
  - **Verification status** — admin-verified badge
- Connect your Google Business Profile from your dashboard Trust tab with one click
- Trigger a manual score refresh at any time
- See a full breakdown of what's contributing to your score
- Score translates into a visible badge on your profile and the photographers listing

> Facebook and Instagram signals are designed into the system and will be connected in a future release after Meta app review. The OAuth framework is already in place.

### Manage Your Calendar

- Set weekly availability with specific time slots per day
- Block individual days when you're not available
- Clients book from your stated availability only — no surprise requests

### Service Packages

- Create named packages (e.g. "2-Hour Portrait Session", "Full-Day Wedding") with price and description
- Set billing type: hourly or flat session rate
- Upload a banner image per package
- Mark a package as featured
- All packages appear on the platform's packages tab and on your profile

### Handle Bookings

- Receive booking requests with full context: occasion, date, time, client description
- Accept or decline, with an optional note to the client
- Confirm client cancellation requests
- Mark a completed session as done to prompt the client to leave a review
- Full booking history with status tracking

### Reviews and Reputation

- Clients leave star ratings and written reviews after completed sessions
- Reply publicly to any review
- Your average rating and review count appear on your public profile and in search results
- Native reviews contribute directly to your Trust Score

### Network with Other Photographers

- Connect with other Edmonton photographers on the platform
- Direct message peers
- Create or join **group chats** for community discussion
- Post a **cover request** — ask your network to cover a shoot if you're booked out
- Block a photographer from contacting you

### FAQs on Your Profile

- Write up to the platform limit of FAQ entries
- Clients read answers before reaching out — reduces repetitive back-and-forth

### Notifications and Messages

- In-app notification centre with unread count badge
- Email notifications for bookings, reviews, trust score changes, and messages
- Full message inbox for client conversations and photographer-to-photographer DMs

---

## Admin (Platform Management)

### Account Approval

- All new photographer profiles land in **Pending** status
- Admin reviews and approves or rejects each profile
- Automatic email to the photographer on approval or rejection
- Admin notification email sent the moment a photographer completes onboarding

### Account Management

- View all accounts (clients and photographers)
- Suspend or reinstate any account
- Delete accounts

### Trust Health

- Dashboard showing trust score distributions across all photographers
- Monitor OAuth sync failures and signal quality
- Manually trigger a trust score sync for any photographer or all at once

### Analytics

- Platform-wide stats: total signups, active users, bookings created, reviews submitted, support tickets open

### Conversation Monitoring

- Admin can view any conversation on the platform for moderation

### Support Tickets

- Users submit support requests from a contact form
- Admin views, responds to, and closes tickets
- Automatic email to user when their ticket is resolved

### Audit Log

- All admin actions are recorded with timestamp and acting admin

---

## Email Notifications (Full List)

All emails are sent from **TrueNorth Frames** (hello@thetruenorthframes.com) using Resend.

| Event | Who Gets It |
|---|---|
| Onboarding completed | Client — welcome email |
| Onboarding completed | Photographer — welcome email |
| Photographer registers | Admin — approval notification |
| Booking request submitted | Photographer |
| Booking confirmed | Client |
| Booking declined | Client |
| Booking cancelled | Relevant party |
| Booking completed | Client (prompts review) |
| 24 hours before shoot | Client and Photographer |
| New review received | Photographer |
| Photographer replies to review | Client |
| Photographer profile approved | Photographer |
| Photographer profile rejected | Photographer |
| Account suspended | Photographer |
| Support ticket opened | Submitter |
| Support ticket resolved | Submitter |

---

## What Is Not in This Release

These are explicitly out of scope for UAT and have been noted for a future release:

| Feature | Notes |
|---|---|
| Facebook trust signal | OAuth framework built, sync disabled pending Meta app review |
| Instagram trust signal | Same as Facebook — infrastructure ready, not activated |
| Payment processing | Bookings are negotiated and paid directly between client and photographer |
| Live push messaging | Messages and notifications refresh automatically; instant push delivery via WebSocket is a post-launch enhancement |
| Multiple cities | Edmonton only at launch |

---

## UAT Test Paths

### Client Journey
1. Sign up with Google → select "Client" → complete onboarding → receive welcome email
2. Browse photographers → filter by specialty → compare two → save one
3. Open a photographer profile → read FAQ → view portfolio → submit a booking request
4. Receive booking confirmed email → check 24-hour reminder
5. Mark booking complete → leave a review
6. Reply to photographer's review reply
7. Check notification centre throughout

### Photographer Journey
1. Sign up with email → confirm email → select "Photographer" → complete onboarding → receive welcome email
2. Admin receives notification → reviews profile → approves → photographer receives approval email
3. Log in → upload portfolio photos to an album → add video reel
4. Set weekly availability → create two service packages
5. Connect Google Business Profile → view trust score breakdown
6. Receive a booking request → approve it → receive 24-hour reminder
7. Mark booking complete → client leaves review → reply to the review
8. Message a peer photographer → create a group chat
9. Post a cover request

### Admin Journey
1. Log in to `/admin`
2. See pending photographer → approve → confirm photographer receives email
3. View analytics dashboard
4. Check trust health panel
5. Open a support ticket → resolve it → confirm user receives email
6. View conversation list → open a thread

---

*TrueNorth Frames — UAT Feature Report — June 2026*

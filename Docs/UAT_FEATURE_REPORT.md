# TrueNorth Frames — UAT Feature Report
**Platform:** thetruenorthframes.com
**Date:** June 2026
**Status:** Ready for User Acceptance Testing

---

## What is TrueNorth Frames?

TrueNorth Frames is Edmonton's dedicated photography marketplace — connecting clients who need a photographer with local professionals who want more bookings. No commissions, no middlemen, no noise.

---

## For Clients

### Find the Right Photographer
- Browse verified Edmonton photographers with rich public profiles — bio, specialty, hourly rate, portfolio, and trust score all visible before reaching out
- Filter by specialty (weddings, portraits, newborns, corporate, real estate, events, and more)
- Compare up to multiple photographers side-by-side before deciding
- Save favourite photographers to revisit later

### Know Who You're Booking
- Every photographer carries a **Trust Score** — a calculated credibility rating built from their Google Business Profile reviews, platform presence, activity on TrueNorth Frames, and verified information
- Badges surface at a glance (Rising Star, Verified Pro, etc.) so quality is easy to spot
- Public FAQ section on each profile answers common questions before you even need to ask

### Book Directly
- Send a booking request with your preferred date, time, and a description of what you need
- Receive email confirmation once the photographer accepts
- Automated 24-hour reminder email before every shoot — no calendar juggling
- Cancel a booking with a single click if plans change

### Message Without Friction
- Direct messaging with any photographer you've connected with — no need to share personal contact details
- File and image sharing within conversations
- Full conversation history saved and accessible from your dashboard

### Stay Informed
- Real-time notification centre — booking updates, messages, and review replies surface instantly
- Email notifications for every key event (booking confirmed, reminder, review reply)
- Notification preferences you control

### Packages, Not Surprises
- Photographers list clearly priced service packages — you know exactly what you're getting before committing

### Leave a Review
- After a shoot, leave a star rating and written review directly on the platform
- Photographers can reply to your review — the conversation stays transparent and public

---

## For Photographers

### A Professional Home Base — Free
- Dedicated public profile at `thetruenorthframes.com/photographers/your-username`
- Display name, bio, location, hourly rate, years of experience, and website link
- Avatar and cover photo to make the profile your own
- No commission on bookings — what you charge is what you keep

### Showcase Your Work
- Portfolio organised into named albums (up to the platform limit per photographer)
- Upload photos with captions, tags (Wedding, Golden Hour, Studio, etc.), and shoot date
- Upload video reels alongside photos
- Set a cover photo per album to control first impressions
- Portfolio reel auto-generated for your public profile

### Build Credibility with the Trust Score
- Your **Trust Score** is calculated from real signals:
  - Google Business Profile star rating and review count
  - Facebook and Instagram presence
  - Native TrueNorth Frames reviews
  - Profile completeness and platform activity
  - Verification status
- Connect your Google Business Profile, Facebook, and Instagram via OAuth — score updates automatically
- Manually trigger a trust sync from your dashboard whenever you want a refresh
- Score breakdown visible to you — see exactly what's contributing

### Manage Your Calendar
- Set weekly availability with time slots — clients see when you're open before requesting
- Block specific days when you're unavailable
- Booking requests come in only during your stated availability

### Service Packages
- Create named packages (e.g. "2-Hour Portrait Session", "Full-Day Wedding Coverage") with pricing and descriptions
- Mark a package as featured to make it stand out on your profile
- Edit or remove packages at any time

### Handle Bookings
- Receive booking requests with full context (date, time, client description)
- Accept or decline from your dashboard
- Mark a completed session as done to trigger the review flow
- Full booking history in one place

### Connect with Other Photographers
- Photographer-only professional network — follow and connect with peers
- Direct messages between photographers
- Create or join **group chats** for local community conversations
- Cover requests — ask connections to cover a shoot if you're unavailable

### FAQs on Your Profile
- Add up to the platform limit of FAQ entries to your profile
- Clients read answers before reaching out — reduces repetitive enquiries

### Stay on Top of Things
- Notification centre for bookings, messages, reviews, and trust score changes
- Email notifications sent from TrueNorth Frames for every meaningful event
- Profile preview mode — see exactly what clients see before publishing changes

---

## Platform Trust & Safety (Admin Layer)

> Not visible to end users but part of the UAT scope.

- **Account approval workflow** — new photographer profiles sit in `pending` status; admin reviews and approves or rejects
- **Admin notification email** sent automatically when a photographer completes onboarding
- **Account management** — admin can suspend, reinstate, or delete accounts
- **Conversation monitoring** — admin can view all platform conversations for moderation
- **Support ticket system** — users can submit issues; admin resolves and closes tickets
- **Analytics dashboard** — signups, bookings, reviews, and trust activity at a glance
- **Trust health dashboard** — monitor sync failures, score distributions, and OAuth connection status across all photographers
- **Audit log** — all admin actions are recorded

---

## Automated Email Notifications

Every key touchpoint triggers a branded email from **TrueNorth Frames** (hello@thetruenorthframes.com):

| Trigger | Recipient |
|---|---|
| Onboarding complete | Client — welcome email |
| Onboarding complete | Photographer — welcome email |
| New photographer registered | Admin — approval notification |
| Booking request received | Photographer |
| Booking confirmed | Client |
| Booking declined | Client |
| Booking cancelled | Relevant party |
| Booking completed | Client (prompts review) |
| 24 hours before shoot | Both client and photographer |
| New review received | Photographer |
| Review reply posted | Client |
| Photographer approved | Photographer |
| Photographer rejected | Photographer |
| Photographer suspended | Photographer |
| Support ticket opened | Submitter |
| Support ticket resolved | Submitter |

---

## Authentication

- Email + password signup with email confirmation
- Google OAuth — sign in with Google, land on role selection for new users
- Forgot password / reset password flow
- Session management with secure cookie-based auth (Supabase SSR)
- Account deletion self-service

---

## UAT Scope — Suggested Test Paths

### Client Journey
1. Sign up via Google → select "Client" role → complete onboarding → receive welcome email
2. Browse photographers → save one → open their profile → read FAQ, view portfolio, check trust score
3. Send a booking request → receive confirmation email
4. Message the photographer
5. After session marked complete → leave a review
6. Check notification centre

### Photographer Journey
1. Sign up via email → confirm email → select "Photographer" role → complete onboarding → receive welcome email
2. Admin receives approval notification → approves account
3. Upload portfolio photos and videos into albums
4. Set availability and create service packages
5. Connect Google Business Profile via OAuth → trust score syncs
6. Receive a booking request → accept → receive 24hr reminder
7. Mark booking complete → client receives review prompt
8. Reply to a review
9. Connect with another photographer → send a direct message → join a group

### Admin Journey
1. Log in to `/admin`
2. Review pending photographer account → approve
3. View analytics dashboard
4. Check trust health panel
5. Open and resolve a support ticket
6. Monitor conversation list

---

*Report prepared for TrueNorth Frames UAT — June 2026*

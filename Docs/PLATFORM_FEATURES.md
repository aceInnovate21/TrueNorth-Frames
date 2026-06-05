# TrueNorth Frames — Platform Feature Reference

**Last updated:** June 2026  
**Stack:** Next.js 14 (App Router) · Supabase · Cloudflare R2 · Resend · Vercel  
**Deployed:** https://truenorthframes.vercel.app  

This document is the authoritative reference for every feature currently built in the platform. It is derived directly from the codebase — if it's in here, the code exists and the API routes are wired. Gaps and deferred items are called out explicitly.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Onboarding](#2-onboarding)
3. [Public Pages & Marketing](#3-public-pages--marketing)
4. [Browse & Discovery](#4-browse--discovery)
5. [Photographer Profile (Public)](#5-photographer-profile-public)
6. [Photographer Dashboard](#6-photographer-dashboard)
7. [Client Dashboard](#7-client-dashboard)
8. [Messaging](#8-messaging)
9. [Bookings](#9-bookings)
10. [Reviews](#10-reviews)
11. [Trust Score & Badges](#11-trust-score--badges)
12. [Photographer Network](#12-photographer-network)
13. [Notifications](#13-notifications)
14. [Email System](#14-email-system)
15. [Storage (Cloudflare R2)](#15-storage-cloudflare-r2)
16. [Admin Portal](#16-admin-portal)
17. [Background Jobs (Cron)](#17-background-jobs-cron)
18. [Platform Configuration](#18-platform-configuration)
19. [Database Schema](#19-database-schema)
20. [Pending / Not Yet Built](#20-pending--not-yet-built)

---

## 1. Authentication

**Pages:** `/login` · `/signup` · `/forgot-password` · `/reset-password` · `/auth/callback` · `/auth/confirm`

**API routes:** `POST /api/auth/register` · `POST /api/auth/signout` · `GET /api/auth/me`

### What's built

| Feature | Detail |
|---|---|
| Email + password signup | Role selector (client / photographer). Password strength meter. Terms agreement gate. |
| Email + password login | Role validation on login — role mismatch signs user out with clear error. |
| Forgot password | Supabase magic-link reset flow. Branded reset page. |
| Session management | Supabase SSR cookies. Middleware refreshes session on every request. |
| Role-based middleware | Unauthenticated → `/login`. Wrong role → redirected to correct dashboard. |
| Rejected photographer gate | Login blocked immediately. Existing sessions killed via `auth.admin.signOut(userId, 'global')`. Redirected to `/login?error=rejected` with message. |
| Account deletion | `POST /api/account/delete` — hard-deletes user and all associated data. |
| Register API | Creates `users` row via service role (bypasses RLS). Queues welcome email + in-app notification immediately on signup. |

### Not built yet

- Google OAuth / Gmail login — deferred to near-launch. Supabase provider is ready to enable.

---

## 2. Onboarding

**Pages:** `/onboarding` (client) · `/onboarding/photographer` (photographer)

**API routes:** `POST /api/onboarding/client` · `POST /api/onboarding/photographer`

### Photographer onboarding (3 steps)

| Step | Fields collected | Saved to |
|---|---|---|
| 1 — Basics | Display name, bio (≥20 chars), Edmonton area, starting rate ($/hr), years of experience | `photographer_profiles` |
| 2 — Specialties | Up to 5 from 12 options | `photographer_specialties` |
| 3 — Online presence | Has GBP? (yes/no), Has GBP reviews? (yes/no), Has website? (yes/no) + URL | `photographer_profiles` — self-reported fields only |

**Key behaviours:**
- Username auto-generated from display name (slugified, collision-safe loop)
- Rate stored as formatted string `"$150 / hr"` in `rate_display`
- `profile_status` set to `'pending'` on completion — admin must approve before going public
- `has_gbp_self_reported`, `has_gbp_reviews_self_reported`, `has_website_self_reported` saved — informational only, not used for badge computation
- Website URL always saved (null if not provided). Was previously only saved if non-empty — fixed.
- After completion, redirected to `/dashboard/photographer` with amber "under review" banner
- Badge ladder shown in step 3 explaining how to earn each badge — informational, not a gate

### Client onboarding (1 step)

- Interests selection (photography styles/occasions)
- Saved to `client_interests` table
- Redirected to `/dashboard/client`

---

## 3. Public Pages & Marketing

| Route | Purpose |
|---|---|
| `/` | Homepage — hero, specialty browse, featured photographers section, how-it-works, trust section, photographer CTA |
| `/about` | About TrueNorth Frames |
| `/for-photographers` | Photographer acquisition page |
| `/how-it-works` | Step-by-step explainer for clients |
| `/guidelines` | Community guidelines |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

All pages use the shared `nav.tsx` and `footer.tsx` components. Nav is role-aware — shows dashboard link when logged in.

---

## 4. Browse & Discovery

**Page:** `/photographers`  
**API:** `GET /api/photographers`

### Filters available

| Filter | Implementation |
|---|---|
| Text search (`q`) | `ilike` across `display_name`, `bio`, `location` |
| Specialty | Post-fetch filter against `photographer_specialties` join |
| Neighbourhood | String contains match on `location` |
| Min rating | `gte` on `native_avg_rating` |
| Available today | Checks `availability_day_status` for today's date |
| Sort | `rating` (default), `reviews`, `response` (join date) |
| Pagination | 12 per page, offset-based |

### What each card shows

Display name · avatar · location · specialties (up to 3 chips) · starting rate · native avg rating · badge · available today indicator

### Badge computation on browse

For each page of results, fetches: portfolio photo counts, GBP OAuth connection status, GBP review count, platform review count, completed bookings — computes badge for each photographer. Also computes `getMostReviewedIds` and `getMostBookedIds` across the page for cross-marketplace ranking badges.

### Portfolio reel (`/api/portfolio-reel`)

Separate API used on the homepage and browse page. Returns paginated reel items — one card per standalone photo, one swipeable card per album. Items shuffled by seeded random across all photographers. Supports `specialty` and `tag` filters.

---

## 5. Photographer Profile (Public)

**Page:** `/photographers/[username]`  
**API:** `GET /api/photographer/[username]`  
**Preview (own profile):** `/photographers/your-profile` → `GET /api/photographer/preview`

### What's shown

| Section | Detail |
|---|---|
| Header | Cover photo, avatar, display name, location, years experience, badge, specialties, rate |
| Trust score | Score (75–100) with breakdown bar if GBP connected |
| Portfolio | Masonry grid — standalone photos, standalone videos, album tiles. Albums drill down inline. Lightbox with keyboard nav, tags, shoot date. |
| Packages | Up to 3 packages with name, description, pricing, deliverables, banner image, specialty tag |
| Availability | Read-only 90-day calendar showing available/unavailable/tentative days |
| Reviews | Up to 10 most recent. Star rating + sub-ratings (communication, quality, value, punctuality). Photographer reply + client counter-reply. |
| FAQs | Accordion — up to 5 published Q&As |
| External links | Website, Instagram, Facebook |
| Booking CTA | `booking-request-modal.tsx` — opens booking flow inline |
| Contact CTA | `contact-modal.tsx` — starts a conversation (requires client login, `message-gate.tsx` for guests) |
| Save button | `save-button.tsx` — saves to client's saved photographers |

---

## 6. Photographer Dashboard

**Page:** `/dashboard/photographer`  
**Tabs:** Overview · Portfolio · Messages · Booking Requests · Availability · Packages · Reviews · Network · FAQ · Trust Score · Settings

### Overview tab

- Badge card with current badge + next tier to unlock
- Stats: messages count, avg rating, completed bookings
- Online presence at-a-glance (website, Instagram, Facebook — dashed if missing)
- Profile completion ring (10 items, weighted to 100%)
- Badge progress card — visual ladder with "what's needed" list and CTA

**Completion scoring (10 items):**

| Item | Weight |
|---|---|
| Display name | 10% |
| Bio (≥20 chars) | 10% |
| Location | 5% |
| Rate | 5% |
| Profile photo | 10% |
| Specialties | 10% |
| Portfolio photos | 15% |
| Availability set | 10% |
| At least 1 FAQ | 5% |
| Trust score connected | 20% |

### Portfolio tab

| Feature | Detail |
|---|---|
| Albums | Create (max 3), rename, delete, reorder |
| Photos | Upload to album or standalone. Max 50 total, 5MB each, JPEG/PNG/WebP |
| Videos | Upload to album or standalone. Max 3 total, 100MB each |
| Photo metadata | Caption (255 chars), tags (multi-select from 16 options), shoot month + year |
| Video metadata | Title (120 chars), tags, filmed month + year |
| Drag reorder | Photos draggable within album or standalone section |
| Cover photo | First photo in album auto-sets as cover |
| Storage | Cloudflare R2 via presigned upload. `storage_assets` table tracks all uploads with orphan TTL. |

### Booking Requests tab

- Calendar overview showing all bookings by date (colour-coded by status)
- Request list filterable by status: Pending / Approved / Declined / Cancelled / Cancellation requested / Completed
- Approve / Decline actions with optional photographer note
- Accept cancellation (from client's cancellation request)
- Each action triggers email + in-app notification to client

**Booking statuses:** `pending` → `approved` / `declined` / `cancelled` · `approved` → `cancellation_pending` → `cancelled` / `completed`

### Availability tab

- Weekly schedule builder — set recurring time slots per day (Mon–Fri)
- Day-level overrides — mark specific dates as available/unavailable/tentative
- 90-day window used on public profile calendar

### Packages tab

- Create / edit / delete up to 3 packages
- Fields: name, description, pricing, billing type (hourly / half-day / full-day), deliverables list, banner image upload, specialty tag, "Popular" flag
- Packages shown publicly on profile with pricing cards

### Reviews tab

- Paginated list of all reviews received
- Sub-ratings visible: communication, quality, value, punctuality
- Write public reply to each review
- Flag reviews for admin moderation

### Network tab

- Photographer connections — send / accept / decline connection requests, block
- Direct messages between photographers
- Group chats — create (max 2 owned), invite members, group messaging with file attachments
- Cover requests — request another photographer to cover a shoot, with datetime and message

### FAQ tab

- Create / edit / delete up to 5 FAQs
- Drag-reorder
- Published FAQs appear as accordion on public profile

### Trust Score tab

- Current trust score display (75–100 scale, or 0 if GBP not connected)
- Score breakdown: reviews pillar, age pillar, verification pillar
- Connect Google Business Profile via OAuth
- Manual sync button
- Sync history log

### Settings tab

| Section | Fields |
|---|---|
| Basic details | Display name, bio, Edmonton area, starting rate, years of experience |
| Profile photo | Upload / change / remove (max 3MB) |
| Cover photo | Upload / change / remove (max 8MB) |
| Specialties | Up to 5, multi-select |
| Links | Website URL, Instagram handle, Facebook page username |
| Account | Email address change |
| Danger zone | Delete account (requires typing "DELETE") |

**Nav:** Avatar dropdown — Settings (jumps to Settings tab) · Sign out. Bell icon opens notification centre.

---

## 7. Client Dashboard

**Page:** `/dashboard/client`  
**Edit page:** `/dashboard/client/edit`

### Features

| Feature | Detail |
|---|---|
| Bookings | Full list with status badges. Cancel pending bookings. Request cancellation of approved bookings with reason. |
| Pending reviews | Completed sessions with no review show a review prompt inline |
| Review submission | Star rating + sub-ratings + written review. One review per completed booking. |
| Review reply | Client can post a counter-reply to a photographer's public review response |
| Conversations | Inbox list with unread counts. Click to open thread. |
| Saved photographers | Save/unsave from browse or public profile. Displayed in sidebar. |
| Notifications | Bell → dropdown. Grouped Today / Earlier. Auto-mark-read on open. Per-item dismiss. |
| Profile editing | Name, bio, location, interests via `/dashboard/client/edit` |

**Nav:** Avatar dropdown — Settings (goes to edit page) · Sign out. Bell icon opens notification centre.

---

## 8. Messaging

**Client pages:** `/messages` (inbox) · `/messages/[slug]` (conversation thread)  
**Photographer page:** `/messages/photographer`

### Client ↔ Photographer messaging

| Feature | Detail |
|---|---|
| Conversation creation | Auto-created when client submits a booking request or contacts a photographer |
| Message threading | Real-time polling. Read receipts. |
| File attachments | Images, videos, PDFs. Uploaded to R2. Displayed as attachment bubbles. |
| Rate limiting | Max 20 messages/hour per client (per conversation). Warning at 3 remaining. |
| Spam reporting | Clients can report a conversation with a reason. 3 unique reports → auto-suspend flag. |
| Block | Photographers can block clients from within a conversation |
| Message gate | Unauthenticated visitors on photographer profile see a sign-up prompt instead of message form |

### Photographer ↔ Photographer DMs

- Direct messages between connected photographers
- File attachments supported
- Separate from client messaging UI (inside Network tab)

---

## 9. Bookings

**Client API:** `POST /api/client/bookings` · `GET /api/client/bookings` · `POST /api/client/bookings/[id]/cancel`  
**Photographer API:** `GET /api/photographer/bookings` · `PATCH /api/photographer/bookings`

### Booking request fields

Occasion (session type) · Description / notes · Billing type (hourly / package) · Billing detail · Requested date · Time slot · Location note

### Status flow

```
pending → approved → completed
        ↓           ↘ cancellation_pending → cancelled
        declined
        cancelled (by client before approval)
```

### Email triggers (all bookings)

| Event | Email sent to |
|---|---|
| Client submits booking | Photographer: `booking_received` |
| Photographer approves | Client: `booking_confirmed` |
| Photographer declines | Client: `booking_declined` |
| Photographer marks completed | Client: `booking_completed` |
| Client cancels (any status) | Photographer: `booking_cancelled_by_client` |
| Photographer confirms cancellation | Client: `booking_cancellation_confirmed` |
| 1 day before session (cron) | Client: `booking_reminder_client` · Photographer: `booking_reminder_photographer` |

### Payments

Not yet built. Photographers and clients negotiate rate directly — no payment collection on the platform. Planned for Phase 2 (Stripe Connect).

---

## 10. Reviews

**Client API:** `POST /api/client/reviews` · `GET /api/client/reviews` · `POST /api/client/reviews/reply`  
**Photographer API:** `GET /api/photographer/reviews` · `PATCH /api/photographer/reviews` · `GET /api/photographer/reviews/client`

### Review structure

- Overall star rating (1–5)
- Sub-ratings: communication, quality, value, punctuality
- Written body (max 1500 chars)
- Photographer public reply (max 800 chars)
- Client counter-reply to photographer's response

### Constraints

- One review per completed booking (enforced by unique constraint)
- Only clients who completed the booking can review
- Reviews visible on public profile immediately
- `flag_status` enum: `none` → `flagged` → `removed` / `dismissed` (admin)

### Auto-sync

Migration 023 installs a DB trigger (`sync_photographer_review_stats`) — on every review insert/update/delete, `native_review_count` and `native_avg_rating` on `photographer_profiles` update automatically.

---

## 11. Trust Score & Badges

**Lib:** `lib/trust/` · `lib/badges.ts`  
**API:** `GET /api/photographer/trust` · `POST /api/admin/trust-sync`  
**Cron:** runs daily at 8AM UTC via `vercel.json`

### Trust Score (75–100)

Only computed when Google Business Profile is connected via OAuth. Score is 0 until then.

| Pillar | Signals |
|---|---|
| Reviews | GBP rating, GBP review count |
| Age | Account age in days |
| Verification | GBP verified status, profile completeness % |

Score range: **75–100** when GBP connected, **0** when not.

**Sync logic:** OAuth token refreshed if expiring within 5 minutes. Falls back to Google Places API (by display name) if OAuth not connected. Results persisted to `trust_signal_snapshots`, `trust_score_breakdown`, `external_platform_links`.

**Instagram/Facebook:** OAuth routes exist but sync engine explicitly excludes them — deferred until Meta app approval obtained.

### Badge System (4-tier, platform-verified)

Badges computed from verified DB signals — never self-reported. Computed on every profile API call and browse page load.

| Badge | Requirements |
|---|---|
| 🆕 Newly Joined | Default — no criteria met |
| 🌟 Rising Talent | ≥5 portfolio photos + ≥60% completeness + account ≥14 days old |
| 🔵 Verified Pro | GBP OAuth connected + ≥1 GBP review + ≥80% completeness |
| ✅ Trusted Pro | Verified Pro + ≥3 completed bookings + platform rating ≥4.0 |
| 🏆 Most Reviewed | Top 3 by native review count (min 3 reviews) — cross-marketplace rank |
| 📅 Most Booked | Top 3 by completed bookings (min 3) — cross-marketplace rank |

`computeBadgeProgress()` returns human-readable list of what's needed to reach the next tier — used in the dashboard Overview tab.

---

## 12. Photographer Network

**API:** `GET/POST/PATCH/DELETE /api/photographer/connections`  
`POST /api/photographer/connections/block`  
`GET/POST /api/photographer/connections/dm`  
`GET/POST/PATCH/DELETE /api/photographer/groups`  
`POST /api/photographer/groups/invites`  
`GET/POST /api/photographer/groups/messages`  
`GET/POST/PATCH/DELETE /api/photographer/cover-requests`

### Connections

- Send / accept / decline connection requests
- Block a photographer (removes connection, prevents future requests)
- Connected photographers appear in each other's network tab

### Direct Messages (photographer ↔ photographer)

- DMs only available between connected photographers
- File attachments supported (images, videos, PDFs via R2)
- `group_member_last_read_at` tracked for unread counts

### Group Chats

- Create groups (max 2 groups owned per photographer)
- Invite connected photographers
- Group messaging with file attachment support
- Message retention: 365 days

### Cover Requests

- Request another photographer to cover a shoot
- Includes: datetime, location, message
- Status flow: `pending` → `accepted` / `declined` / `withdrawn`
- Can be linked to a group

---

## 13. Notifications

**Photographer API:** `GET /api/photographer/notifications` · `PATCH /api/photographer/notifications` · `PATCH/DELETE /api/photographer/notifications/[id]`  
**Client API:** `GET /api/client/notifications` · `POST /api/client/notifications/read` · `DELETE /api/client/notifications/read?id=`  
**Component:** `components/notification-centre.tsx`

### Notification types

| Type | Recipient | Trigger |
|---|---|---|
| `welcome` | Both | On signup |
| `profile_approved` | Photographer | Admin approves profile |
| `booking_request` | Photographer | Client submits booking |
| `booking_approved` | Client | Photographer approves |
| `booking_declined` | Client | Photographer declines |
| `booking_cancelled` | Client | Booking cancelled |
| `booking_completed` | Client | Session marked complete |
| `new_message` | Photographer | Client starts conversation |
| `connection_request` | Photographer | Another photographer sends request |
| `connection_accepted` | Photographer | Request accepted |
| `group_invite` | Photographer | Invited to a group |
| `review_received` | Photographer | Client leaves review |
| `review_reply` | Client | Photographer replies to review |
| `trust_score_updated` | Photographer | Trust sync runs |

### Centre behaviour

- Bell badge shows unread count (capped at 99+)
- Bell bounces when new unread arrives (polling)
- Opens dropdown: Today / Earlier grouped sections
- Auto-marks all read 1.5 seconds after dropdown opens
- Per-item dismiss button (hover to reveal) — hard-deletes the notification
- Deep-links: each notification type routes to the relevant dashboard section
- Polling interval: 60 seconds
- Expires: notifications auto-expire (default 30 days, welcome 60 days)

---

## 14. Email System

**Lib:** `lib/email/client.ts` · `lib/email/templates.ts`  
**Queue table:** `email_queue`  
**Cron drainer:** `GET/POST /api/cron/email` (daily 8AM UTC)

### Architecture

```
API route → queueEmail() → email_queue table → cron drainer → sendEmail() → Resend API
```

**Exception:** Welcome emails bypass the queue and call `sendEmail()` directly (fallback to queue on failure).

### 19 templates

| Template | Recipient | Trigger |
|---|---|---|
| `welcome_client` | Client | Signup |
| `welcome_photographer` | Photographer | Signup |
| `booking_received` | Photographer | Client books |
| `booking_confirmed` | Client | Photographer approves |
| `booking_declined` | Client | Photographer declines |
| `booking_completed` | Client | Session completed |
| `booking_cancelled_by_client` | Photographer | Client cancels |
| `booking_cancellation_confirmed` | Client | Photographer confirms cancellation |
| `new_conversation` | Photographer | Client sends first message |
| `booking_reminder_client` | Client | Day before session (cron) |
| `booking_reminder_photographer` | Photographer | Day before session (cron) |
| `review_received` | Photographer | Client leaves review |
| `review_reply` | Client | Photographer replies |
| `photographer_approved` | Photographer | Admin approves profile |
| `photographer_rejected` | Photographer | Admin rejects profile |
| `photographer_suspended` | Photographer | Admin suspends account |
| `review_removed` | Photographer | Admin removes review |
| `review_dismissed` | Photographer | Admin dismisses review flag |
| `support_ticket_created` | Admin | Ticket submitted |
| `support_ticket_resolved` | Submitter | Admin resolves ticket |

### Current sender

`RESEND_FROM_EMAIL=onboarding@resend.dev` — Resend shared domain. Works but unbranded.  
**Once domain is verified:** change to `noreply@truenorthframes.ca` — one env var change.

### Deliverability features

- Plain-text version auto-generated from HTML (improves spam score)
- `replyTo: support@truenorthframes.ca` on all emails
- `X-Entity-Ref-ID` header marks as unique transactional email
- Max 3 retry attempts. Failed emails marked `failed` after 3 attempts.
- Batch size: 20 emails per cron run

---

## 15. Storage (Cloudflare R2)

**Lib:** `lib/r2.ts`  
**API:** `POST /api/storage/presign` · `DELETE /api/storage/delete`  
**Bucket:** `truenorth-frames`  
**Public URL:** `https://pub-cfa5cec7115b44fd80799055729b4709.r2.dev`

### What's stored

| Asset type | Path pattern | Max size |
|---|---|---|
| Portfolio photos | `portfolio_photos/{userId}/{uuid}.{ext}` | 5MB |
| Portfolio videos | `portfolio_videos/{userId}/{uuid}.{ext}` | 100MB |
| Avatars | `avatars/{userId}/{uuid}.{ext}` | 3MB |
| Cover images | `covers/{userId}/{uuid}.{ext}` | 8MB |
| Package banners | `packages/{userId}/{uuid}.{ext}` | 5MB |
| Message attachments | `attachments/{userId}/{uuid}.{ext}` | 10MB |

### Orphan protection

Every upload registers a `storage_assets` row with `orphan_expires_at = now() + 1 hour`. Once the corresponding entity row (photo, video, etc.) is created, the TTL is cleared. A cron can purge unclaimed assets.

---

## 16. Admin Portal

**Pages:** `/admin` · `/admin/accounts` · `/admin/analytics` · `/admin/conversations` · `/admin/support` · `/admin/trust-health`  
**Login:** `/admin/login` — separate from user auth, admin role required

### Stats dashboard (`/admin`)

Live counts: total clients, photographers, pending approvals, total bookings, completed bookings, total messages, conversations, reviews, saves. Week-over-week deltas. Specialty distribution chart. Area/neighbourhood breakdown.

### Accounts (`/admin/accounts`)

| Action | Result |
|---|---|
| Approve photographer | `profile_status → approved`. Email + in-app notification sent. |
| Reject photographer | `profile_status → rejected`. All sessions force-signed out. Email with optional reason sent. |
| Suspend account | `account_status → suspended`. Email sent. |
| Unsuspend | `account_status → active`. |
| Filter | By role (client/photographer) and status. Text search by name/email. |

### Analytics (`/admin/analytics`)

Full platform analytics: client/photographer growth, message volume, booking volume, week-over-week deltas, specialty distribution, top photographers by conversation count, top clients by message count, profile completeness breakdown, area metrics. Phase 2 target progress bars.

### Conversations (`/admin/conversations`)

Browse all client↔photographer conversations. Read messages within any conversation. Moderation view.

### Support (`/admin/support`)

Support ticket browser. Resolve tickets with resolution note — triggers email to submitter. Review flag management (remove or dismiss flagged reviews) — both trigger emails to the photographer.

### Trust Health (`/admin/trust-health`)

- Sync status per photographer (last sync, score before/after, errors)
- Manual trust sync trigger for all photographers

---

## 17. Background Jobs (Cron)

**Config:** `vercel.json`

| Job | Schedule | What it does |
|---|---|---|
| Email queue drainer | 8AM UTC daily | Processes `email_queue` table in batches of 20. Max 3 attempts per email. |
| Booking reminder | 3PM UTC daily (8–9AM MT) | Finds all approved bookings with `requested_date = tomorrow`. Queues reminder emails to both client and photographer. |

Both endpoints secured by `CRON_SECRET` header — Vercel sends `Authorization: Bearer <secret>` automatically.

---

## 18. Platform Configuration

**Lib:** `lib/platform-config.ts`  
**Table:** `platform_config` (overrides static values at runtime)

Key limits enforced across the platform:

| Config key | Value |
|---|---|
| Max bio length (photographer) | 1200 chars |
| Max message length | 1000 chars |
| Max messages per hour | 20 (client→photographer) |
| Max FAQs per photographer | 5 |
| Max albums | 3 |
| Max photos total | 50 |
| Max videos total | 3 |
| Max packages | 3 |
| Max owned groups | 2 |
| Booking window | 90 days |
| Login max failed attempts | 10 (15 min lockout) |
| Trust sync stale after | 8 days |
| Notification retention | 90 days |

---

## 19. Database Schema

**30 migrations applied** (`supabase/migrations/001` → `030`)

### Core tables

| Table | Purpose |
|---|---|
| `users` | All accounts — both clients and photographers |
| `client_profiles` | Client bio, location, preferred style |
| `photographer_profiles` | Full photographer profile — all fields including self-reported presence, completeness score, trust score |
| `photographer_specialties` | Up to 5 per photographer |
| `photographer_profile_views` | Deduped daily view tracking |

### Portfolio

| Table | Purpose |
|---|---|
| `portfolio_albums` | Up to 3 albums per photographer |
| `portfolio_photos` | Photos — album-assigned or standalone. Tags, shoot month/year (migration 026). |
| `portfolio_videos` | Videos — album-assigned or standalone. Tags, filmed month/year (migration 029). |
| `storage_assets` | All R2 uploads with orphan TTL tracking |

### Bookings & Reviews

| Table | Purpose |
|---|---|
| `booking_requests` | Full booking lifecycle |
| `packages` | Photographer service packages |
| `reviews` | Reviews with sub-ratings and reply chain |

### Messaging

| Table | Purpose |
|---|---|
| `conversations` | Client ↔ photographer conversation threads |
| `messages` | Individual messages with attachment support |
| `message_attachments` | File metadata for attached files |

### Photographer Network

| Table | Purpose |
|---|---|
| `photographer_contacts` | Connection requests (migration 017) |
| `dm_groups` | Photographer group chats (migration 018) |
| `group_members` | Group membership with last-read tracking |
| `group_messages` | Group chat messages |
| `photographer_blocks` | Block relationships (migration 019) |
| `cover_requests` | Cover-a-shoot requests |

### Trust

| Table | Purpose |
|---|---|
| `external_platform_links` | Google/Instagram/Facebook profile links + metrics |
| `platform_oauth_tokens` | OAuth access/refresh tokens per platform |
| `trust_signal_snapshots` | Historical trust signal snapshots |
| `trust_score_breakdown` | Current score pillars per photographer |
| `trust_sync_log` | Every sync attempt with result |

### Platform

| Table | Purpose |
|---|---|
| `notifications` | In-app notifications with expiry |
| `email_queue` | Outbound email queue |
| `support_tickets` | User support requests |
| `platform_config` | Runtime configuration overrides |
| `feature_flags` | Feature toggle flags |
| `saved_photographers` | Client's saved photographer list |
| `client_interests` | Client photography interest tags |

---

## 20. Pending / Not Yet Built

| Feature | Priority | Notes |
|---|---|---|
| Gmail OAuth login | Near-launch | Supabase provider ready to enable. Google credentials already configured. |
| Domain verification (Resend) | As soon as domain purchased | One env var change: `RESEND_FROM_EMAIL=noreply@truenorthframes.ca` |
| Stripe Connect (payments) | Phase 2 | 5% booking commission + $9/mo featured boosts |
| Instagram / Facebook trust signals | Phase 2 | OAuth routes exist. Needs Meta app approval for production use. |
| Yelp trust signal | Phase 2 | No fetcher implemented. Yelp requires business verification. |
| `booking_cancellation_requests` migration | Soon | Table referenced in cancel route but no migration written yet. Wrapped in try/catch so silent — needs proper migration. |
| Profile tag/date filtering on browse | Phase 2 | Migration 026 added indexes. Browse API doesn't expose tag filter yet. |
| Stripe billing portal | Phase 2 | For Pro/Studio subscription tiers |
| Calgary / Vancouver expansion | Phase 3 | Edmonton-only currently. Location filter would need loosening. |
| Admin: manual email trigger UI | Nice to have | Currently requires `curl` to trigger cron manually |

---

*Generated from codebase scan — June 2026*

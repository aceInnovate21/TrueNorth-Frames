# TrueNorth Frames — Phase 1 Handover & Technical Reference

**Date:** 2026-07-13
**Status:** Phase 1 complete — pre-launch / soft-launch ready
**Purpose:** Complete reference for developers taking over Phase 2 and enhancements
**Audience:** Future engineering team

---

## 1. What This Product Is

TrueNorth Frames is a **two-sided photographer marketplace for Edmonton**. Clients discover, compare, and book local photographers; photographers build profiles, showcase portfolios, manage bookings, and build trust through verified signals. An admin layer moderates the marketplace.

Three user roles: **client**, **photographer**, **admin**. One person = one role (enforced at signup).

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 14** (App Router) | Server components + route handlers |
| Language | **TypeScript 5.8** | Strict |
| UI | **Tailwind CSS 3.4** | Custom `ink` neutral palette; no component library |
| Icons | **lucide-react** | |
| Auth + DB | **Supabase** | Postgres + Auth (email/password + Google OAuth) + RLS |
| File storage | **Cloudflare R2** | S3-compatible; AWS SDK v3; direct browser→R2 presigned uploads |
| Email | **Resend** | Direct send + queued (cron-drained) |
| Hosting | **Vercel** | Hobby tier — cron limited to daily |
| Data fetching | **@tanstack/react-query** | Client-side caching |

**Key env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PRIVATE_BUCKET_NAME`, `R2_PUBLIC_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL`.

---

## 3. Architecture — The Two Golden Rules

**These two conventions govern the entire backend. Understand them before touching any route.**

### Rule 1: All data access goes through `/api` route handlers using the service-role key.

`lib/api-helpers.ts` → `getServerSession()` returns:
- `user` — the authenticated user (from the anon-key cookie session), or `null`
- `adminDb` — a **service-role** Supabase client that **bypasses RLS**

Because `adminDb` bypasses RLS, **every route manually enforces ownership** by scoping queries: `.eq('client_id', user.id)`, `.eq('photographer_id', profile.id)`, etc. This is done consistently across all 74 routes. **When you add a route, you MUST scope every query to the authenticated user — RLS will not save you here.**

### Rule 2: File uploads never touch a serverless function body.

Vercel has a 4.5 MB body limit. So the upload flow is **direct browser → R2**:
1. Browser compresses images to WebP (`lib/client-compress.ts`) — Canvas-based, zero server cost
2. Browser calls `/api/storage/presign` → gets a short-lived (15 min) presigned PUT URL. The R2 key is **server-derived from `user.id`** (no client-controlled paths).
3. Browser PUTs the file directly to R2
4. Browser calls `/api/.../register` → creates the DB row and "claims" the storage asset
5. Unclaimed assets are "orphans" (1-hour TTL) — a cron purges them

Images are compressed client-side to WebP. **Videos are stored raw (no transcode)** — see §12 caveats.

---

## 4. Data Model (49 tables)

Schema lives in `supabase/migrations/` (33 sequential migrations, `001`–`033`). Types in `lib/database.types.ts`.

### Core identity
- **`users`** — one row per account. `role` (client/photographer/admin), `account_status` (active/suspended/banned/deactivated), `full_name`, `avatar_url`, `email`, `is_verified`. Mirrors `auth.users` (linked by id; auto-created via trigger in migration `031`).
- **`client_profiles`** — client-specific: neighbourhood/location, interests.
- **`photographer_profiles`** — the big one. `username` (unique slug), `display_name`, `bio`, `tagline`, `location`, `rate_display`, `profile_status` (draft/pending/approved/suspended/banned), `trust_score`, `native_avg_rating`, `native_review_count`, `completeness_score`, `profile_view_count`, `avatar_url`, `cover_image_url`, social links, `years_experience`.

### Portfolio
- **`portfolio_albums`** — max 3/photographer. `is_published`.
- **`portfolio_photos`** — max 150/photographer. `album_id` (null = standalone), `caption`, `tags`, `photo_taken_month/year`, `storage_asset_id`, `sort_order`.
- **`portfolio_videos`** — max 3/photographer, 2/album. `title`, `duration_seconds`, `storage_asset_id`.

### Offerings & availability
- **`packages`** — max 3/photographer. `name`, `description`, `price`, `billing_type` (hourly/package), `deliverables[]`, `is_popular`, `is_active`, `banner_url`, `specialty`.
- **`photographer_specialties`** — up to 5 tags/photographer.
- **`photographer_faqs`** — max 5/photographer. `is_published`.
- **`weekly_time_slots`** — recurring weekly availability (day_of_week).
- **`availability_day_status`** — per-date overrides (available/tentative/busy). Override always wins over weekly pattern.

### Bookings & reviews
- **`booking_requests`** — the transaction. `status` (see lifecycle §6), `occasion`, `requested_date`, `requested_end_date` (multi-day), `time_slot`, `location_note`, `package_id`, `photographer_note`, `cancellation_reason`, `completed_at`.
- **`booking_cancellation_requests`** — when a client cancels an *approved* booking, this logs the request pending photographer resolution.
- **`reviews`** — one per completed booking. `rating` (1–5), `body`, four sub-ratings (communication/quality/value/punctuality), `public_reply` (photographer), `client_reply` (one-time client rebuttal), `flag_status` (none/flagged/flag_resolved), `private_note`.

### Messaging & network
- **`conversations`** — one per (client, photographer) pair. `is_frozen`, `is_flagged`, `last_message_at`.
- **`messages`** — `body`, `sender_type`, `attachment_key` (private R2), `attachment_type/name/size`.
- **`client_blocks`** — client blocks a photographer (one-directional).
- **`photographer_connections`** — photographer↔photographer (pending/accepted/declined/blocked).
- **`photographer_blocks`** — photographer blocks another photographer.
- **`connection_groups`** — photographer-created groups. Max 2 *owned*/photographer (joining is unlimited).
- **`group_members`**, **`group_invites`**, **`group_messages`** — group chat. `left_at`/`removed_at` for soft-departure with history.
- **`cover_requests`** — a photographer asks their network to cover a gig.
- **`saved_photographers`** — client bookmarks.

### Trust & external
- **`external_platform_links`** — GBP/Instagram/Facebook/Yelp links with rating, review_count, follower_count, etc.
- **`platform_oauth_tokens`** — OAuth tokens for connected platforms (currently Google Business Profile).
- **`trust_sync_log`**, **`trust_signal_snapshots`**, **`trust_score_breakdown`** — trust scoring audit trail.

### Ops
- **`notifications`** — in-app. 90-day retention. Type enum (booking_request, review_reply, etc.).
- **`notification_preferences`** — per-user toggles.
- **`support_tickets`** — from support widget + auto-created on review flags/spam reports.
- **`admin_audit_log`** — admin actions.
- **`email_queue`** — queued emails (cron-drained), status (queued/sent/failed).
- **`storage_assets`** — the R2 quota ledger. `owner_id`, `key`, `size_bytes`, `entity_type`, `orphan_expires_at` (null = claimed/counted).
- **`photographer_profile_views`** — view tracking (365-day retention).
- **`message_rate_limits`**, **`group_message_rate_limits`** — ⚠️ **exist but currently unused** (see §12).
- **`platform_config`** — live-tunable business rules; mirrored statically in `lib/platform-config.ts`.

---

## 5. Feature Inventory (by role)

### Client
| Feature | Where | Notes |
|---------|-------|-------|
| Sign up / login | `/signup`, `/login` | Email+password or Google OAuth |
| Onboarding | `/onboarding` | Name + Edmonton neighbourhood |
| Browse photographers | `/photographers` | Filter by specialty, rating, search; 20/page |
| Compare | `/compare` | Side-by-side (max 2) |
| View profile | `/photographers/[username]` | Portfolio, packages, reviews, availability, FAQ, trust |
| Save photographers | — | Bookmark |
| Request booking | ContactModal | Date/range, time slot, package, message |
| Messaging | `/messages` | With attachments |
| Leave review | Dashboard | 2-step: rating + sub-ratings, then note. One per booking |
| Reply to photographer | — | One-time rebuttal to photographer's reply |
| Cancel booking | — | Pending = immediate; approved = request pending photographer |
| Block photographer | — | One-directional |
| Report spam | — | Creates support ticket; 3 unique reports auto-suspends photographer |
| Support widget | Dashboard | Categorized ticket |
| Delete account | — | Type "DELETE"; deactivates + bans photographer profile if applicable |

### Photographer
| Feature | Where | Notes |
|---------|-------|-------|
| Onboarding | `/onboarding/photographer` | 3-step: basics, specialties, online presence → `profile_status='pending'` |
| Dashboard tabs | `/dashboard/photographer` | Portfolio, Bookings, Packages, Availability, Reviews, FAQ, Settings, Trust, Network |
| Portfolio | — | Albums (3), photos (150), videos (3); WebP compression |
| Booking management | — | Approve/decline/complete/cancel; add note |
| Packages | — | Max 3; banner image; popular/active toggles |
| Availability | — | Weekly recurring + per-date overrides |
| Reviews | — | Reply, private note, flag for admin |
| FAQ | — | Max 5 |
| Settings | — | Edit basics, specialties, avatar, cover, social links |
| Trust | — | Connect Google Business Profile (OAuth); manual sync |
| Network | — | Connect with photographers, groups, group chat, cover requests |
| Messaging | `/messages/photographer` | With clients |

### Admin
| Feature | Where | Notes |
|---------|-------|-------|
| Dashboard | `/admin` | Platform stats |
| Accounts | `/admin/accounts` | Approve/reject photographers, suspend/unsuspend |
| Support tickets | `/admin/support` | Resolve/close with note |
| Review moderation | — | Remove flagged review / dismiss flag |
| Conversations | `/admin/conversations` | Monitor flagged conversations |
| Trust health | `/admin/trust-health` | Platform trust overview; trigger syncs |
| Analytics | `/admin/analytics` | Growth metrics |

---

## 6. Business Rules & Lifecycles

### Booking status lifecycle
```
pending ──approve──> approved ──complete──> completed ──> (review enabled)
   │                     │
 decline              cancel/client-cancel-request
   │                     │
 declined         cancellation_pending ──resolve──> cancelled
```
- Client cancels **pending** → immediate `cancelled`
- Client cancels **approved** → `cancellation_pending` + logs `booking_cancellation_requests`; photographer resolves
- Only `completed` bookings can be reviewed; one review per booking

### Photographer approval
`draft` → (onboarding) → `pending` → admin approves → `approved` (now visible in browse & bookable) OR admin rejects → `rejected` (sessions revoked, force sign-out). Only `approved` photographers appear in browse and can receive bookings (422 otherwise).

### Trust Score (proprietary algorithm — `lib/trust/`)
- **0** if no Google Business Profile connected. Trust card hidden on public profile.
- **75–100** when GBP connected. Base **75** + up to **25** bonus:
  - **Reviews pillar** (+12.5 max): GBP rating (55%) + review count (45%)
  - **Age pillar** (+3.0 max): GBP account age
  - **Verification pillar** (+9.5 max): profile completeness (+4.5) + GBP verified badge (+5.0)
- Display colours: ≥90 green, 75–89 blue.
- Synced on demand + when stale (>8 days). Full breakdown stored in `trust_score_breakdown`.

### Badge system (`lib/badges.ts`) — exactly ONE badge shown, priority ladder:
```
most_reviewed > most_booked > trusted_pro > verified_pro > rising_talent > newly_joined
```
- **Trusted Pro**: 3+ completed bookings + native rating ≥4.0 + GBP connected + profile ≥80%
- **Verified Pro**: GBP connected + ≥1 verified review + profile ≥80%
- **Rising Talent**: 5+ photos + profile ≥60% + account ≥14 days
- **Most Reviewed / Most Booked**: cross-marketplace top-N rank (set by list endpoints)
- **Newly Joined**: default
- Badges are computed from **verified signals only — never self-reported.**

### Rating sync
`native_avg_rating` / `native_review_count` on `photographer_profiles` are recalculated on review submit and on admin remove/dismiss, counting only `flag_status IN ('none','flagged')`. (There is also a DB trigger from migration `023`; the app-layer sync is the authoritative path used today.)

### Full config
All limits (message caps, portfolio limits, storage quota, lockouts, etc.) live in `lib/platform-config.ts` and the `platform_config` DB table. See that file for the complete list — it is the single source of truth for business constants.

---

## 7. Storage & Quota Model

- **Per-photographer quota: 500 MB** (post-compression). Enforced at presign + re-checked at register.
- `storage_assets` is the ledger. An asset counts toward quota when `orphan_expires_at IS NULL` (claimed).
- **Two R2 buckets:** public (portfolio, avatars, covers, package banners — served via `R2_PUBLIC_URL`) and private (message attachments — served via 6-hour signed download URLs).
- **Orphan cleanup:** assets never claimed within 1 hour are purged by `/api/cron/orphan-assets`.
- R2 CORS must have `AllowedHeaders: ["*"]`; the S3 client uses `requestChecksumCalculation: 'WHEN_REQUIRED'` to keep presigned URLs browser-compatible (see `lib/r2.ts`).

---

## 8. Email System

- **23 templates** in `lib/email/templates.ts` (welcome, all booking states, reviews, support, moderation).
- **Two send paths:** `sendEmailDirect()` (immediate) and `queueEmail()` (→ `email_queue`, drained by cron).
- All sends are **fire-and-forget** — a failed email never breaks the triggering action (booking still succeeds).
- User input in templates is HTML-escaped (XSS-safe).

---

## 9. Cron Jobs (`vercel.json`)

Vercel Hobby allows **daily only**. Current schedule:
| Job | Schedule (UTC) | Purpose |
|-----|---------------|---------|
| `/api/cron/email` | 14:00 daily | Drain `email_queue` |
| `/api/cron/booking-reminder` | 15:00 daily | Remind client + photographer 1 day before session |
| `/api/cron/orphan-assets` | 16:00 daily | Purge unclaimed R2 assets |

All protected by `CRON_SECRET` (Bearer or `x-cron-secret` header).
**Phase 2 note:** to run more frequently (e.g. email every 30 min), use an external scheduler (cron-job.org) or upgrade Vercel.

---

## 10. Auth & Security Model

- **Middleware** (`middleware.ts`) handles role-based routing, suspended/rejected force-sign-out, and limbo-state (authenticated but no `public.users` row) passthrough.
- **Admin routes** all verify `role === 'admin'`.
- **IDOR protection:** every by-id route scopes to the authenticated user.
- **Login lockout:** 10 failed attempts → 15-min lockout.
- **Secrets:** service-role key is server-only; `.env` gitignored. Only `NEXT_PUBLIC_*` values ship to the browser.

⚠️ See `PLATFORM_AUDIT_REPORT.md` for the full security audit and known gaps.

---

## 11. Repository Map

```
app/
  (auth)/          login, signup, forgot/reset password
  api/             74 route handlers (the entire backend)
  admin/           admin pages
  dashboard/       client + photographer dashboards
  photographers/   browse + public profile ([username])
  messages/        messaging UI
  onboarding/      client + photographer onboarding
components/        shared UI (contact-modal, review-manager, portfolio, etc.)
lib/
  api-helpers.ts   getServerSession() — the auth entry point
  platform-config.ts  ALL business constants
  badges.ts        badge algorithm
  trust/           trust scoring engine + OAuth fetchers
  email/           templates + send
  r2.ts            R2 client + presign helpers
  storage-quota.ts quota enforcement
  messaging.ts     conversation/attachment helpers
  notify.ts        in-app notification helper (fire-and-forget)
supabase/
  migrations/      33 sequential SQL migrations (source of truth for schema)
  seed.sql         platform_config seed
  wipe_test_data.sql  test-data reset (preserves admins)
```

---

## 12. Known Caveats & Phase 2 Backlog

### Must-fix (from audit — see `PLATFORM_AUDIT_REPORT.md`)
- 🔴 **Message rate limiting unenforced** — `message_rate_limits` tables exist but no route uses them. 1-on-1 messages also have no body-length cap. Spam/harassment vector.
- 🔴 **`/api/auth/register` trusts client-supplied `user_id`** — should always verify the access token.
- 🟡 Contact form has no rate limiting (Resend quota abuse).
- 🟡 OAuth flows lack CSRF `state` param.
- 🟡 Empty `CRON_SECRET` would bypass cron auth — add a falsy guard.

### Product / infra backlog
- **Video transcoding** — `.mov` files play on iOS but NOT Android Chrome (unsupported codec). Videos are stored raw. Recommended Phase 2: **Cloudflare Stream** (natural fit with R2) for adaptive MP4/HLS, or restrict uploads to MP4.
- **RLS** — currently effectively bypassed (service-role architecture). Recommend enabling RLS as defense-in-depth, especially since the browser reads `users` and `photographer_profiles` directly with the anon key. Needs careful policy design (see audit).
- **Profile view count** — column exists and displays but is not incremented.
- **Email frequency** — bounded by Vercel Hobby daily cron; needs external scheduler for near-real-time queue draining.
- **Supabase SMTP** — configure with Resend for auth (verification/reset) emails.
- **Yelp / Instagram / Facebook trust** — enum + fetcher scaffolding exists; only Google Business Profile is wired end-to-end.

### Enhancement ideas (not started)
- Payments / deposits (currently booking is inquiry-only, no money changes hands on-platform)
- Calendar sync (Google Calendar) for availability
- Search relevance ranking / geo-radius
- Photographer analytics dashboard
- Mobile app (currently responsive web only)

---

## 13. Operational Runbooks

- **Reset test data:** run `supabase/wipe_test_data.sql` in Supabase SQL editor (preserves admin accounts).
- **Backfill ratings:** if `native_avg_rating` is stale, run the backfill UPDATE (see git history / audit report).
- **Add a business rule:** edit `lib/platform-config.ts` AND the `platform_config` table row (keep them in sync).
- **Add a migration:** create `supabase/migrations/034_*.sql`, apply in Supabase, regenerate `lib/database.types.ts`.

---

*This document reflects the state of the codebase as of 2026-07-13. For the security-specific deep dive, see `PLATFORM_AUDIT_REPORT.md`. For UAT coverage, see `UAT_TESTING_PLAN.md`.*

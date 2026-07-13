# TrueNorth Frames — Full Platform Audit

**Date:** 2026-07-13
**Scope:** All 74 API routes, middleware, lib layer, auth, storage, messaging, security
**Auditor:** Pre-launch review
**Method:** Module-by-module code read — wiring, ownership enforcement, security

---

## Executive Summary

The platform is **well-architected overall**. The upload pipeline, IDOR protection, admin authorization, and secrets hygiene are genuinely strong — better than most pre-launch codebases. The main gaps are **abuse-prevention controls that are configured but never enforced** (message rate limits) and a few **medium-severity auth hardening items**.

**Verdict:** Safe to launch with a small trusted photographer group. Fix the 🔴 CRITICAL items first; the 🟡 MEDIUM items should be closed before opening public signup.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟡 Medium | 5 |
| 🟢 Low / No-care | 4 |

---

## 🔴 CRITICAL

### C1. Message rate limiting is completely unenforced — ✅ FIXED (2026-07-13)

**Resolution:** Added `checkMessageRateLimit()` + `clampMessageBody()` to `lib/messaging.ts`. Both 1-on-1 send routes now enforce the 20/hr cap (429 on exceed) and clamp body to `max_message_length` (1000). Rate is counted directly from the `messages` table in a rolling 1-hour window per sender. *(Group message hourly rate still pending — group already caps length.)*

---

### C1 (original). Message rate limiting is completely unenforced

**Where:** `app/api/client/messages/[id]/route.ts`, `app/api/photographer/messages/[id]/route.ts`, `app/api/photographer/groups/messages/route.ts`

The `message_rate_limits` and `group_message_rate_limits` tables exist, and `platform-config.ts` defines the limits (20/hr client, 30/hr group), but **no route reads or writes these tables.** Messages are inserted directly with no throttle.

**Impact:** A single client can send unlimited messages to a photographer — a harassment/spam vector with no brake. The UAT plan claims these limits exist (§8.5, §8.6, §5.10.16); they do not.

**Also:** 1-on-1 message body has **no length cap**. A client can post a multi-megabyte message body (DB bloat, UI break). *(Group messages DO cap length via `slice(0, max_message_length)` — only 1-on-1 is uncapped.)*

**Fix:** Add a rate-limit check + body-length cap at the top of both 1-on-1 send handlers. A simple windowed count against `messages` (created_at > now - 1hr, sender_id = user) is enough; or wire the existing `message_rate_limits` table. Cap body with `.slice(0, PLATFORM_CONFIG.max_message_length)`.

---

### C2. `/api/auth/register` trusts a client-supplied `user_id` — ✅ FIXED (2026-07-13)

**Resolution:** The route now requires `access_token` and derives both user id and email **only** from the verified token — the body's `user_id`/`email` are no longer trusted for identity. All three callers (email signup, Google role-select, login auto-create) updated to send the token. An unauthenticated caller with a fake `user_id` is now rejected with 401.

---

### C2 (original). `/api/auth/register` trusts a client-supplied `user_id`

**Where:** `app/api/auth/register/route.ts:21`

The route accepts `user_id` directly from the request body and, if present, **skips access-token verification** entirely. It then inserts a `public.users` row for that id with a body-supplied `email`.

```ts
let resolvedUserId = user_id as string | undefined   // trusted as-is
if (access_token && !resolvedUserId) { /* only verified in this branch */ }
```

**Impact:** An attacker can create/claim a `public.users` row for an arbitrary auth id with an arbitrary email. **Mitigating factor:** `role` is constrained to `photographer|client` (line 12), so privilege escalation to `admin` is not possible. Impact is limited to creating malformed/mismatched user records, but it undermines the integrity of the users table.

**Fix:** Always require and verify `access_token`; derive both `user_id` and `email` from the verified token. Never trust body `user_id`/`email`. Drop the raw `user_id` branch.

---

## 🟡 MEDIUM

### M1. Public contact form has no rate limiting

**Where:** `app/api/contact/route.ts`

Fully public, unauthenticated, sends a Resend email on every POST. No throttle, no captcha.

**Impact:** An attacker can loop this endpoint to exhaust your Resend send quota and flood the support inbox. XSS is correctly escaped (good), but volume abuse is open.

**Fix:** Add IP-based rate limiting (e.g. 3/hour/IP) or a lightweight captcha/honeypot. At minimum, cap by IP in a short window.

---

### M2. OAuth flows have no CSRF `state` parameter

**Where:** `app/api/oauth/google/route.ts` (and `facebook`, `instagram`)

The Google trust-connect flow builds the auth URL with no `state` param and does not validate one on callback.

**Impact:** A logged-in photographer could be tricked (crafted link) into connecting an **attacker-controlled** Google Business account to their profile — polluting their trust signals. Not account takeover; scoped to trust-data integrity.

**Fix:** Generate a random `state`, store it in a signed cookie before redirect, verify it on callback before exchanging the code.

---

### M3. Empty `CRON_SECRET` would bypass cron auth

**Where:** all `app/api/cron/*/route.ts`, `app/api/admin/trust-sync/route.ts`

Guard is `header === process.env.CRON_SECRET`. If `CRON_SECRET` is unset/empty in the environment, a request with no header (`undefined === undefined`) or empty header passes.

**Impact:** Only exploitable if the env var is missing — but crons trigger emails and destructive orphan cleanup, so the blast radius is real.

**Fix:** Add a startup guard: reject if `process.env.CRON_SECRET` is falsy. `const secret = process.env.CRON_SECRET; if (!secret || header !== secret) return 401`.

---

### M4. Email/notification failures are silent

**Where:** `lib/notify.ts`, all `sendEmailDirect` call sites

Fire-and-forget with empty `catch {}` blocks. This is **correct design** (a failed email must not break a booking), but there is no logging/alerting when delivery fails.

**Impact:** If Resend is misconfigured or rate-limited, booking confirmations silently never arrive and no one knows.

**Fix:** Keep fire-and-forget, but log failures (`console.error`) so they surface in Vercel logs. Consider a dead-letter flag on `email_queue`.

---

### M5. `native_avg_rating` backfill not yet run

**Where:** `photographer_profiles` stored columns

The review-rating sync was fixed in code (commit `d87892b`), but **existing** reviews from before the fix still have stale `native_avg_rating`/`native_review_count`. Browse cards will show 0 for those photographers until backfilled.

**Fix:** Run the backfill SQL (provided earlier) once in Supabase. One-time.

---

## 🟢 LOW / NO-CARE

### L1. `.mov` videos don't play on Android Chrome
Format limitation, not a bug. iOS works. Fix later via Cloudflare Stream or MP4-only upload restriction if cross-device video matters. **No action for launch.**

### L2. Profile view count increment not implemented
`profile_view_count` exists and displays but isn't incremented on profile views. Cosmetic — shows 0. Low priority.

### L3. `NEXT_PUBLIC_R2_PUBLIC_URL` in env
Flagged during scan — this is **fine**. It's a public bucket URL, meant to be public. No secret exposure.

### L4. Debug `console.log` statements in some routes
A few `[oauth/google]`, `[reviews POST]` logs remain. Harmless, but noisy in production logs. Clean up opportunistically.

---

## What's Built Well (verified strengths)

These were checked and are genuinely solid — no action needed:

| Area | Finding |
|------|---------|
| **IDOR protection** | Every by-id route (`messages/[id]`, `bookings/[id]`) scopes queries with `.eq('client_id', user.id)` / `.eq('photographer_id', profile.id)`. Consistent and correct. |
| **Admin authorization** | All 10 admin routes verify `role === 'admin'` before acting. Cron-secret bypass path is scoped correctly. |
| **Upload pipeline** | Presign derives the R2 key server-side from `user.id` (no client-controlled paths), validates entity/content-type/size/quota. Register verifies `asset.owner_id === user.id` and orphan state. Textbook. |
| **Storage delete** | Verifies `owner_id === user.id` before deleting. No IDOR. |
| **Message attachments** | Presign verifies the sender is a participant of the conversation/group before issuing an upload URL. Download URLs signed only for messages already scoped to the user. |
| **Secrets hygiene** | `.env` gitignored and untracked; only `.env.example` committed. Service-role key used only in server route handlers, never client bundles. No secret in `NEXT_PUBLIC_*`. |
| **Booking guard** | Bookings to non-approved photographers correctly rejected with 422. |
| **XSS** | Contact form and email templates escape user input. |
| **Suspended accounts** | Middleware force-signs-out suspended/deactivated/rejected accounts. |

---

## Recommended Pre-Launch Order

1. **C2** — fix register `user_id` trust (30 min, closes users-table integrity hole)
2. **C1** — add message rate limit + body cap (1-2 hr, closes spam/harassment vector)
3. **M3** — cron empty-secret guard (10 min)
4. **M1** — contact form rate limit (30 min)
5. **M5** — run rating backfill SQL (2 min)
6. **M2** — OAuth state param (1 hr) — before public signup, not strictly before soft launch
7. **M4** — add failure logging (20 min)

Everything in 🟢 can wait until after launch.

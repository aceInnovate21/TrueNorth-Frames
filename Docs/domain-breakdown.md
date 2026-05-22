# TrueNorth Frames — Domain Breakdown

Product: Edmonton photographer marketplace connecting clients with local photographers.  
Stack: Next.js 14 · Supabase (PostgreSQL 15) · Cloudflare R2 · Resend · Vercel Cron  
Schema: `Docs/schema.dbml` · Code-side limits: `lib/platform-config.ts`

---

## Domain Index

| # | Domain | Tables | Key constraints |
|---|--------|--------|----------------|
| 1 | [Identity & Auth](#1-identity--auth) | `users`, `client_profiles`, `photographer_profiles` | Role, account status, lockout |
| 2 | [Portfolio](#2-portfolio) | `portfolio_albums`, `portfolio_photos`, `portfolio_videos` | Album/photo/video caps, upload size |
| 3 | [Packages & Pricing](#3-packages--pricing) | `packages` | Package cap, content lengths |
| 4 | [Availability & Scheduling](#4-availability--scheduling) | `availability_day_status`, `weekly_time_slots` | Overlap detection, tentative state |
| 5 | [Bookings](#5-bookings) | `booking_requests` | State machine, 1-review-per-booking |
| 6 | [Reviews & Trust](#6-reviews--trust) | `reviews`, `external_platform_links`, `trust_sync_log` | Rating range, flag flow, score formula |
| 7 | [Messaging](#7-messaging) | `conversations`, `messages`, `message_rate_limits`, `client_blocks` | Rate limit, block, spam report |
| 8 | [Photographer Network](#8-photographer-network) | `photographer_connections`, `connection_groups`, `group_members`, `group_invites`, `group_messages`, `cover_requests` | Owned-group cap, invite rules |
| 13 | [Profile View Analytics](#13-profile-view-analytics) | `photographer_profile_views` | 1 unique view/viewer/day, anonymous support, 365-day retention |
| 9 | [Notifications](#9-notifications) | `notifications`, `notification_preferences` | Retention, unread pattern |
| 10 | [Admin & Support](#10-admin--support) | `support_tickets`, `admin_audit_log` | Ticket categories, audit immutability |
| 11 | [System / Infrastructure](#11-system--infrastructure) | `platform_config`, `feature_flags`, `email_queue`, `storage_assets` | Config contract, orphan purge, email retry |
| 12 | [FAQs](#12-faqs) | `photographer_faqs` | FAQ cap, sort order |

---

## 1. Identity & Auth

### Tables

**`users`** — one row per account regardless of role

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `email` | varchar(255) UNIQUE | |
| `role` | `user_role` | `client` / `photographer` / `admin` |
| `full_name` | varchar(120) | |
| `account_status` | `account_status` | `active` / `suspended` / `banned` / `deactivated` |
| `status_reason` | text | Admin note explaining action |
| `status_changed_by` | uuid → users | Admin who acted |
| `is_verified` | boolean | Must be true before client can book |
| `failed_login_count` | smallint | Reset on successful login |
| `locked_until` | timestamptz | Non-null = account locked |
| `password_reset_count` | smallint | Resets sent in current 1-hour window |
| `password_reset_window_start` | timestamptz | Start of rolling reset window |
| `deleted_at` | timestamptz | Soft delete — `deactivated` state |

**`client_profiles`** — extended data for client-role users

| Column | Type | Notes |
|--------|------|-------|
| `bio` | varchar(500) | `max_client_bio_length` |
| `location` | varchar(120) | |
| `preferred_style` | varchar(80) | |

**`photographer_profiles`** — extended data + public profile

| Column | Type | Notes |
|--------|------|-------|
| `username` | varchar(40) UNIQUE | URL slug `/photographers/:username` — immutable after approval |
| `bio` | varchar(1200) | `max_photographer_bio_length` |
| `profile_status` | `photographer_profile_status` | `draft` → `pending` → `approved` / `suspended` / `banned` |
| `trust_score` | numeric(4,1) | 0–100, recomputed by cron |
| `native_avg_rating` | numeric(3,2) | avg of `reviews.rating` |
| `completeness_score` | smallint | 0–100, shown on photographer dashboard |

### Constraints

| Rule | Enforcement |
|------|-------------|
| Max consecutive failed logins before lockout | 10 · [API] |
| Lockout duration | 15 min · [API] |
| Warning shown at | ≤ 3 attempts remaining (after 7 failures) · [APP] |
| Password reset emails per hour | 3 · [API] rolling 1-hour window |
| Supabase JWT access token TTL | 60 min · [CONFIG] |
| Supabase refresh token TTL | 7 days · [CONFIG] |
| Photographer profile visible only when | `profile_status = 'approved'` · [API] |
| Suspended account | Login blocked, profile hidden · [API] |
| Email must be verified before booking | `users.is_verified = true` · [API] |
| Username immutable after approval | [API] |
| Session invalidated on ban/suspend | All Supabase sessions revoked · [API] |

**Profile completeness weights** (0–100, recomputed on save):

| Signal | Weight |
|--------|--------|
| Avatar | 15% |
| Bio (≥ 100 chars) | 20% |
| 1+ package | 15% |
| Cover photo | 10% |
| Specialties | 10% |
| Rate display | 10% |
| Availability set | 10% |
| External link added | 10% |

---

## 2. Portfolio

### Tables

**`portfolio_albums`** — organises photos and videos into named collections

| Column | Type | Notes |
|--------|------|-------|
| `title` | varchar(120) | `max_album_name_length` |
| `cover_photo_id` | uuid | Set after first photo insert (circular FK — set by app) |
| `sort_order` | smallint | Controls gallery display order |
| `is_published` | boolean | Unpublished albums hidden from public profile |

**`portfolio_photos`** — individual photos within albums

| Column | Type | Notes |
|--------|------|-------|
| `caption` | varchar(255) | `max_photo_caption_length` |
| `sort_order` | smallint | Controls sequence within album |
| `width_px`, `height_px` | integer | Recorded at upload |

**`portfolio_videos`** — video clips within albums

| Column | Type | Notes |
|--------|------|-------|
| `title` | varchar(120) | `max_video_title_length` |
| `duration_seconds` | smallint | Recorded at upload |
| `thumbnail_asset_id` | uuid → storage_assets | Auto-extracted poster frame |

### Constraints

| Rule | Value | Enforcement |
|------|-------|-------------|
| Albums per photographer | 3 | [CLIENT][API] |
| Photos per photographer (total, all albums) | 50 | [CLIENT][API] |
| Photos per album | No cap | Counted against photographer total |
| Videos per photographer (total) | 3 | [CLIENT][API] |
| Videos per album | 2 | [CLIENT][API] |
| Max photo upload size | 5 MB | [CLIENT][API] |
| Max video upload size | 100 MB | [CLIENT][API] |
| Max avatar upload size | 3 MB | [CLIENT][API] |
| Max cover image upload size | 8 MB | [CLIENT][API] |
| Accepted photo formats | JPG, PNG, WEBP, HEIC | Server converts to WebP 85% |
| Accepted video formats | MP4, MOV, AVI | Server re-encodes to H.264 MP4 |
| Video max resolution | 1080p | [API] |
| Video max duration | 90 seconds | [API] |
| Output photo format | WebP 85%, max 2400px long edge | [API] |
| Output avatar format | WebP 90%, 400×400px square crop | [API] |
| Output cover format | WebP 85%, max 1400px wide | [API] |

**Storage estimate per photographer** (post-compression, worst case):  
Photos 50 × 1.5 MB = ~75 MB · Videos 3 × 60 MB = ~180 MB · Avatar + Cover ≈ 0.5 MB  
**Total ≈ 255 MB/photographer** → R2 free tier (10 GB) covers ~39 photographers

---

## 3. Packages & Pricing

### Tables

**`packages`** — pricing packages offered by a photographer

| Column | Type | Notes |
|--------|------|-------|
| `name` | varchar(120) | `max_package_name_length` |
| `description` | varchar(800) | `max_package_description_length` |
| `billing_type` | `billing_type` | `hourly` / `package` |
| `price` | numeric(10,2) | Must be ≥ 0 |
| `duration_minutes` | integer | For hourly sessions |
| `deliverables` | text[] | e.g. `{20 edited photos, digital gallery}` |
| `is_active` | boolean | Inactive packages not shown to clients |

### Constraints

| Rule | Value | Enforcement |
|------|-------|-------------|
| Max packages per photographer | 10 | [CLIENT][API] |
| Package name length | 120 chars | [DB] varchar |
| Package description length | 800 chars | [DB] varchar · `max_package_description_length` |
| Mixed billing types allowed | Yes | A photographer can have both hourly and package types |

---

## 4. Availability & Scheduling

### Tables

**`availability_day_status`** — per-day explicit overrides

| Column | Type | Notes |
|--------|------|-------|
| `date` | date | |
| `status` | `availability_status` | `available` / `tentative` / `busy` |
| `note` | varchar(255) | Internal note, not shown to clients |

Unique index on `(photographer_id, date)` — one row per day.

**`weekly_time_slots`** — recurring weekly windows

| Column | Type | Notes |
|--------|------|-------|
| `day_of_week` | smallint | 0 = Sunday … 6 = Saturday |
| `start_time` | time | e.g. `09:00:00` |
| `end_time` | time | e.g. `11:00:00` |
| `slot_label` | varchar(60) | Generated display string `"9:00 AM – 11:00 AM"` |
| `max_clients` | smallint | Concurrent bookings allowed in this window (default 1) |

### Constraints

| Rule | Enforcement |
|------|-------------|
| No row = no data (neutral / grey on calendar) | [APP] |
| Pending booking → date set to `tentative` | [API] on booking insert |
| Resolved booking → `tentative` cleared | [API] on status change |
| Slot overlap detection uses `start_time`/`end_time` | [API] |
| `max_clients` per slot enforced | [API] count active bookings ≤ max_clients |
| Past dates are read-only on public calendar | [APP] |
| Clients can book up to | 90 days ahead · `booking_window_days` |

---

## 5. Bookings

### Tables

**`booking_requests`** — a client's request for a session

| Column | Type | Notes |
|--------|------|-------|
| `occasion` | varchar(120) | e.g. `"Wedding Reception"` |
| `description` | varchar(600) | `max_booking_description_length` |
| `location_note` | varchar(255) | `max_booking_location_note_length` |
| `status` | `booking_status` | State machine — see below |
| `photographer_note` | varchar(800) | `max_photographer_response_length` |
| `cancellation_reason` | varchar(120) | Preset reason list |
| `cancellation_note` | varchar(400) | `max_cancellation_note_length` |
| `completed_at` | timestamptz | Set when status → `completed` |

### State Machine

```
pending ──► approved ──► completed
   │
   ├──► declined    (terminal)
   └──► cancelled   (terminal — client only, before photographer responds)
```

Invalid transitions blocked at [API]: `approved → cancelled`, `completed → any`, `declined → any`, `cancelled → any`

### Constraints

| Rule | Enforcement |
|------|-------------|
| One booking per client–photographer–date | [DB] unique index |
| Client must be email-verified to book | [API] |
| `completed` status → client eligible for one review | [DB] unique index on `booking_id` in reviews |
| Pending booking sets date to `tentative` | [API] |
| Booking window | 90 days ahead · [API] |

---

## 6. Reviews & Trust

### Tables

**`reviews`** — post-session client review

| Column | Type | Notes |
|--------|------|-------|
| `rating` | smallint | 1–5 (check constraint) |
| `body` | varchar(1500) | `max_review_body_length` |
| `public_reply` | varchar(800) | `max_review_reply_length` |
| `flag_status` | `review_flag_status` | `none` / `flagged` / `flag_resolved` |
| `flag_reason` | varchar(600) | `max_flag_reason_length` |
| `private_note` | varchar(600) | `max_review_private_note_length` — internal only |

**`external_platform_links`** — linked review profiles (Google, Yelp, etc.)

| Column | Type | Notes |
|--------|------|-------|
| `platform` | `platform_name` | `google` / `yelp` / `facebook` / `instagram` |
| `is_verified` | boolean | Admin/cron confirms URL belongs to photographer |
| `last_fetched_at` | timestamptz | Used for staleness check |

**`trust_sync_log`** — append-only cron fetch log

### Trust Score Formula

Composite 0–100 computed by Vercel Cron daily at 06:00 MST:

| Platform | Weight | Condition to contribute |
|----------|--------|------------------------|
| Google Reviews | 35% | `is_verified = true` + fetched within 8 days |
| Native Reviews | 20% | `avg(reviews.rating)` for photographer |
| Yelp | 20% | `is_verified = true` + fetched within 8 days |
| Facebook | 15% | `is_verified = true` + fetched within 8 days |
| Instagram | 10% | `is_verified = true` + fetched within 8 days |

Score is rescaled to 0–100 based on sum of active (contributing) weights.

### Review Constraints

| Rule | Enforcement |
|------|-------------|
| One review per completed booking | [DB] unique index on `booking_id` |
| Reviewer must be booking's `client_id` | [API] |
| Reviews always public — no hide/suppress | [APP] no status column |
| Flagging creates support ticket automatically | [API] |
| Flagged review stays public until admin resolves | [APP] |
| Rating must be 1–5 | [DB] check constraint |
| `native_avg_rating` recomputed on every insert | [DB] trigger or [API] |
| Trust sync staleness | 8 days · `trust_sync_stale_after_days` |

---

## 7. Messaging

### Tables

**`conversations`** — one thread per client–photographer pair

| Column | Type | Notes |
|--------|------|-------|
| `is_frozen` | boolean | Admin locked — no new messages |
| `is_flagged` | boolean | Queued for admin review |
| `flagged_by` | uuid → users | |
| `frozen_by` | uuid → users | Admin who froze |

**`messages`** — individual messages in a conversation

| Column | Type | Notes |
|--------|------|-------|
| `body` | text | Capped at 1000 chars in UI/API |
| `read_at` | timestamptz | null = unread; set on first view |

**`message_rate_limits`** — rolling 1-hour counter per client

| Column | Type | Notes |
|--------|------|-------|
| `hour_bucket` | bigint | `floor(unix_epoch / 3600)` |
| `message_count` | smallint | Incremented atomically |

**`client_blocks`** — client-initiated silent block of a photographer

| Column | Type | Notes |
|--------|------|-------|
| `block_reason` | varchar(120) | Optional, never shown to photographer |

### Constraints

| Rule | Value | Enforcement |
|------|-------|-------------|
| One conversation per client–photographer | — | [DB] unique index |
| Max message length | 1000 chars | [CLIENT][API] · `max_message_length` |
| Max messages per client per hour | 20 | [API] · `max_messages_per_hour` |
| Warning threshold | ≤ 3 remaining (count ≥ 17) | [APP] |
| Send blocked when | count ≥ 20 | [API][CLIENT] textarea disabled |
| Rate limit row purged after | 2 hours | [CRON] |
| Max unread conversations shown in inbox | 15 | [APP] UI only |
| Frozen conversation | No new messages | [API] checks `is_frozen` |
| Photographer blocked | Cannot send new messages | [API] checks `client_blocks` |
| Block is silent | Photographer not notified | [APP] |
| Auto-suspend threshold | 3 unique client spam reports | [API] → `account_status = 'suspended'` |

**Spam report flow:**  
Client reports → `support_ticket` created (category `spam_report`) → system counts unique reporters for photographer → at 3 unique reports, photographer auto-suspended → admin reviews ticket queue → can dismiss, ban, or lift suspension.

---

## 8. Photographer Network

### Tables

**`photographer_connections`** — directed connection requests between photographers

| Column | Type | Notes |
|--------|------|-------|
| `status` | `connection_status` | `pending` / `accepted` / `declined` / `blocked` |

**`connection_groups`** — group chats owned by a photographer

| Column | Type | Notes |
|--------|------|-------|
| `name` | varchar(120) | |
| `emoji` | varchar(8) | |
| `member_count` | integer | Denormalised; incremented on join |

**`group_members`** — junction: photographer ↔ group

| Column | Type | Notes |
|--------|------|-------|
| `is_owner` | boolean | Only the creator is owner |

**`group_invites`** — pending invitations to join a group

**`group_messages`** — messages within a group

| Column | Type | Notes |
|--------|------|-------|
| `body` | varchar(1000) | Matches `max_message_length` |

**`cover_requests`** — photographer asks a connection to cover a booked session

| Column | Type | Notes |
|--------|------|-------|
| `message` | varchar(600) | `max_cover_request_message_length` |

### Constraints

| Rule | Value | Enforcement |
|------|-------|-------------|
| Groups owned per photographer | 2 | [API] · `max_owned_groups_per_photographer` |
| Joining groups created by others | No cap | [APP] |
| Owner leaving a group | Deletes the group for all members | [APP] |
| Member leaving a group | Removes only themselves | [APP] |
| Owner can remove any member | Yes | [APP] |
| Invitee must be a connection of the inviter | — | [API] check `photographer_connections` |
| One pending invite per invitee per group | — | [DB] unique index `(group_id, invitee_id)` |
| Connection request: one direction only | — | [DB] unique index `(requester_id, addressee_id)` |
| Group name length | 120 chars | [DB] varchar |

---

## 9. Notifications

### Tables

**`notifications`** — in-app notification feed

| Column | Type | Notes |
|--------|------|-------|
| `type` | `notification_type` | 13 event types (booking, message, connection, review, trust) |
| `title` | varchar(160) | |
| `body` | varchar(400) | `max_notification_body_length` |
| `read_at` | timestamptz | null = unread |
| `expires_at` | timestamptz | Set by cron; null = no expiry |
| `entity_type` + `entity_id` | varchar / uuid | Deep-link target |

**`notification_preferences`** — one row per user, all defaults on

| Preference | Default |
|-----------|---------|
| email_booking | true |
| email_messages | true |
| email_connections | true |
| email_reviews | true |
| email_trust_updates | false |
| push_booking | true |
| push_messages | true |
| push_connections | true |

### Constraints

| Rule | Value | Enforcement |
|------|-------|-------------|
| Read notifications purged after | 90 days | [CRON] · `notification_retention_days` |
| Unread notifications | No purge (kept until read) | [APP] |
| SMS / phone | Not collected in Phase 1 | [APP] no column |

---

## 10. Admin & Support

### Tables

**`support_tickets`** — admin-facing issue queue

| Column | Type | Notes |
|--------|------|-------|
| `category` | `support_ticket_category` | `fake_review` / `inappropriate_content` / `spam_report` / `billing_dispute` / `account_issue` / `other` |
| `description` | varchar(2000) | `max_ticket_description_length` |
| `resolution_note` | varchar(1000) | `max_ticket_resolution_note_length` |
| `conversation_id` | uuid → conversations | Set for `spam_report` tickets |
| `reported_user_id` | uuid → users | Photographer being reported |
| `spam_report_count` | smallint | Unique-client report count at ticket creation |

**`admin_audit_log`** — append-only record of all admin actions

| Column | Type | Notes |
|--------|------|-------|
| `action` | varchar(80) | e.g. `resolve_flag`, `suspend_account`, `freeze_conversation` |
| `entity_type` | varchar(40) | e.g. `review`, `user`, `platform_config` |
| `ip_address` | inet | Recorded at action time |

### Constraints

| Rule | Enforcement |
|------|-------------|
| Ticket created automatically when photographer flags review | [API] |
| Ticket created automatically on spam report | [API] |
| Audit log is append-only — never mutated after insert | [APP] DB has no UPDATE/DELETE grants on this table |
| Audit log archived after | 2 years — cold storage, never deleted |
| `platform_config` changes always audit-logged | [API] |

---

## 11. System / Infrastructure

### Tables

**`platform_config`** — runtime key-value store for all business limits

| Column | Type | Notes |
|--------|------|-------|
| `key` | varchar(80) UNIQUE | Maps 1:1 to `lib/platform-config.ts` keys |
| `value` | text | Cast using `value_type` at read time |
| `value_type` | `platform_config_type` | `integer` / `numeric` / `boolean` / `text` |
| `category` | varchar(40) | Groups keys in admin UI |
| `updated_by` | uuid → users | Admin who last changed this value |

Config is the runtime source of truth. The frontend `PLATFORM_CONFIG` object in `lib/platform-config.ts` mirrors initial seed values and is the source during the mock phase. When backend is wired, all components read via a cached `getPlatformConfig()` — no component changes needed.

**`feature_flags`** — runtime boolean toggles, admin-managed

**`email_queue`** — outbound email queue processed by Vercel Cron via Resend

| Column | Type | Notes |
|--------|------|-------|
| `template_id` | varchar(80) | Resend template |
| `payload` | jsonb | Template variables |
| `attempts` | smallint | Max 3 before `failed` |
| `status` | `email_queue_status` | `queued` / `sent` / `failed` |

Retry backoff: 5 min → 30 min → 2 hr.

**`storage_assets`** — tracks every Cloudflare R2 object

| Column | Type | Notes |
|--------|------|-------|
| `bucket` | varchar(60) | |
| `key` | text | R2 object key; unique with bucket |
| `entity_type` | varchar(40) | `portfolio_photo` / `portfolio_video` / `avatar` / `cover` |
| `entity_id` | uuid | null = orphaned (not yet linked) |
| `orphan_expires_at` | timestamptz | Set at upload time; cron purges if still null |

### Constraints

| Rule | Value | Enforcement |
|------|-------|-------------|
| Platform config rows never deleted | Update value instead | [APP] |
| varchar-backed limits are DB floor | `platform_config` may only tighten, never loosen | [APP] |
| All config changes audit-logged | — | [API] |
| Presigned upload URL expiry | 15 min (900 s) | [API] · `r2_presigned_url_expiry_seconds` |
| Orphaned asset TTL | 1 hour | [CRON] |
| Multipart upload threshold | 10 MB | [API] |
| Concurrent multipart parts | 4 | [API] |
| Edge cache for config reads | 5 min (300 s revalidate) | [API] |
| Vercel serverless timeout | 60 s (Pro plan required) | [INFRA] |
| Video processing | Offloaded to Cloudflare Worker or Trigger.dev | [INFRA] do NOT process in Vercel function |
| API requests per IP per minute | 100 | [EDGE] |
| Upload endpoint per user per minute | 10 | [EDGE] |
| Search endpoint per IP per minute | 30 | [EDGE] |
| Search results page size | 20 | [API] · `search_page_size` |
| Group message retention | 365 days | [CRON] |
| Audit log archive | 2 years | [CRON] cold storage |

---

## 12. FAQs

### Tables

**`photographer_faqs`** — accordion Q&A on photographer public profile

| Column | Type | Notes |
|--------|------|-------|
| `question` | varchar(160) | `max_faq_question_length` |
| `answer` | varchar(600) | `max_faq_answer_length` |
| `sort_order` | smallint | 0-based; rewritten 0–N on every reorder |
| `is_published` | boolean | false = draft, hidden from public |

### Constraints

| Rule | Value | Enforcement |
|------|-------|-------------|
| FAQs per photographer | 5 | [CLIENT][API] · `max_faqs_per_photographer` |
| Question max length | 160 chars | [DB] varchar |
| Answer max length | 600 chars | [DB] varchar |
| Public position | Between portfolio and reviews | [APP] |
| Display format | Accordion (one open at a time) | [APP] |

---

## Platform Config Reference

All limits below are defined in `lib/platform-config.ts` and mirrored in the `platform_config` DB table.

| Category | Key | Value | Used by |
|----------|-----|-------|---------|
| content | `max_photographer_bio_length` | 1200 | photographer edit page |
| content | `max_client_bio_length` | 500 | client edit page |
| content | `max_package_name_length` | 120 | packages component |
| content | `max_package_description_length` | 800 | packages component |
| content | `max_booking_description_length` | 600 | booking modal |
| content | `max_booking_location_note_length` | 255 | booking modal |
| content | `max_photographer_response_length` | 800 | photographer dashboard |
| content | `max_cancellation_note_length` | 400 | booking cancellation |
| content | `max_review_body_length` | 1500 | review form |
| content | `max_review_reply_length` | 800 | review manager |
| content | `max_flag_reason_length` | 600 | review manager |
| content | `max_review_private_note_length` | 600 | review manager |
| content | `max_cover_request_message_length` | 600 | cover requests |
| content | `max_notification_body_length` | 400 | notifications |
| content | `max_ticket_description_length` | 2000 | support tickets |
| content | `max_ticket_resolution_note_length` | 1000 | admin panel |
| messaging | `max_message_length` | 1000 | messages page |
| messaging | `max_messages_per_hour` | 20 | messages page |
| messaging | `max_unread_conversations_shown` | 15 | messages page |
| messaging | `rate_limit_warning_threshold` | 3 | messages page |
| messaging | `spam_auto_suspend_threshold` | 3 | API |
| messaging | `rate_limit_row_ttl_hours` | 2 | cron |
| faq | `max_faqs_per_photographer` | 5 | photographer dashboard |
| faq | `max_faq_question_length` | 160 | photographer dashboard |
| faq | `max_faq_answer_length` | 600 | photographer dashboard |
| portfolio | `max_albums_per_photographer` | 3 | portfolio page |
| portfolio | `max_photos_per_photographer` | 50 | portfolio page |
| portfolio | `max_videos_per_photographer` | 3 | portfolio page |
| portfolio | `max_videos_per_album` | 2 | portfolio page |
| portfolio | `max_photo_bytes` | 5 MB | portfolio page |
| portfolio | `max_video_bytes` | 100 MB | portfolio page |
| portfolio | `max_avatar_bytes` | 3 MB | edit page |
| portfolio | `max_cover_bytes` | 8 MB | edit page |
| portfolio | `max_photo_caption_length` | 255 | portfolio page |
| portfolio | `max_video_title_length` | 120 | portfolio page |
| portfolio | `max_album_name_length` | 120 | portfolio page |
| packages | `max_packages_per_photographer` | 10 | packages component |
| network | `max_owned_groups_per_photographer` | 2 | connections component |
| booking | `booking_window_days` | 90 | booking modal |
| auth | `login_max_failed_attempts` | 10 | API |
| auth | `login_lockout_minutes` | 15 | API |
| auth | `login_warning_threshold` | 3 | login page |
| auth | `password_reset_max_per_hour` | 3 | API |
| auth | `session_access_token_minutes` | 60 | Supabase config |
| auth | `session_refresh_token_days` | 7 | Supabase config |
| api | `api_rate_limit_per_minute` | 100 | Edge middleware |
| api | `api_body_size_limit_mb` | 10 | Next.js config |
| api | `search_page_size` | 20 | search API |
| storage | `r2_presigned_url_expiry_seconds` | 900 | upload API |
| storage | `r2_orphan_asset_ttl_hours` | 1 | cron |
| storage | `notification_retention_days` | 90 | cron |
| storage | `group_message_retention_days` | 365 | cron |
| storage | `audit_log_archive_after_days` | 730 | cron |
| email | `max_email_retry_attempts` | 3 | cron |
| trust | `trust_sync_stale_after_days` | 8 | cron |
| analytics | `profile_view_retention_days` | 365 | cron |

---

## 13. Profile View Analytics

### Tables

**`photographer_profile_views`** — event log, one row per unique viewer per photographer per calendar day

| Column | Type | Notes |
|--------|------|-------|
| `photographer_id` | uuid → photographer_profiles | Who was viewed |
| `viewer_id` | uuid → users (nullable) | null = unauthenticated visitor |
| `viewer_role` | varchar(20) | `'client'` / `'photographer'` / null (anonymous) |
| `viewer_fingerprint` | varchar(64) | sha256(user_id) for auth; sha256(IP + UA) for anonymous — **raw IP never stored** |
| `view_date` | date | Calendar date in MST — drives the daily deduplication window |
| `referrer_type` | varchar(40) | `'search'` / `'saved_list'` / `'direct'` / `'cover_request'` / null |
| `viewed_at` | timestamptz | Exact timestamp of the first view that day |

**Deduplication key:** unique index on `(photographer_id, viewer_fingerprint, view_date)`

**Denormalised counter:** `photographer_profiles.profile_view_count` — incremented by API atomically only when the dedup insert succeeds (not on conflict). This gives O(1) "total views" reads without hitting the event log.

### Write Path (API — on every `/photographers/:username` page load)

```
1. Compute viewer_fingerprint = sha256(viewer_id OR IP+UA)
2. Compute view_date = today in MST
3. INSERT INTO photographer_profile_views … ON CONFLICT DO NOTHING
4. IF rowCount = 1 (new unique view):
     UPDATE photographer_profiles
       SET profile_view_count = profile_view_count + 1
       WHERE id = photographer_id
   ELSE: no-op (already counted today)
```

### Read Queries (photographer dashboard)

| Metric | Query |
|--------|-------|
| Total views (all time) | `SELECT profile_view_count FROM photographer_profiles` — O(1) |
| Views this week | `COUNT(*) WHERE photographer_id = ? AND view_date >= current_date - 7` |
| Views this month | `COUNT(*) WHERE photographer_id = ? AND view_date >= date_trunc('month', current_date)` |
| Views by referrer | `GROUP BY referrer_type` |
| Authenticated vs anonymous | `COUNT(*) GROUP BY viewer_id IS NULL` |

### Constraints

| Rule | Enforcement |
|------|-------------|
| 1 unique view per viewer per photographer per day | [DB] unique index `(photographer_id, viewer_fingerprint, view_date)` |
| Anonymous visitors counted | `viewer_id = null`; fingerprint from hashed IP + UA |
| Raw IP never stored | Only sha256 hash stored · [API] |
| Authenticated + unauthenticated both deduplicate | Same fingerprint approach for both |
| `profile_view_count` incremented atomically | Only on successful INSERT (rowCount = 1) · [API] |
| `profile_view_count` not decremented on cron purge | It is a lifetime total — not a rolling counter |
| Event log retention | 365 days · [CRON] · `profile_view_retention_days` |

---

## Resolved Decisions

| Item | Decision | Where implemented |
|------|----------|-------------------|
| `specialties` normalisation | Normalised into `photographer_specialties` table | Schema + domain breakdown |
| `deliverables` | Kept as `text[]` — no DB filtering needed | No change needed |
| Post-approval cancellation | Formal `cancellation_pending` state + `booking_cancellation_requests` table | Schema sections 4, bookings |
| `cover_request_status` enum | New dedicated enum: `pending/accepted/declined/withdrawn` | Schema enums + cover_requests table |
| DB check constraints | Added: `rating 1–5`, `price ≥ 0`, `duration_minutes > 0`, `day_of_week 0–6`, `end_time > start_time`, `trust_score 0–100`, `native_avg_rating 0–5` | Schema column notes |
| Group message rate limit | `group_message_rate_limits` table, cap 30/hr, `max_group_messages_per_hour` config key | Schema + platform-config.ts |
| Notification badge cap | `max_notification_badge_count: 99` — UI shows "99+" above this | Schema + platform-config.ts |

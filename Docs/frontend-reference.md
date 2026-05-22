# TrueNorth Frames — Frontend Reference
**Purpose:** Backend & database schema reference derived from the built frontend.  
**Last updated:** May 17, 2026  
**Stack:** Next.js 14 App Router · Tailwind CSS · Lucide icons · all data currently mocked

---

## 1. Routes Built

### Public / Auth
| Route | Render | Description |
|---|---|---|
| `/` | Static | Marketing landing — featured photographers, specialty shortcuts, How it works |
| `/about` | Static | Company info page |
| `/how-it-works` | Static | Process explainer for clients |
| `/for-photographers` | Static | Photographer acquisition / pitch page |
| `/login` | Client | Email + password login, role-aware redirect |
| `/signup` | Client | Role selection (client / photographer) + registration |
| `/forgot-password` | Client | Sends reset link |
| `/reset-password` | Client | Consumes reset token, sets new password |
| `/onboarding` | Client | Client onboarding (name, location, needs) |
| `/onboarding/photographer` | Client | 3-step photographer onboarding (see §4) |

### Client Domain
| Route | Render | Description |
|---|---|---|
| `/photographers` | Client | Browse / discovery — search, filter by specialty, area, sort |
| `/photographers/[username]` | Server | Public photographer profile |
| `/photographers/your-profile` | Client | Client's own profile preview |
| `/messages` | Client | Client chat inbox — conversation list + thread |
| `/messages/[slug]` | Dynamic | Deep-link into a specific conversation thread |
| `/dashboard/client` | Client | Client dashboard — bookings, saved photographers, notifications, reviews |
| `/dashboard/client/edit` | Client | Client account settings — name, email, password, notifications |

### Photographer Domain
| Route | Render | Description |
|---|---|---|
| `/messages/photographer` | Client | Photographer chat inbox (receive-only) |
| `/dashboard/photographer` | Client | Full photographer dashboard (8 tabs — see §5) |
| `/dashboard/photographer/edit` | Client | Quick profile edit shortcut |
| `/dashboard/photographer/portfolio` | Client | Album manager — create albums, upload photos |

### Admin Domain
| Route | Render | Description |
|---|---|---|
| `/admin` | Client | Platform overview — growth charts, activity feed, quick links |
| `/admin/analytics` | Client | Detailed analytics — client funnel, photographer engagement, specialty demand |
| `/admin/accounts` | Client | Account manager — search, filter, suspend / ban / delete |
| `/admin/conversations` | Client | Conversation browser — read-only, freeze / flag |
| `/admin/trust-health` | Client | Trust aggregator health — per-platform sync status, error log |

---

## 2. User Roles & Auth

```
Role: 'client' | 'photographer' | 'admin'
```

- Single login page routes to role-appropriate dashboard on success.
- Photographer registration triggers an **approval flow** before the profile goes live (`status: pending → approved`).
- Admin role is not self-registrable — seeded or manually assigned.

**Fields collected at signup:**
- Email, password
- Role selection
- Client: first name, last name, city/neighbourhood
- Photographer: continues into 3-step onboarding (see §4)

---

## 3. Client Data Model

### User (client)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| email | string | unique |
| first_name | string | |
| last_name | string | |
| city | string | free-text, e.g. "Oliver, Edmonton" |
| avatar_url | string | R2 URL, optional |
| member_since | timestamp | |
| notification_email | boolean | opt-in email alerts for replies |
| role | enum | `client` |

### Saved Photographers
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| client_id | uuid | FK → users |
| photographer_id | uuid | FK → photographer_profiles |
| saved_at | timestamp | |

### Client Bookings (from client dashboard)
Displayed as past sessions with: photographer name, date, specialty, status (`completed` / `upcoming` / `cancelled`). Feeds the "leave a review" prompt.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| client_id | uuid | FK → users |
| photographer_id | uuid | FK → photographer_profiles |
| date | date | |
| time_slot | string | e.g. "10:00 AM – 12:00 PM" |
| status | enum | `upcoming` \| `completed` \| `cancelled` |
| package_id | uuid | FK → packages, nullable |

### Client Notifications
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| client_id | uuid | FK → users |
| type | enum | `reply` \| `booking_confirmed` \| `review_reminder` \| `system` |
| from_name | string | display name of sender |
| preview | string | notification body snippet |
| read | boolean | |
| created_at | timestamp | |
| action_url | string | deep link e.g. `/messages/sarah-chen` |

---

## 4. Photographer Onboarding (3 steps)

**Step 1 — Basic details**
- Display name (required)
- Bio (required, max 500 chars)
- Edmonton neighbourhood (required, see area enum §6)
- Starting rate + rate unit (`per_hour` / `per_session` / `per_day`)

**Step 2 — Specialties**
- Pick 1–5 from fixed list (see specialty enum §6)

**Step 3 — Review platform links**
- Google Business URL
- Instagram handle / URL
- Yelp URL
- Website URL (optional)

On submit → profile created with `status: pending`, redirects to pending holding page. Admin approves to make live.

---

## 5. Photographer Data Model

### Photographer Profile
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK / FK → users.id |
| display_name | string | |
| bio | text | max 500 chars |
| area | string | Edmonton neighbourhood enum |
| specialties | string[] | up to 5, from fixed list |
| starting_rate | numeric | |
| rate_unit | enum | `per_hour` \| `per_session` \| `per_day` |
| avatar_url | string | R2 URL |
| status | enum | `pending` \| `approved` \| `suspended` \| `banned` |
| completeness_score | integer | 0–100, computed from field weights |
| cover_available | boolean | willing to cover for other photographers |
| google_url | string | |
| instagram_url | string | |
| yelp_url | string | |
| website_url | string | |
| email | string | contact email (may differ from auth email) |
| phone | string | optional |
| created_at | timestamp | |
| updated_at | timestamp | |

**Profile completeness score weights (frontend-computed):**
| Field | Weight |
|---|---|
| Display name | 10% |
| Bio (≥20 chars) | 15% |
| Location / area | 10% |
| Starting rate | 10% |
| Specialties (≥1) | 15% |
| Google URL linked | 15% |
| Instagram URL linked | 10% |
| Portfolio photos uploaded | 15% |

### Packages
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| photographer_id | uuid | FK → photographer_profiles |
| name | string | e.g. "Mini Session" |
| description | text | |
| price | numeric | |
| price_unit | enum | `flat` \| `starting` |
| includes | string[] | bullet list items |
| popular | boolean | highlighted in UI |
| position | integer | display order |

### Availability

**Day-level status** (calendar):
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| photographer_id | uuid | FK |
| date | date | |
| status | enum | `available` \| `busy` \| `tentative` |

**Weekly time slots** (recurring schedule):
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| photographer_id | uuid | FK |
| day_of_week | integer | 0=Sun … 6=Sat |
| slot_label | string | e.g. "9:00 AM – 11:00 AM" |
| start_time | time | "09:00" |
| end_time | time | "11:00" |
| max_clients | integer | concurrent bookings allowed |

### Booking Requests
Clients submit via `BookingRequestModal` on the public profile. Photographer sees in Requests tab.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| photographer_id | uuid | FK → photographer_profiles |
| client_id | uuid | FK → users |
| client_name | string | denormalised for display |
| date | date | |
| time_slot | string | selected slot label |
| note | text | client message at time of booking |
| status | enum | `pending` \| `approved` \| `rejected` |
| photographer_note | text | photographer's response note |
| submitted_at | timestamp | |
| responded_at | timestamp | nullable |

On **approve** → auto-injects a confirmation message into the conversation thread.  
On **approve** → marks that date as `busy` in photographer's availability calendar.

### Reviews
Sources: `google` | `instagram` | `yelp` | `internal` (platform native, Phase 2)

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| photographer_id | uuid | FK |
| source | enum | `google` \| `yelp` \| `instagram` \| `internal` |
| author | string | reviewer display name |
| rating | numeric | 1.0–5.0 |
| text | text | review body |
| date | date | original review date |
| status | enum | `pending` \| `approved` \| `flagged` \| `resolved` |
| photographer_note | text | private internal note by photographer |
| resolved_at | timestamp | nullable |
| synced_at | timestamp | last pull from external platform |

### Photographer Network (P2P connections)

**Connections:**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| requester_id | uuid | FK → photographer_profiles |
| receiver_id | uuid | FK → photographer_profiles |
| status | enum | `connected` \| `pending_sent` \| `pending_received` \| `suggested` |
| created_at | timestamp | |

**Groups** (max 2 per photographer in current UI):
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | string | |
| emoji | string | single emoji character |
| created_by | uuid | FK → photographer_profiles |
| created_at | timestamp | |

**Group Members:**
| Field | Type | Notes |
|---|---|---|
| group_id | uuid | FK → groups |
| photographer_id | uuid | FK → photographer_profiles |

**Group Messages:**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| group_id | uuid | FK → groups |
| sender_id | uuid | FK → photographer_profiles |
| text | text | |
| sent_at | timestamp | |

**Cover Requests:**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| from_photographer_id | uuid | FK → photographer_profiles |
| event_description | text | |
| date | date | |
| area | string | |
| status | enum | `open` \| `filled` |
| filled_by | uuid | FK → photographer_profiles, nullable |
| created_at | timestamp | |

On **accept cover** → marks that date as `busy` in accepting photographer's availability calendar.

---

## 6. Messaging

Initiated by client only (photographers cannot start a new thread).

### Conversations
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| client_id | uuid | FK → users |
| photographer_id | uuid | FK → photographer_profiles |
| created_at | timestamp | |
| last_message_at | timestamp | |
| is_frozen | boolean | admin action, blocks new messages |
| is_flagged | boolean | admin-flagged for review |
| flag_reason | text | nullable |

### Messages
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations |
| sender_id | uuid | FK → users |
| sender_role | enum | `client` \| `photographer` |
| text | text | |
| sent_at | timestamp | |
| read_at | timestamp | nullable — null = unread |

**Rules enforced in UI:**
- Client initiates; photographer can only reply (no new thread creation).
- Frozen conversations block all new messages.
- Booking confirmation auto-sends a message from photographer when a booking request is approved.

---

## 7. Trust Aggregator

Platform syncs run via **Vercel Cron daily at 6:00 AM MST**.

### External Platforms
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| photographer_id | uuid | FK |
| platform | enum | `google` \| `instagram` \| `yelp` \| `facebook` |
| url_or_handle | string | the linked URL or @handle |
| avg_rating | numeric | 0–5, normalised |
| review_count | integer | |
| follower_count | integer | Instagram only |
| raw_data | jsonb | full API response |
| last_synced_at | timestamp | |
| sync_status | enum | `success` \| `failed` \| `rate_limited` \| `pending` |
| error_message | text | nullable |

### Sync Log (per sync run)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| platform | enum | |
| run_at | timestamp | |
| status | enum | `success` \| `failed` \| `rate_limited` |
| profiles_updated | integer | |
| detail | text | human-readable result or error |

### Trust Score Weights (configurable)
| Platform | Weight |
|---|---|
| Google Reviews | 35% |
| Yelp | 20% |
| Native platform reviews | 20% |
| Facebook | 15% |
| Instagram engagement | 10% |

Composite trust score (0–5) stored on `photographer_profiles.trust_score`, recomputed after each sync.

---

## 8. Admin

### Admin capabilities built in UI:
| Action | Target | Notes |
|---|---|---|
| Suspend account | User (any role) | Temporary — reversible |
| Ban account | User (any role) | Permanent until admin lifts |
| Delete account | User (any role) | Hard delete, confirmation required |
| Freeze conversation | Conversation | Blocks new messages both sides |
| Flag conversation | Conversation | Marks for review with reason |
| Force sync | Platform | Triggers immediate trust sync |
| Sync all | All platforms | Global re-sync |
| View all conversations | Read-only | Full thread visible to admin |

### Support Tickets
Both client and photographer dashboards have a "Contact support" form. Fields:

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| submitted_by | uuid | FK → users |
| role | enum | `client` \| `photographer` |
| category | string | e.g. "booking", "trust score", "bug report" |
| message | text | |
| submitted_at | timestamp | |
| status | enum | `open` \| `resolved` |
| admin_reply | text | nullable |
| resolved_at | timestamp | nullable |

Admin inbox for support tickets is **not yet built in the frontend** — backend should expose an endpoint; admin UI to be added.

---

## 9. Enums Reference

### Specialties (fixed list, 12 options)
`Wedding` · `Portrait` · `Corporate` · `Newborn` · `Family` · `Event` · `Real Estate` · `Product` · `Street` · `Boudoir` · `Sports` · `Food`

### Edmonton Areas (fixed list, 14 options)
`Downtown` · `Oliver` · `Glenora` · `Westmount` · `Strathcona` · `Bonnie Doon` · `Millwoods` · `Windermere` · `St. Albert` · `Sherwood Park` · `West Edmonton` · `North Edmonton` · `South Edmonton` · `Other`

### Rate Units
`per_hour` · `per_session` · `per_day`

### Account Status
`active` · `pending` · `suspended` · `banned`

### Booking Request Status
`pending` · `approved` · `rejected`

### Availability Day Status
`available` · `busy` · `tentative`

### Message Status (client messages page)
`sent` · `delivered` · `read`

### Review Status
`pending` · `approved` · `flagged` · `resolved`

### Review Source
`google` · `yelp` · `instagram` · `internal`

### Sync Status
`success` · `failed` · `rate_limited` · `pending`

### Conversation Status (admin)
`active` · `frozen` · `flagged`

### Cover Request Status
`open` · `filled`

### Network Connection Status
`connected` · `pending_sent` · `pending_received` · `suggested`

---

## 10. Key Frontend Behaviours to Replicate in Backend

| Behaviour | API needed |
|---|---|
| Booking approval auto-sends confirmation message | `POST /bookings/:id/approve` should create a message row |
| Booking approval marks date busy | Same endpoint should upsert an availability record |
| Accepting a cover request marks date busy | `POST /cover-requests/:id/accept` should upsert availability |
| Conversation frozen = no new messages | Check `is_frozen` before inserting message |
| Photographer cannot initiate conversation | Enforce `sender_role = client` on first message creation |
| Trust score recomputed after every sync | Cron job calls a score function and writes `photographer_profiles.trust_score` |
| Profile completeness score | Computed server-side using the weight table in §5, stored on profile |
| Admin suspend/ban blocks login | Auth middleware checks `users.status` |
| Support form sends to support inbox | Creates a `support_tickets` row; email notification via Resend |

---

## 11. File Map

```
app/
  (auth)/
    login/              → auth.signInWithPassword()
    signup/             → auth.signUp() + insert role
    forgot-password/    → auth.resetPasswordForEmail()
    reset-password/     → auth.updateUser()
  onboarding/
    page.tsx            → client onboarding (upsert users row)
    photographer/       → photographer onboarding (insert photographer_profiles)
  photographers/
    page.tsx            → GET /photographers (FTS, filters)
    [username]/         → GET /photographers/:username
  messages/
    page.tsx            → GET /conversations?client_id=me
    [slug]/             → GET /conversations/:slug + messages
    photographer/       → GET /conversations?photographer_id=me
  dashboard/
    client/             → GET /clients/me + bookings + notifications
    client/edit/        → PATCH /clients/me
    photographer/       → complex: profile + messages + requests + availability + packages + reviews + network + settings
    photographer/portfolio/ → GET/POST /albums + /photos

  admin/
    page.tsx            → GET /admin/stats
    analytics/          → GET /admin/analytics/clients + /photographers
    accounts/           → GET /admin/accounts, PATCH status
    conversations/      → GET /admin/conversations, PATCH frozen/flagged
    trust-health/       → GET /admin/trust-health, POST /admin/sync

components/
  availability-time-slots.tsx   → weekly schedule CRUD
  booking-request-modal.tsx     → POST /booking-requests
  message-gate.tsx              → POST /conversations (initiate)
  photographer-connections.tsx  → connections + groups + cover requests
  project-packages.tsx          → packages CRUD
  public-booking-section.tsx    → public-facing booking CTA
  review-manager.tsx            → GET/PATCH /reviews
  save-button.tsx               → POST/DELETE /saved-photographers
```

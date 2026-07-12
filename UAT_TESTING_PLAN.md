# TrueNorth Frames — Pre-Launch UAT Testing Plan

**Created:** 2026-07-11  
**Version:** 1.0  
**Environment:** Production (thetruenorthframes.com)  
**Tester:** Yogesh  
**Status:** Pre-Launch Final UAT

---

## How to Use This Document

- Work through each section top to bottom
- Mark each test: ✅ Pass | ❌ Fail | ⚠️ Partial | ➖ Skip (not applicable)
- For failures, note the exact error message or behaviour in the Notes column
- Complete all CRITICAL sections before launch; HIGH sections before first public users

---

## Section Index

1. [Authentication](#1-authentication)
2. [Onboarding — Client](#2-onboarding--client)
3. [Onboarding — Photographer](#3-onboarding--photographer)
4. [Client Dashboard](#4-client-dashboard)
5. [Photographer Dashboard](#5-photographer-dashboard)
6. [Public Photographer Profile](#6-public-photographer-profile)
7. [Booking / Contact Flow](#7-booking--contact-flow)
8. [Messaging](#8-messaging)
9. [Photographer Browse](#9-photographer-browse)
10. [Admin Panel](#10-admin-panel)
11. [Email Notifications](#11-email-notifications)
12. [In-App Notifications](#12-in-app-notifications)
13. [File Uploads & Storage](#13-file-uploads--storage)
14. [Middleware & Route Protection](#14-middleware--route-protection)
15. [Badge System](#15-badge-system)
16. [Trust Score Engine](#16-trust-score-engine)
17. [Cron Jobs](#17-cron-jobs)
18. [Edge Cases & Limits](#18-edge-cases--limits)

---

## 1. Authentication

### 1.1 Email/Password Signup — `/signup`

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 1.1.1 | Role pill selection | Click "Client" | Pill highlights; role stored | | |
| 1.1.2 | Role pill selection | Click "Photographer" | Pill highlights; role stored | | |
| 1.1.3 | No role selected | Fill all fields, leave role unselected, click submit | Submit blocked / inline error | | |
| 1.1.4 | Name fields required | Leave first name blank, submit | Blocked | | |
| 1.1.5 | Invalid email | Enter `notanemail`, submit | Email validation error shown | | |
| 1.1.6 | Already-registered email | Enter an email already in Supabase, submit | Friendly "already registered" message (not a 500) | | |
| 1.1.7 | Password strength meter | Type a password | 4-bar meter updates live; length ≥8, uppercase, number, special char each add a bar | | |
| 1.1.8 | Weak password blocked | Enter `abc123`, submit | Blocked; strength < 2 | | |
| 1.1.9 | Terms checkbox required | Leave unchecked, submit | Blocked | | |
| 1.1.10 | Double-submit guard | Click signup twice quickly | Second click no-ops; only one request sent | | |
| 1.1.11 | Signup as client — success | Complete form as client | → POST `/api/auth/register` → redirect `/onboarding` | | |
| 1.1.12 | Signup as photographer — success | Complete form as photographer | → redirect `/onboarding/photographer` | | |
| 1.1.13 | Welcome email | Sign up as new client | Receive `welcome_client` email | | |

### 1.2 Google OAuth Signup

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 1.2.1 | New Google user | Click "Sign up with Google"; complete OAuth | No `public.users` row yet → redirect to `/signup/role-select?email=…&full_name=…` | | |
| 1.2.2 | Role-select pre-fill | Arrive at role-select page | Email and full name pre-filled from OAuth | | |
| 1.2.3 | Select role → client | Choose client on role-select | → onboarding | | |
| 1.2.4 | Select role → photographer | Choose photographer on role-select | → photographer onboarding | | |
| 1.2.5 | "Not you?" button | Click "Not you?" on role-select | Signs out → redirects to `/login` | | |
| 1.2.6 | Returning Google user | Sign in with Google using existing account | → role-appropriate dashboard | | |

### 1.3 Email/Password Login — `/login`

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 1.3.1 | Valid login — client | Correct credentials for client | → `/dashboard/client` | | |
| 1.3.2 | Valid login — photographer (approved) | Correct credentials for approved photographer | → `/dashboard/photographer` | | |
| 1.3.3 | Valid login — admin | Correct admin credentials | → `/admin` | | |
| 1.3.4 | Wrong password | Incorrect password | Error message shown | | |
| 1.3.5 | Login lockout | 10 failed attempts | "Account locked for 15 minutes" shown | | |
| 1.3.6 | Lockout warning | 3 attempts remaining | Warning shown | | |
| 1.3.7 | Suspended account | Login with suspended user | Signs out; suspended message shown | | |
| 1.3.8 | Deactivated account | Login with deactivated user | Signs out; appropriate message shown | | |
| 1.3.9 | Rejected photographer | Login with rejected profile | Signs out; `?error=rejected` shown | | |
| 1.3.10 | Redirect param | Login with `?redirect=/dashboard/client/bookings` | After login, redirected to that path | | |
| 1.3.11 | Deleted account banner | Navigate to `/login?deleted=1` | Account deletion success banner shown | | |

### 1.4 Forgot Password — `/forgot-password`

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 1.4.1 | Invalid email | Submit without @ | Inline validation error | | |
| 1.4.2 | Valid email | Submit valid email | "Email sent" confirmation state shown | | |
| 1.4.3 | Try different email | Click "Try a different email" | Form resets | | |

### 1.5 Reset Password — `/reset-password`

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 1.5.1 | Valid reset link | Click link from email | `PASSWORD_RECOVERY` event fires; form shown | | |
| 1.5.2 | Expired / invalid link | Navigate to stale URL | 3-second timeout → "Link expired" screen | | |
| 1.5.3 | Weak new password | Enter password strength < 2 | Error shown; checklist visible | | |
| 1.5.4 | Confirm mismatch | Confirm doesn't match | Error shown | | |
| 1.5.5 | Successful reset | Valid matching passwords, submit | Signs out user after reset → redirects to login | | |

---

## 2. Onboarding — Client

### `/onboarding`

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 2.1 | Pre-fill from query params | Navigate with `?firstName=Jane&lastName=Doe` | Name fields pre-filled | | |
| 2.2 | No neighbourhood selected | Fill name, leave neighbourhood blank, submit | Blocked | | |
| 2.3 | Edmonton neighbourhood pill | Click one of 13 neighbourhood pills | Pill selected; submit enabled | | |
| 2.4 | "Other / Outside Edmonton" | Click "Other" | Free-text input appears | | |
| 2.5 | Other — empty text | Click Other, leave text blank, submit | Blocked | | |
| 2.6 | Submit — success | Fill name + neighbourhood, submit | POST `/api/onboarding/client` → redirect `/dashboard/client` | | |
| 2.7 | Skip for now | Click "Skip for now" | Goes directly to `/dashboard/client` without POST | | |

---

## 3. Onboarding — Photographer

### `/onboarding/photographer`

Priority: **CRITICAL**

**Step 1: Basics**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 3.1 | Display name required | Leave blank, click Next | Blocked | | |
| 3.2 | Bio minimum | Enter < 20 chars, click Next | Blocked | | |
| 3.3 | Bio maximum | Enter > 300 chars | Input stops / truncates at 300 | | |
| 3.4 | Area pill required | Skip area selection, click Next | Blocked | | |
| 3.5 | Starting rate — below minimum | Enter $10, click Next | Blocked ($50 minimum) | | |
| 3.6 | Starting rate — above maximum | Enter $1500, click Next | Blocked ($1000 maximum) | | |
| 3.7 | Years experience required | Skip, click Next | Blocked | | |
| 3.8 | Step 1 valid → Next | All fields filled | Advances to Step 2 | | |

**Step 2: Specialties**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 3.9 | Select specialties | Click up to 5 | Selections highlighted | | |
| 3.10 | 6th specialty blocked | Click 6th specialty | Greyed out / no action | | |
| 3.11 | Deselect | Click already-selected specialty | Deselects | | |

**Step 3: Online Presence**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 3.12 | GBP: Yes | Click Yes | GBP tip shown; "Do you have reviews?" sub-question appears | | |
| 3.13 | GBP: No | Click No | GBP creation tip shown | | |
| 3.14 | Website: Yes | Click Yes | URL input appears | | |
| 3.15 | Website: Yes — empty URL | Click Yes, leave URL blank, click Finish | Amber warning shown (not blocked) | | |

**Submission**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 3.16 | Finish → success | Click Finish with all valid | POST `/api/onboarding/photographer` → redirect `/dashboard/photographer?fresh=1` | | |
| 3.17 | Profile status after submit | Check Supabase | `profile_status = 'pending'` | | |
| 3.18 | Duplicate display name | Submit same display name as existing photographer | Username slug auto-incremented (e.g. `john-smith-2`) | | |
| 3.19 | Welcome email sent | Complete onboarding | Receive `welcome_photographer` email | | |
| 3.20 | Admin notification | Complete onboarding | Admin receives email about new pending photographer | | |
| 3.21 | Reload and resubmit | Reload page mid-onboarding, resubmit | No 500 / no duplicate row errors; idempotent | | |

---

## 4. Client Dashboard

### `/dashboard/client`

#### 4.1 General

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 4.1.1 | Notification badge | Have unread notifications | Badge count shown on bell | | |
| 4.1.2 | Badge cap | 100+ unread notifications | Badge shows "99+" | | |
| 4.1.3 | Mark all read | Click "Mark all read" | All notifications marked; badge clears | | |
| 4.1.4 | Polling | Sit on dashboard 30+ seconds | Notifications refresh without page reload | | |

#### 4.2 My Bookings

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 4.2.1 | Booking card — pending | View pending booking | Amber status indicator | | |
| 4.2.2 | Booking card — approved | View approved booking | Green status indicator | | |
| 4.2.3 | Booking card — cancellation_pending | View cancellation_pending | Orange status indicator | | |
| 4.2.4 | Booking card — completed | View completed booking | Blue status indicator | | |
| 4.2.5 | Booking card — declined/cancelled | View declined booking | Red/grey + dimmed card | | |
| 4.2.6 | Cancel pending booking | Click cancel on pending booking | Reason picker shown (5 presets + Other textarea) | | |
| 4.2.7 | Cancel — no reason selected | Submit cancel without reason | Blocked | | |
| 4.2.8 | Cancel pending — confirmed | Select reason, confirm | Status → `cancelled` immediately; photographer emailed | | |
| 4.2.9 | Cancel approved — request | Click cancel on approved booking | Warning shown; status → `cancellation_pending`; row in `booking_cancellation_requests`; photographer emailed | | |
| 4.2.10 | Leave review — available | Completed booking, not yet reviewed | "Leave review" button shown | | |
| 4.2.11 | Leave review — already reviewed | Completed booking already reviewed | "Leave review" button hidden | | |

#### 4.3 Review Flow

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 4.3.1 | Step 1 — star rating required | Proceed without selecting stars | Blocked | | |
| 4.3.2 | Sub-ratings optional | Leave sub-ratings blank, proceed | Allowed | | |
| 4.3.3 | Sub-ratings value range | Enter sub-rating 0 or 6 | Rejected (must be 1–5 if provided) | | |
| 4.3.4 | Step 2 — skip note | Click "Skip and submit" | Review submitted without body text | | |
| 4.3.5 | Step 2 — body max | Enter > 1500 chars | Input stops / truncates | | |
| 4.3.6 | Submit review | Complete both steps | POST `/api/client/reviews`; photographer emailed `review_received` | | |
| 4.3.7 | Duplicate review blocked | Try to review same booking again | Blocked | | |
| 4.3.8 | Client reply to photographer | When photographer has replied, `clientReply` is null | Reply input shown | | |
| 4.3.9 | Client reply — one time only | After client replies | Reply input hidden | | |

#### 4.4 Saved Photographers

Priority: **MEDIUM**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 4.4.1 | View saved | Open saved section | Saved photographer cards displayed | | |
| 4.4.2 | Unsave | Click unsave | DELETE `/api/client/saved`; card removed | | |

#### 4.5 Support Widget

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 4.5.1 | No category selected | Submit without category | Blocked | | |
| 4.5.2 | Invalid category | Try to POST invalid category value | API returns 400 | | |
| 4.5.3 | Description too short | Enter very short message, submit | Blocked | | |
| 4.5.4 | Valid submission | Select category + type message, submit | POST `/api/admin/support`; admin email sent; success state shown | | |

#### 4.6 Delete Account

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 4.6.1 | Wrong confirmation text | Type "delete" (lowercase), click confirm | Submit blocked | | |
| 4.6.2 | Correct confirmation | Type exactly "DELETE", confirm | POST `/api/account/delete`; `account_status=deactivated`; signs out; → `/login?deleted=1` | | |
| 4.6.3 | Photographer delete — profile banned | Delete photographer account | `photographer_profiles.profile_status = 'banned'` | | |

---

## 5. Photographer Dashboard

### `/dashboard/photographer`

#### 5.1 Overview

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.1.1 | Fresh onboarding banner | Navigate with `?fresh=1` | Welcome or profile-completion prompt shown | | |
| 5.1.2 | Pending approval state | Photographer with `profile_status=pending` | Pending approval notice visible | | |

#### 5.2 Portfolio Tab

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.2.1 | Upload photo — valid | Select JPEG/PNG/WebP ≤ 5MB | Upload succeeds; photo appears in grid | | |
| 5.2.2 | Upload photo — non-image | Select PDF, submit | Rejected; error shown | | |
| 5.2.3 | Upload photo — over 5MB | Select 6MB image | Rejected | | |
| 5.2.4 | Photo limit (150) | Upload when at 150 photos | Error: max 150 photos | | |
| 5.2.5 | Upload video | Select MP4 ≤ 100MB | Upload succeeds | | |
| 5.2.6 | Video limit (3) | Upload 4th video | Blocked | | |
| 5.2.7 | Create album | Click create album, enter name | Album created | | |
| 5.2.8 | Album limit (3) | Create 4th album | Blocked | | |
| 5.2.9 | Album name max | Enter > 120 chars for album name | Truncated / blocked | | |
| 5.2.10 | Photo in album | Upload photo with album selected | Photo appears in album | | |
| 5.2.11 | Videos per album (2) | Add 3rd video to an album | Blocked | | |
| 5.2.12 | Delete photo | Click delete on photo | R2 object deleted; `storage_assets` row deleted; photo removed from grid | | |
| 5.2.13 | Caption | Add caption ≤ 255 chars | Caption saved | | |
| 5.2.14 | Caption max | Enter > 255 chars | Truncated / blocked | | |
| 5.2.15 | Storage meter | View portfolio tab | Shows usage breakdown (photos, videos, profile, messages) vs 500MB | | |
| 5.2.16 | Over quota | Attempt upload when at 500MB | Error shown; upload blocked | | |

#### 5.3 Booking Requests Tab

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.3.1 | View requests | Open requests tab | All bookings shown with client name, date, status, package | | |
| 5.3.2 | Filter by status | Use status filter | List filters correctly | | |
| 5.3.3 | Expand booking | Click expand/card | Full details: description, time slot, location, package price | | |
| 5.3.4 | Approve booking | Click Approve | PATCH status=approved; client gets in-app notification + `booking_confirmed` email | | |
| 5.3.5 | Decline booking | Click Decline | status=declined; client notified + `booking_declined` email | | |
| 5.3.6 | Complete booking | Click Complete | status=completed; `completed_at` set; client gets `booking_completed` email; review enabled for client | | |
| 5.3.7 | Cancel booking | Click Cancel | status=cancelled; client gets `booking_cancellation_confirmed` email | | |
| 5.3.8 | Photographer note | Add note before status change | `photographer_note` included in client email | | |
| 5.3.9 | Cancellation_pending resolution | Handle client cancellation request | Can approve or deny the cancellation | | |

#### 5.4 Packages Tab

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.4.1 | Create package — valid | Fill all required fields | POST `/api/photographer/packages`; package appears | | |
| 5.4.2 | Name required | Leave name blank, submit | Blocked | | |
| 5.4.3 | Name max (120 chars) | Enter > 120 chars | Truncated / blocked | | |
| 5.4.4 | Description max (800 chars) | Enter > 800 chars | Truncated / blocked | | |
| 5.4.5 | Price required | Leave price blank, submit | Blocked | | |
| 5.4.6 | Billing type required | Leave blank | Blocked | | |
| 5.4.7 | Package limit (3) | Create 4th package | Blocked | | |
| 5.4.8 | Edit package | Update name and price | Changes saved | | |
| 5.4.9 | Toggle active | Click is_active toggle | Package hides/shows on public profile | | |
| 5.4.10 | Toggle popular | Click is_popular | "Most popular" badge shown/hidden | | |
| 5.4.11 | Delete package | Click delete | Package removed | | |
| 5.4.12 | Upload banner — valid | Upload image ≤ 5MB | Banner saved to R2; shown on package card | | |
| 5.4.13 | Upload banner — new package | Set banner during package creation | Banner uploaded after real ID obtained; shown correctly | | |
| 5.4.14 | Replace banner | Upload new banner when one exists | Old R2 object deleted; new banner shown | | |
| 5.4.15 | Remove banner | Click remove banner | `banner_url=null`; R2 object deleted | | |

#### 5.5 Availability Tab

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.5.1 | Set weekly schedule | Add time slot for Monday | POST; slot saved; shown in calendar | | |
| 5.5.2 | Clear a day | Remove all slots for a day | Slots for that day deleted | | |
| 5.5.3 | Day override — available | Set specific date as available | PATCH; shown as green on client calendar | | |
| 5.5.4 | Day override — busy | Set specific date as busy | PATCH; shown as red on client calendar | | |
| 5.5.5 | Day override — tentative | Set specific date as tentative | PATCH; shown as amber on client calendar | | |
| 5.5.6 | Remove day override | Click remove | DELETE; day reverts to weekly schedule | | |
| 5.5.7 | Past dates excluded | View availability calendar | Only future dates shown | | |

#### 5.6 Reviews Tab

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.6.1 | View reviews | Open reviews tab | All reviews listed with client name, rating, body, sub-ratings | | |
| 5.6.2 | Reply to review | Type reply, submit | `public_reply` saved; client notified in-app + `review_reply` email | | |
| 5.6.3 | Blank reply | Submit empty reply | `public_reply` nulled (no crash) | | |
| 5.6.4 | Private note | Add private note | Saved as `private_note`; not client-visible | | |
| 5.6.5 | Flag review | Click flag + enter reason | `flag_status=flagged`; support ticket auto-created for admin | | |
| 5.6.6 | Unflag review | Click unflag | `flag_status` reset | | |

#### 5.7 FAQ Tab

Priority: **MEDIUM**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.7.1 | Add FAQ — valid | Enter question + answer | POST; FAQ appears | | |
| 5.7.2 | Question required | Leave question blank | Blocked | | |
| 5.7.3 | Answer required | Leave answer blank | Blocked | | |
| 5.7.4 | Question max (160 chars) | Enter > 160 chars | Truncated / blocked | | |
| 5.7.5 | Answer max (600 chars) | Enter > 600 chars | Truncated / blocked | | |
| 5.7.6 | FAQ limit (5) | Add 6th FAQ | Blocked | | |
| 5.7.7 | Toggle published | Click toggle | `is_published` updated | | |
| 5.7.8 | Delete FAQ | Click delete | FAQ removed | | |

#### 5.8 Settings Tab

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.8.1 | Edit basics | Update display_name, bio, rate | Changes saved via PATCH section=basics | | |
| 5.8.2 | Display name required | Clear display_name, save | Blocked | | |
| 5.8.3 | `users.full_name` updated | Edit display name | `users.full_name` also updated | | |
| 5.8.4 | Edit specialties | Add/remove specialties | PATCH section=specialties | | |
| 5.8.5 | Specialties max (5) | Try to add 6th specialty | Blocked | | |
| 5.8.6 | Upload avatar — valid | Select JPEG/PNG/WebP ≤ 3MB | Avatar updates on profile and in `users` table | | |
| 5.8.7 | Upload avatar — wrong MIME | Select PDF | Rejected | | |
| 5.8.8 | Upload avatar — over 3MB | Select 4MB image | Rejected | | |
| 5.8.9 | Delete avatar | Click remove | `avatar_url=null` in both tables | | |
| 5.8.10 | Upload cover | Select image ≤ 8MB | Cover saved | | |
| 5.8.11 | Edit platform links | Update Google Business URL | Saved; shown on profile | | |
| 5.8.12 | Clear platform link | Empty URL, save | Link removed | | |

#### 5.9 Trust Tab

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.9.1 | View trust breakdown | Open trust tab | trust_score, last_sync_at, connected platforms, pillar scores shown | | |
| 5.9.2 | No GBP connected | View trust when no GBP | trust_score=0; trust card not shown on public profile | | |
| 5.9.3 | Manual sync | Click "Sync now" | POST `/api/photographer/trust`; score recalculated | | |
| 5.9.4 | Sync notification | Score changes after sync | In-app notification sent | | |
| 5.9.5 | No change sync | Score unchanged | No notification sent | | |

#### 5.10 Network Tab

Priority: **MEDIUM**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 5.10.1 | View connections | Open network tab | Connected, pending (sent/received), suggested shown | | |
| 5.10.2 | Send connection request | Click connect on suggested | POST action=connect; target notified | | |
| 5.10.3 | Accept request | Click accept on pending_received | POST action=accept; requester notified | | |
| 5.10.4 | Decline request | Click decline | POST action=decline; no notification sent | | |
| 5.10.5 | Cancel sent request | Click cancel on pending_sent | POST action=cancel | | |
| 5.10.6 | Disconnect | Click disconnect | Both-direction removal | | |
| 5.10.7 | Create group | Enter name + emoji | POST `/api/photographer/groups`; group created | | |
| 5.10.8 | Group limit (2 owned) | Create 3rd owned group | Blocked | | |
| 5.10.9 | Invite to group | Select connected photographer | Invite sent | | |
| 5.10.10 | Accept group invite | Click accept | Becomes member | | |
| 5.10.11 | Leave group (non-owner) | Click leave | Soft-leave; `left_at` set; history still visible | | |
| 5.10.12 | Delete group (owner) | Click delete | Messages, members, invites all hard-deleted | | |
| 5.10.13 | Remove member (owner) | Click remove member | `removed_at` set | | |
| 5.10.14 | Remove member (non-owner) | Attempt as non-owner | 403 returned | | |
| 5.10.15 | Group message | Type + send | Max 1000 chars; max 30/hour per sender | | |
| 5.10.16 | Group rate limit | Send 31st group message in an hour | Blocked | | |
| 5.10.17 | Block photographer | Block from network | POST `/api/photographer/connections/block`; one-directional | | |

---

## 6. Public Photographer Profile

### `/photographers/[username]`

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 6.1 | Page loads | Navigate to profile URL | Cover image, avatar, badge, tagline, location, years experience, member since, rate, specialties shown | | |
| 6.2 | Portfolio grid | View photos | Albums, standalone photos, videos all displayed | | |
| 6.3 | Lightbox | Click a photo | Fullscreen overlay opens | | |
| 6.4 | Lightbox keyboard nav | Press ← → Escape in lightbox | Navigate photos; Escape closes | | |
| 6.5 | Album drill-down | Click album | Photos in album shown with breadcrumb | | |
| 6.6 | Package cards | View packages section | Price, billing type, deliverables shown | | |
| 6.7 | Inactive package | Set package is_active=false | Package NOT shown on public profile | | |
| 6.8 | Most popular badge | Set is_popular=true on a package | "Most popular" badge shown | | |
| 6.9 | Availability strip | View availability section | 7-day strip: green=available, amber=tentative, red=busy | | |
| 6.10 | Reviews section | View reviews | Star breakdown, sub-ratings, photographer reply, client reply-to-reply shown | | |
| 6.11 | FAQ accordion | Click FAQ question | Answer expands | | |
| 6.12 | Trust card — GBP connected | View profile with GBP linked | Trust card shown with rating, review count, score | | |
| 6.13 | Trust card — no GBP | View profile without GBP | Trust card NOT shown | | |
| 6.14 | Trust score color — green | Score ≥ 90 | Green indicator | | |
| 6.15 | Trust score color — blue | Score 75–89 | Blue indicator | | |
| 6.16 | Social links | View sidebar | Instagram, Facebook, website links shown when set | | |
| 6.17 | Save profile — logged in | Click heart | Profile saved; heart fills | | |
| 6.18 | Unsave profile | Click filled heart | Profile unsaved | | |
| 6.19 | Save — not logged in | Click heart when logged out | Redirect to login | | |
| 6.20 | Request booking CTA | Click "Request a booking" | ContactModal opens | | |

---

## 7. Booking / Contact Flow

### ContactModal

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 7.1 | Unauthenticated guard | Open modal without login | Sign-in prompt shown; draft saved to localStorage | | |
| 7.2 | Draft saved | Trigger sign-in prompt; copy draft key from localStorage | Draft has 2-hour expiry timestamp | | |
| 7.3 | Draft restored | Log in after seeing sign-in prompt | Draft auto-restored in modal | | |
| 7.4 | Draft expiry | Wait 2 hours; return | Draft NOT auto-submitted (expired) | | |
| 7.5 | Photographer self-view | Photographer views own profile | "Your own profile" block shown; cannot book | | |
| 7.6 | Photographer tries to book | Photographer views another photographer | "Account type" block shown; cannot book | | |
| 7.7 | Calendar navigation | Click next month | Can navigate up to 4 months ahead | | |
| 7.8 | Calendar cap | Try to navigate to 5th month ahead | Blocked | | |
| 7.9 | Single date selection | Tap one date | Start date set | | |
| 7.10 | Date range selection | Tap start, then tap end | Range highlighted | | |
| 7.11 | Invalid range | Select end date ≤ start | Server drops end date; treats as single day | | |
| 7.12 | Busy day warning | Select range overlapping busy days | Warning shown inline | | |
| 7.13 | Availability color coding | View calendar | Green=available, amber=tentative, red=busy | | |
| 7.14 | Package pre-selection | Click "Book This Package" on a specific package | Modal opens with package pre-selected | | |
| 7.15 | Time slot required | Skip time slot, submit | Blocked | | |
| 7.16 | Message required | Leave message blank, submit | Blocked | | |
| 7.17 | Message max (600 chars) | Enter > 600 chars | Truncated / blocked | | |
| 7.18 | Location note max (255 chars) | Enter > 255 chars | Truncated / blocked | | |
| 7.19 | Submit — success | Fill all required fields, submit | POST `/api/client/bookings`; photographer notified; success state shown | | |
| 7.20 | Success state | After submit | "Go to conversation" button shown | | |
| 7.21 | Unapproved photographer | Submit booking to non-approved photographer | 422 "not currently accepting bookings" | | |
| 7.22 | Escape to close | Press Escape | Modal closes | | |

---

## 8. Messaging

### Client Messages — `/messages`

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 8.1 | Conversation list | Open `/messages` | All conversations listed with unread badges | | |
| 8.2 | Open conversation | Click conversation | Messages load; booking card shown as first message | | |
| 8.3 | Send message | Type and send | POST; message appears in thread | | |
| 8.4 | Message max (1000 chars) | Enter > 1000 chars | Truncated / blocked | | |
| 8.5 | Rate limit — warning | Send 17th message in an hour | Warning shown (3 remaining) | | |
| 8.6 | Rate limit — hard block | Send 21st message in an hour | Blocked; error shown | | |
| 8.7 | Attach image | Select image ≤ 10MB | Presigned upload; image appears in thread | | |
| 8.8 | Attach video | Select video ≤ 50MB | Presigned upload; video shown | | |
| 8.9 | Attach PDF | Select PDF ≤ 15MB | Presigned upload; PDF shown | | |
| 8.10 | Attachment — over size | Select 11MB image | Rejected | | |
| 8.11 | Attachment — wrong type | Select .exe file | Rejected | | |
| 8.12 | Private attachment URL | Click attachment in conversation | Signed URL (6-hour expiry) opens file | | |
| 8.13 | Report spam | Click report on message | POST creates support ticket (spam_report); conversation flagged | | |
| 8.14 | Auto-suspend threshold | 3 unique client reports on same photographer | Photographer auto-suspended | | |
| 8.15 | Block photographer | Click block | `client_blocks` row created; one-directional | | |
| 8.16 | Unblock photographer | Unblock action | `client_blocks` row deleted | | |

---

## 9. Photographer Browse

### `/photographers`

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 9.1 | Browse page loads | Navigate to `/photographers` | Approved photographers listed (20 per page) | | |
| 9.2 | Pending photographer absent | Check profile_status=pending | NOT shown in browse results | | |
| 9.3 | Filter by specialty | Click specialty chip | Filtered results shown | | |
| 9.4 | Search | Type photographer name | Matching results shown | | |
| 9.5 | Pagination | Click next page | Next 20 results load | | |
| 9.6 | Photographer self-redirect | Photographer navigates to `/photographers/your-profile` (own slug) | Redirected to own public profile | | |

---

## 10. Admin Panel

### 10.1 Admin Login — `/admin/login`

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 10.1.1 | Admin login | Admin credentials | Access to `/admin` | | |
| 10.1.2 | Non-admin at admin routes | Client tries `/admin` | Redirected to `/admin/login` | | |
| 10.1.3 | Admin at client dashboard | Admin visits `/dashboard/client` | Redirected to `/admin` | | |

### 10.2 Dashboard — `/admin`

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 10.2.1 | Stats load | Open dashboard | User counts, booking counts, review counts shown | | |

### 10.3 Accounts — `/admin/accounts`

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 10.3.1 | List users | View accounts | Paginated list (20/page) with role filter + name search | | |
| 10.3.2 | Photographer row | View photographer account | profile_status, trust_score, native_avg_rating shown | | |
| 10.3.3 | Approve photographer | Click Approve | `profile_status=approved`; in-app notification + `photographer_approved` email sent | | |
| 10.3.4 | Reject photographer | Click Reject + enter reason | `profile_status=rejected`; all sessions revoked; `photographer_rejected` email with reason sent | | |
| 10.3.5 | Reject — empty reason | Submit rejection without reason | Allowed (reason is optional) | | |
| 10.3.6 | Suspend account | Click Suspend | `account_status=suspended`; photographer emailed | | |
| 10.3.7 | Unsuspend account | Click Unsuspend | `account_status=active` | | |
| 10.3.8 | Suspended user login | Attempt login while suspended | Signs out via middleware | | |

### 10.4 Support Tickets — `/admin/support`

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 10.4.1 | List tickets | View support | Tickets with status/role filter + search | | |
| 10.4.2 | Resolve ticket | Change status to resolved + add note | `resolved_at` set; submitter gets `support_ticket_resolved` email with note | | |
| 10.4.3 | Close ticket | Change to closed | Status updated | | |
| 10.4.4 | In-review status | Change to in_review | Status updated | | |

### 10.5 Review Moderation

Priority: **HIGH**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 10.5.1 | View flagged review | Click review | Full review details + flag reason shown | | |
| 10.5.2 | Remove review | Click Remove | `flag_status=flag_resolved`; hidden from public profile; linked support ticket auto-resolved; photographer gets `review_removed` email | | |
| 10.5.3 | Dismiss flag | Click Dismiss | Flag cleared; review stays visible; photographer gets `review_dismissed` email | | |

### 10.6 Trust Health — `/admin/trust-health`

Priority: **MEDIUM**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 10.6.1 | Overview loads | Open page | Overall status, profilesWithTrustData, avgCompositeScore shown | | |
| 10.6.2 | Per-platform detail | View Google section | profilesLinked, avgRating, totalReviews, last 5 sync logs shown | | |
| 10.6.3 | Admin trigger sync | POST `/api/admin/trust-sync` | Sync runs for all GBP-linked photographers | | |

---

## 11. Email Notifications

Priority: **HIGH**  
Test each by triggering the action and checking the recipient's inbox.

| # | Template | Trigger | Recipient | Result | Notes |
|---|----------|---------|-----------|--------|-------|
| 11.1 | `welcome_client` | Client signup complete | Client | | |
| 11.2 | `welcome_photographer` | Photographer onboarding complete | Photographer | | |
| 11.3 | `booking_received` | Client submits booking request | Photographer | | |
| 11.4 | `new_conversation` | First booking (no prior conversation) | Photographer | | |
| 11.5 | `booking_confirmed` | Photographer approves booking | Client | | |
| 11.6 | `booking_declined` | Photographer declines booking | Client | | |
| 11.7 | `booking_completed` | Photographer marks completed | Client | | |
| 11.8 | `booking_cancelled_by_client` | Client cancels booking | Photographer | | |
| 11.9 | `booking_cancellation_confirmed` | Photographer cancels booking | Client | | |
| 11.10 | `booking_reminder_client` | Cron: 1 day before session | Client | | |
| 11.11 | `booking_reminder_photographer` | Cron: 1 day before session | Photographer | | |
| 11.12 | `review_received` | Client submits review | Photographer | | |
| 11.13 | `review_reply` | Photographer replies to review | Client | | |
| 11.14 | `support_ticket_created` | Any user submits support ticket | Admin | | |
| 11.15 | `support_ticket_resolved` | Admin resolves ticket | Submitter | | |
| 11.16 | `photographer_approved` | Admin approves photographer | Photographer | | |
| 11.17 | `photographer_suspended` | Admin suspends account | Photographer | | |
| 11.18 | `photographer_rejected` | Admin rejects photographer | Photographer | | |
| 11.19 | `review_removed` | Admin removes flagged review | Photographer | | |
| 11.20 | `review_dismissed` | Admin dismisses flag | Photographer | | |

**For each email, verify:**
- Correct recipient address
- Subject line is correct and personalised
- First name, dates, photographer/client name all rendering correctly
- No broken layout (check on mobile too)
- Footer with support link present
- Email failure does NOT block the primary action (booking, review, etc.)

---

## 12. In-App Notifications

Priority: **HIGH**

| # | Event | Expected Notification | Result | Notes |
|---|-------|-----------------------|--------|-------|
| 12.1 | Client submits booking | Photographer: `booking_request` | | |
| 12.2 | Photographer approves | Client: `booking_approved` | | |
| 12.3 | Photographer declines | Client: `booking_declined` | | |
| 12.4 | Photographer marks complete | Client: `booking_completed` | | |
| 12.5 | Photographer or client cancels | Client: `booking_cancelled` | | |
| 12.6 | Admin approves photographer | Photographer: `profile_approved` | | |
| 12.7 | Connection request sent | Target photographer: `connection_request` | | |
| 12.8 | Connection accepted | Requester: `connection_accepted` | | |
| 12.9 | Photographer replies to review | Client: `review_reply` | | |
| 12.10 | Trust score changes after sync | Photographer: `trust_score_updated` | | |
| 12.11 | Trust score unchanged | No notification sent | | |
| 12.12 | Notification failure | Primary action (booking, review) still succeeds | | |
| 12.13 | 30-day expiry | Notifications > 30 days old not shown in active list | | |

---

## 13. File Uploads & Storage

Priority: **CRITICAL**

| # | Test | Steps | Expected | Result | Notes |
|---|------|-------|----------|--------|-------|
| 13.1 | CORS preflight — portfolio upload | Upload portfolio photo | No CORS 403; upload succeeds | | |
| 13.2 | CORS preflight — message attachment | Attach file in message | No CORS 403; upload succeeds | | |
| 13.3 | Quota tracking | Upload photo | `storage_assets` row created with correct `size_bytes` | | |
| 13.4 | Quota check | GET storage meter | Correct total shown; matches sum of `storage_assets` where `orphan_expires_at IS NULL` | | |
| 13.5 | Orphan window — 1 hour | Start upload, close tab before completion | `orphan_expires_at = now + 1hr` set in `storage_assets` | | |
| 13.6 | Orphan cron | Run cron after 1 hour | Orphaned R2 objects deleted; rows removed | | |
| 13.7 | Presigned URL — expiry | Wait 15+ minutes after getting presigned URL, attempt upload | Upload fails (URL expired) | | |
| 13.8 | Private attachment URL | View message attachment | 6-hour signed URL generated; file loads | | |
| 13.9 | Public asset URLs | View portfolio photo | Served via `R2_PUBLIC_URL/key` | | |
| 13.10 | R2 cleanup on delete | Delete portfolio photo | R2 object and `storage_assets` row both removed | | |
| 13.11 | R2 cleanup on banner replace | Replace package banner | Old R2 object deleted | | |
| 13.12 | 500MB limit | Try to upload when at 500MB | Upload blocked with clear error message | | |

---

## 14. Middleware & Route Protection

Priority: **CRITICAL**

| # | Scenario | Expected | Result | Notes |
|---|----------|----------|--------|-------|
| 14.1 | Unauthenticated → `/dashboard/*` | Redirect to `/login?redirect=pathname` | | |
| 14.2 | Unauthenticated → `/admin/accounts` | Redirect to `/admin/login` | | |
| 14.3 | Unauthenticated → public pages | Allowed through | | |
| 14.4 | Client → `/dashboard/photographer` | Redirect to `/dashboard/client` | | |
| 14.5 | Photographer → `/dashboard/client` | Redirect to `/dashboard/photographer` | | |
| 14.6 | Admin → `/dashboard/client` | Redirect to `/admin` | | |
| 14.7 | Suspended user → any protected route | `forceSignOut` called; session cleared | | |
| 14.8 | Deactivated user → any protected route | `forceSignOut` called | | |
| 14.9 | Rejected photographer → any protected route | `forceSignOut` called | | |
| 14.10 | Logged-in user → `/login` | Redirect to role-appropriate dashboard | | |
| 14.11 | Logged-in user → `/signup` | Redirect to role-appropriate dashboard | | |
| 14.12 | No `public.users` row → `/dashboard/*` | Redirect to `/login?error=setup_incomplete` | | |
| 14.13 | Logo click — limbo state | User authenticated but no DB row; click logo | Goes to `/` (no redirect loop) | | |

---

## 15. Badge System

Priority: **MEDIUM**

| # | Badge | Criteria | Test | Result | Notes |
|---|-------|----------|------|--------|-------|
| 15.1 | Newly Joined | Default for new photographers | New photographer profile → "Newly Joined" badge shown on profile | | |
| 15.2 | Rising Talent | 5+ portfolio photos + ≥60% profile completeness | Upload 5 photos, fill profile → badge upgrades | | |
| 15.3 | Verified Pro | GBP OAuth connected (`is_active=true` in `platform_oauth_tokens`) | Connect GBP via OAuth → "Verified Pro" badge | | |
| 15.4 | Trusted Pro | 3+ completed bookings + native avg rating ≥ 4.0 | Complete 3 bookings + receive ≥4.0 avg → "Trusted Pro" | | |
| 15.5 | Badge on public profile | View profile after badge earned | Correct badge icon and label shown | | |
| 15.6 | Badge on browse cards | View browse results | Badge shown on photographer card | | |

---

## 16. Trust Score Engine

Priority: **MEDIUM**

| # | Scenario | Expected | Result | Notes |
|---|----------|----------|--------|-------|
| 16.1 | No GBP connected | trust_score = 0; trust card hidden on public profile | | |
| 16.2 | GBP connected, minimal signals | BASE_SCORE = 75 | | |
| 16.3 | GBP connected, high rating + many reviews | Score approaches 100 | | |
| 16.4 | Score ≥ 90 | Green indicator on public profile | | |
| 16.5 | Score 75–89 | Blue indicator on public profile | | |
| 16.6 | Pillar breakdown | GET `/api/photographer/trust` | platform, reviews, activity, verification pillar scores returned | | |
| 16.7 | Stale sync (>8 days) | Check `last_trust_sync_at` | Sync triggered on next scheduled run | | |

---

## 17. Cron Jobs

Priority: **HIGH**  
Test by calling endpoints with correct `CRON_SECRET`.

| # | Job | How to Test | Expected | Result | Notes |
|---|-----|-------------|----------|--------|-------|
| 17.1 | Booking reminder | Create approved booking for tomorrow; trigger `/api/cron/booking-reminder` | `booking_reminder_client` + `booking_reminder_photographer` emails queued | | |
| 17.2 | Booking reminder — auth | Call without `CRON_SECRET` | 401 returned | | |
| 17.3 | Orphan asset cleanup | Create orphaned asset (start upload, abandon); wait 1hr; trigger `/api/cron/orphan-assets` | R2 object deleted; row removed | | |
| 17.4 | Orphan cron — R2 delete failure | Force R2 delete to fail for one object | Row still deleted; no crash; error logged | | |
| 17.5 | Email flush | Trigger `/api/cron/email` | Queued emails sent; no duplicate sending | | |
| 17.6 | Email flush — auth | Call without `CRON_SECRET` | 401 returned | | |

---

## 18. Edge Cases & Platform Limits

Priority: **HIGH**

| # | Scenario | Test | Expected | Result | Notes |
|---|----------|------|----------|--------|-------|
| 18.1 | Concurrent booking creation | Submit two booking requests simultaneously from same client to same photographer | No duplicate conversations created (upsert logic) | | |
| 18.2 | Booking end date ≤ start date | Submit booking where end ≤ start | Server stores `null` for end date; no error | | |
| 18.3 | Idempotent onboarding | POST `/api/auth/register` with duplicate user_id | 23505 treated as success; no crash | | |
| 18.4 | Email delivery failure | Kill Resend API key temporarily; trigger email | Primary action (booking etc.) still succeeds | | |
| 18.5 | Notification failure | Drop notifications table access; trigger notify | Primary action still succeeds (fire-and-forget) | | |
| 18.6 | Rate limit warning threshold | Send 18th client message in an hour | Warning shown ("3 remaining") | | |
| 18.7 | Private R2 URL expiry | Get signed attachment URL; wait 6+ hours | URL returns 403; UI should re-fetch | | |
| 18.8 | Group owned-group cap bypass | Cover groups (cover requests) | Do NOT count toward the 2-group owned limit | | |
| 18.9 | Client reply — one time only | Photographer replied to review; client replied; view again | Reply input no longer shown | | |
| 18.10 | Portfolio photo deletion | Delete photo | R2 object AND `storage_assets` row both removed | | |
| 18.11 | Group hard delete cascade | Owner deletes group | Messages → Members → Invites → Group row all deleted; system message posted first | | |
| 18.12 | Admin email fallback | Remove `ADMIN_EMAIL` env var | Falls back to hardcoded address | | |
| 18.13 | Password reset rate limit | Submit > 3 reset requests in an hour | Supabase rate limits; friendly message | | |
| 18.14 | Session expiry (7 days) | Leave session idle 7+ days | User must re-login; no silent errors | | |
| 18.15 | XSS in contact form | Submit `<script>alert(1)</script>` in name field | Rendered as `&lt;script&gt;...` in support email | | |
| 18.16 | Booking to non-approved photographer | API POST with photographer in pending status | 422 "not currently accepting bookings" | | |
| 18.17 | Deactivated photographer — existing bookings | Delete photographer account | Existing bookings not auto-cancelled; status manually managed | | |

---

## Platform Configuration Limits Reference

| Config | Limit | Enforced At |
|--------|-------|-------------|
| Bio max (photographer) | 1200 chars | Profile edit |
| Message max length | 1000 chars | Send message |
| Client→photographer messages/hour | 20 | Message send |
| Group messages/hour per sender | 30 | Group message |
| FAQs per photographer | 5 | FAQ add |
| Albums per photographer | 3 | Album create |
| Photos per photographer | 150 | Photo upload |
| Videos per photographer | 3 | Video upload |
| Videos per album | 2 | Album video |
| Storage per photographer | 500 MB | Any upload |
| Packages per photographer | 3 | Package create |
| Owned groups per photographer | 2 | Group create |
| Booking window (max advance) | 90 days | ContactModal calendar |
| Login lockout threshold | 10 failed attempts | Login page |
| Login lockout duration | 15 minutes | Login page |
| Password reset rate limit | 3 per hour | Forgot password |
| Spam auto-suspend threshold | 3 unique client reports | Report flow |
| Presigned upload URL expiry | 15 minutes | R2 presign |
| Private attachment URL expiry | 6 hours | Message attachment |
| Notification expiry | 30 days | Notification list |
| Orphan asset window | 1 hour | Storage upload |

---

## UAT Sign-Off

| Section | Priority | Tester | Date | Status |
|---------|----------|--------|------|--------|
| 1. Authentication | CRITICAL | | | |
| 2. Client Onboarding | CRITICAL | | | |
| 3. Photographer Onboarding | CRITICAL | | | |
| 4. Client Dashboard | CRITICAL | | | |
| 5. Photographer Dashboard | CRITICAL | | | |
| 6. Public Profile | CRITICAL | | | |
| 7. Booking / Contact Flow | CRITICAL | | | |
| 8. Messaging | CRITICAL | | | |
| 9. Photographer Browse | HIGH | | | |
| 10. Admin Panel | CRITICAL | | | |
| 11. Email Notifications | HIGH | | | |
| 12. In-App Notifications | HIGH | | | |
| 13. File Uploads & Storage | CRITICAL | | | |
| 14. Middleware & Route Protection | CRITICAL | | | |
| 15. Badge System | MEDIUM | | | |
| 16. Trust Score Engine | MEDIUM | | | |
| 17. Cron Jobs | HIGH | | | |
| 18. Edge Cases & Limits | HIGH | | | |

**Launch Decision:** ☐ All CRITICAL sections passed — ready to launch  
**Signed off by:** _______________  
**Date:** _______________

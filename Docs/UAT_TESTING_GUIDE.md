# TrueNorth Frames — Complete UAT Testing Guide
**Platform:** thetruenorthframes.com
**Date:** June 2026
**Roles Covered:** Client · Photographer · Photographer ↔ Photographer · Admin

---

## How to Use This Guide

Each test has:
- **Steps** — exactly what to do
- **Expected Result** — what should happen
- **Pass / Fail** — tick when done

Use a fresh incognito window for each role. Wipe test data between full runs using `supabase/wipe_test_data.sql`.

---

---

# ROLE 1 — CLIENT

---

## 1.1 Sign Up (Email)

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/signup` | Sign-up form loads with email, password, first name, last name fields | |
| 2 | Fill in all fields, submit | Confirmation email sent; page shows "check your email" message | |
| 3 | Click the confirmation link in email | Redirected to `/signup/role-select` with name pre-filled | |
| 4 | Select **Client**, click Continue | Redirected to `/onboarding` | |
| 5 | Fill in first name, last name, location, submit | Redirected to `/dashboard/client` | |
| 6 | Check inbox | Welcome email received from **TrueNorth Frames** (not "hello") | |

---

## 1.2 Sign Up (Google OAuth)

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/login`, click **Continue with Google** | Google sign-in popup/redirect | |
| 2 | Sign in with a Google account never used before | Redirected to `/signup/role-select` with name and email pre-filled | |
| 3 | Select **Client**, click Continue | Redirected to `/onboarding` | |
| 4 | Complete onboarding | Redirected to `/dashboard/client` | |
| 5 | Sign out, sign back in with same Google account | Redirected directly to `/dashboard/client` — skips role-select | |

---

## 1.3 Login & Session

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/login`, enter correct email + password | Redirected to `/dashboard/client` | |
| 2 | Go to `/login`, enter wrong password | Error message shown, no redirect | |
| 3 | Go to `/forgot-password`, enter email | "Check your email" shown | |
| 4 | Click reset link in email, set new password | Redirected to login, new password works | |

---

## 1.4 Homepage

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/` (logged out) | Hero section loads with 3D photo stack, search bar, specialty grid | |
| 2 | Check Featured Photographers section | Shows up to 3 real photographer cards from the DB (not placeholders) | |
| 3 | Type "wedding" in search bar | Autocomplete suggestions appear | |
| 4 | Select a suggestion | Redirected to `/photographers?specialty=wedding` | |
| 5 | Click a specialty tile (e.g. Portrait) | Redirected to `/photographers?specialty=portrait` | |
| 6 | Click **Browse photographers** CTA | Redirected to `/photographers` | |
| 7 | Click **List your work** CTA (photographer section) | Redirected to `/signup?role=photographer` | |

---

## 1.5 Browse Photographers

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/photographers` | Page loads with three tabs: Portfolio, Photographers, Packages | |
| 2 | **Portfolio tab** — desktop | Masonry grid of photos from all photographers | |
| 3 | **Portfolio tab** — mobile | Vertical swipeable reel of photos | |
| 4 | **Photographers tab** | Grid of photographer cards with name, rate, rating, specialties, badge | |
| 5 | Filter by specialty (Wedding) | Grid updates to show only Wedding photographers | |
| 6 | Filter by neighbourhood | Grid narrows to that area | |
| 7 | Filter by minimum rating | Only photographers at or above that rating shown | |
| 8 | Toggle **Available today** | Only photographers available today shown | |
| 9 | Sort by **Most reviewed** | Order changes correctly | |
| 10 | Click **Compare** on a photographer card | Photographer added to compare bar | |
| 11 | Add a second photographer to compare, click Compare | Redirected to `/compare` with side-by-side view | |
| 12 | **Packages tab** | Service packages from photographers shown with price, description, specialty | |
| 13 | Filter packages by billing type | Hourly / package filter works | |
| 14 | Pagination | Next/prev buttons work, page count is correct | |

---

## 1.6 Photographer Public Profile

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Click on any photographer | Profile page loads at `/photographers/[username]` | |
| 2 | Check profile header | Shows display name, location, rate, bio, specialties, badge | |
| 3 | Check portfolio section | Albums shown with cover photos; clicking opens lightbox | |
| 4 | Lightbox navigation | Left/right arrows and keyboard arrows navigate photos | |
| 5 | Check photo metadata | Caption, tags, and shoot date shown in lightbox where available | |
| 6 | Check Trust Score | Score and breakdown shown (GBP rating, review count) | |
| 7 | Check reviews section | Star rating, review text, photographer reply (if any) shown | |
| 8 | Check FAQ section | FAQ entries shown if photographer has added them | |
| 9 | Check packages section | Packages with price and description listed | |
| 10 | Click **Book a session** | Booking form opens (requires login if not signed in) | |

---

## 1.7 Book a Session

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | On a photographer's profile, click **Book a session** | Booking form opens with date picker, time slot, occasion, description | |
| 2 | Select a date the photographer has marked available | Time slots for that day shown | |
| 3 | Select a time slot, fill occasion + description, submit | Booking created; confirmation message shown | |
| 4 | Check photographer email | Photographer receives "new booking request" email | |
| 5 | Go to Client dashboard → Bookings tab | New booking appears with **Pending** status | |

---

## 1.8 Client Dashboard — Bookings

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/dashboard/client` | Dashboard loads with profile card, stats, tabs | |
| 2 | Bookings tab | All bookings listed with status badges | |
| 3 | Booking status **Pending** | "Request cancellation" button visible | |
| 4 | Booking status **Confirmed** | "View photographer profile" button, 24h reminder note | |
| 5 | Booking status **Declined** | Status shown, "Book another" option | |
| 6 | Request cancellation on a pending booking | Reason required; status changes to Cancellation Pending | |
| 7 | Photographer confirms cancel | Status updates to Cancelled | |
| 8 | Booking status **Completed** | "Leave a review" button appears | |

---

## 1.9 Reviews

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Click **Leave a review** on a completed booking | Review modal opens | |
| 2 | Select overall star rating (required) | 1–5 stars, label shown (Poor / Fair / Good / Great / Excellent) | |
| 3 | Optionally rate Communication, Photo Quality, Punctuality, Value | Sub-rating rows work independently | |
| 4 | Write a review text (optional), submit | Review saved; photographer receives email notification | |
| 5 | Check photographer's public profile | New review appears publicly | |
| 6 | Photographer replies to review | Reply appears under your review on the profile | |
| 7 | Back in client dashboard, client reply field appears | Type a follow-up reply, submit | |
| 8 | Client receives email when photographer replies | Email notification delivered | |

---

## 1.10 Messaging

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/messages` | Conversation list shows all threads, unread count badges | |
| 2 | Open a conversation | Message thread loads at `/messages/[slug]` | |
| 3 | Type and send a message | Message appears in thread immediately | |
| 4 | Click emoji picker | Emoji picker opens, selecting one inserts into text | |
| 5 | Click paperclip / attach | File picker opens; upload an image or PDF | |
| 6 | File attachment sent | Attachment bubble appears in conversation | |
| 7 | Photographer replies | Message appears in thread (refresh or auto-poll) | |
| 8 | Unread count | Badge on message icon shows correct unread count | |

---

## 1.11 Saved Photographers

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | On a photographer's profile, click the heart/save icon | Photographer saved to list | |
| 2 | Go to Client dashboard | Saved photographers section shows the saved photographer | |
| 3 | Click Remove | Photographer removed from saved list | |

---

## 1.12 Notifications

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Bell icon in dashboard | Shows unread count badge when notifications exist | |
| 2 | Click bell | Notification centre opens with list of events | |
| 3 | After booking confirmed | Notification appears: "Your booking has been confirmed" | |
| 4 | After review reply | Notification appears | |
| 5 | Mark all as read | Unread count clears to zero | |

---

## 1.13 Account Settings & Deletion

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Client dashboard → Settings gear icon | Profile edit page at `/dashboard/client/edit` | |
| 2 | Update name or location, save | Changes saved and reflected in dashboard | |
| 3 | Sign out button | Signed out, redirected to homepage | |
| 4 | Delete account option | Confirmation prompt shown; account deleted on confirm | |

---

---

# ROLE 2 — PHOTOGRAPHER

---

## 2.1 Sign Up & Onboarding

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/signup`, create account with email | Confirmation email sent | |
| 2 | Confirm email | Redirected to `/signup/role-select` | |
| 3 | Select **Photographer**, click Continue | Redirected to `/onboarding/photographer` | |
| 4 | **Step 1 (Basics)** — fill display name, bio (min 20 chars), location, rate, years experience | Validation errors show if required fields empty | |
| 5 | **Step 2 (Specialties)** — select up to 5 specialties | Selection highlights correctly; 6th selection blocked | |
| 6 | **Step 3 (Online presence)** — answer GBP / website questions | Badge ladder preview updates based on answers | |
| 7 | Submit | Redirected to `/dashboard/photographer` | |
| 8 | Check inbox | Welcome email received from **TrueNorth Frames** | |
| 9 | Check admin inbox | Admin receives "New photographer needs approval" email | |
| 10 | Profile status in dashboard | Shows **Pending Approval** badge | |

---

## 2.2 Photographer Dashboard — Overview Tab

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | `/dashboard/photographer` loads | Overview tab shown with profile summary, quick stats | |
| 2 | Profile completion tips | If fields are incomplete, nudges shown | |
| 3 | Pending approval notice | Banner shown while profile_status = pending | |
| 4 | Quick navigation cards | Portfolio, Requests, Messages, Trust tabs accessible | |

---

## 2.3 Portfolio — Albums & Photos

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to Portfolio tab | Album list shown; "Create album" button visible | |
| 2 | Click **Create album** | Name input appears; submit creates album | |
| 3 | Open album, click **Upload photo** | File picker opens | |
| 4 | Upload a JPEG/PNG under the size limit | Photo appears in album | |
| 5 | Upload a file over the size limit | Error shown, upload blocked | |
| 6 | Add caption to photo | Caption saved | |
| 7 | Add tags to photo | Tags saved and shown on photo | |
| 8 | Add shoot date (month + year) | Date saved and visible | |
| 9 | Drag to reorder photos | Order updates and persists | |
| 10 | Set album cover photo | Cover photo shown on album card | |
| 11 | Delete a photo | Photo removed from album | |
| 12 | Delete an album | Album and all its photos removed | |
| 13 | Reach the max photos limit | Upload blocked with message | |
| 14 | Reach the max albums limit | Create album blocked with message | |

---

## 2.4 Portfolio — Videos

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | In an album, click **Upload video** | File picker opens for video files | |
| 2 | Upload a video | Video appears in album with title | |
| 3 | Add title, tags, and shoot date to video | Metadata saved | |
| 4 | Delete a video | Video removed | |
| 5 | Reach max videos limit | Upload blocked with message | |

---

## 2.5 Profile Settings

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Settings tab → edit bio | Updated bio saved | |
| 2 | Update hourly rate | Rate updated and shown on public profile | |
| 3 | Upload avatar photo | Avatar appears in dashboard and on public profile | |
| 4 | Upload cover photo | Cover shown on public profile header | |
| 5 | Add/edit website URL | Link shown on public profile | |
| 6 | Preview profile | "Preview" button opens the public-facing profile view | |

---

## 2.6 Availability

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Availability tab | Weekly calendar shown, all days default | |
| 2 | Enable time slots for Monday | Time slot rows appear | |
| 3 | Add a morning slot (e.g. 9:00 AM – 12:00 PM) | Slot saved | |
| 4 | Block a specific date | That date shows as unavailable to clients | |
| 5 | Save availability | Changes persist after page refresh | |
| 6 | Client views profile | Only available slots shown in booking form | |

---

## 2.7 Service Packages

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Packages tab | Package list shown; **Add package** button visible | |
| 2 | Create a package — name, description, price, billing type (hourly / session) | Package created and shown in list | |
| 3 | Mark a package as **Popular** | Featured badge appears on package | |
| 4 | Upload banner image to package | Banner shown on package card | |
| 5 | Edit a package | Changes saved | |
| 6 | Delete a package | Package removed | |
| 7 | Go to `/photographers` Packages tab | Package appears publicly | |

---

## 2.8 Booking Requests

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Requests tab | All booking requests listed with status | |
| 2 | Filter by Pending | Only pending requests shown | |
| 3 | Expand a booking card | Full details: client name, date, time, occasion, description | |
| 4 | Add a note to a booking | Note saved | |
| 5 | Click **Approve** | Status changes to Approved; client receives confirmation email | |
| 6 | Click **Decline** | Status changes to Declined; client receives decline email | |
| 7 | Approved booking — client requests cancellation | Status changes to Cancellation Pending | |
| 8 | Confirm cancellation | Status changes to Cancelled | |
| 9 | Mark a booking as **Completed** | Status changes to Completed; client can now leave review | |
| 10 | Calendar view (if available) | Approved bookings shown on mini calendar | |

---

## 2.9 Reviews

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Reviews tab | All reviews received listed with star ratings | |
| 2 | Client leaves a review | Review appears in reviews tab with sub-ratings | |
| 3 | Click **Reply** on a review | Reply text field opens | |
| 4 | Write and submit reply | Reply saved; client receives email notification | |
| 5 | Review appears on public profile | Publicly visible with photographer reply | |
| 6 | Native review count and average | Shown in trust score breakdown | |

---

## 2.10 Trust Score

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Trust tab in dashboard | Current trust score shown with breakdown: GBP, reviews, activity, verification | |
| 2 | GBP not connected — score baseline | Score shown without GBP signals | |
| 3 | Click **Connect Google Business Profile** | OAuth redirect to Google | |
| 4 | Authorise the app | Redirected back to dashboard; GBP connected | |
| 5 | Trust score updates | Score reflects GBP star rating, review count, account age | |
| 6 | Click **Refresh score** | Manual sync triggered; score updates | |
| 7 | Score shown on public profile | Trust score and badge visible to clients | |
| 8 | Score changes trigger notification | In-app notification: "Your trust score changed from X to Y" | |

---

## 2.11 FAQs

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | FAQ section in dashboard settings | Empty FAQ list with **Add FAQ** button | |
| 2 | Add a question and answer | FAQ entry created | |
| 3 | Edit an FAQ | Changes saved | |
| 4 | Delete an FAQ | Entry removed | |
| 5 | FAQs on public profile | Entries shown on profile page for clients to read | |

---

## 2.12 Messaging (Client ↔ Photographer)

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Messages tab in photographer dashboard | Inbox with all client conversations | |
| 2 | Open a conversation | Thread loads with full message history | |
| 3 | Send a message | Message delivered; client sees it | |
| 4 | Attach a file | Attachment bubble shown in thread | |
| 5 | Booking request received | System message bubble shows booking date, time, occasion in thread | |
| 6 | After approving a booking | Automated message sent in thread: "Your booking for [date] has been approved!" | |
| 7 | After declining a booking | Automated decline message sent in thread | |

---

---

# ROLE 3 — PHOTOGRAPHER ↔ PHOTOGRAPHER (Network)

*Requires two photographer accounts, both approved.*

---

## 3.1 Connections

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Network tab in photographer dashboard | Connections list shown (empty initially) | |
| 2 | Search for another photographer by name | Search result appears | |
| 3 | Send connection request | Request sent | |
| 4 | Second photographer accepts | Connection appears in both photographers' lists | |

---

## 3.2 Direct Messages (Photographer ↔ Photographer)

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | In Network tab, click **Message** on a connected photographer | DM thread opens | |
| 2 | Send a message | Message delivered | |
| 3 | Other photographer sees the message | Appears in their Network/Messages | |
| 4 | Attach a file in DM | Attachment shown in thread | |

---

## 3.3 Group Chats

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Network tab → **Create group** | Group name input; submit creates group | |
| 2 | Invite other photographers by name | Invite sent | |
| 3 | Invited photographer accepts | Appears as member in group | |
| 4 | Send a message in group | All members see the message | |
| 5 | Attach a file in group chat | Attachment visible to all members | |
| 6 | Leave a group | Photographer removed from member list | |
| 7 | Group owner removes a member | Member removed from group | |

---

## 3.4 Cover Requests

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | In Network tab, click **Post cover request** | Form opens: date, description | |
| 2 | Submit cover request | Posted to network / sent to connections | |
| 3 | Connected photographers see the request | Cover request appears in their network feed | |
| 4 | Photographer responds | Response logged | |

---

## 3.5 Blocking

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Block a photographer from Network tab | Blocked; they can no longer message you | |
| 2 | Blocked photographer tries to send DM | Message blocked / not delivered | |
| 3 | Unblock photographer | DM restored | |

---

---

# ROLE 4 — ADMIN

*Login at `/admin/login` with admin credentials.*

---

## 4.1 Admin Login

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/admin/login` | Login form loads | |
| 2 | Enter admin email + password | Redirected to `/admin` dashboard | |
| 3 | Enter wrong credentials | Error shown, no redirect | |
| 4 | Access `/admin` without login | Redirected to `/admin/login` | |

---

## 4.2 Admin Dashboard Overview

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | `/admin` loads | Stats shown: Total Clients, Photographers, Total Bookings, Pending Approvals | |
| 2 | Second stat row | Completed Sessions, Flagged Reviews, Completion Rate, Trust Syncs | |
| 3 | Recent Signups panel | Last N users listed with name, email, role, time ago | |
| 4 | Specialty breakdown | Bar chart of photographer specialties | |
| 5 | Pending approvals banner | Amber card shown with count when > 0 | |
| 6 | Flagged reviews banner | Red card shown when reviews are flagged | |
| 7 | Refresh button | Stats reload without page refresh | |

---

## 4.3 Account Management

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/admin/accounts` | User list loads with all accounts | |
| 2 | Filter by role: Photographer | Only photographer accounts shown | |
| 3 | Filter by role: Client | Only client accounts shown | |
| 4 | Search by name or email | Matching accounts shown | |
| 5 | Pagination | 20 per page; next/prev works | |
| 6 | Photographer — profile_status: pending | **Approve** and **Reject** buttons visible | |
| 7 | Click **Approve** | Profile status → approved; photographer receives approval email | |
| 8 | Click **Reject** | Profile status → rejected; photographer receives rejection email | |
| 9 | Approve then **Suspend** | Account suspended; photographer receives suspension email | |
| 10 | **Reinstate** a suspended account | Account restored to active | |
| 11 | Trust score column | Shows current trust score for photographers | |

---

## 4.4 Trust Health

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/admin/trust-health` | Trust health dashboard loads | |
| 2 | Overall status indicator | Shows Healthy / Degraded / Failed based on sync results | |
| 3 | Platforms monitored | Google Business Profile panel shown | |
| 4 | GBP panel details | Profiles linked, avg rating, total reviews, last sync time | |
| 5 | Sync log entries | Recent sync history with status (success/partial/failed) | |
| 6 | Score weight breakdown | Table showing GBP baseline 75%, reviews 12.5%, verification 9.5%, age 3% | |
| 7 | Manual sync trigger | Button to force sync for all photographers; runs without error | |

---

## 4.5 Support Tickets

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/admin/support` | Ticket list loads with status counts (open, in review, resolved, closed) | |
| 2 | Filter by status | Only tickets of that status shown | |
| 3 | Filter by category | Fake review / Spam / Account issue etc. filter works | |
| 4 | Search by submitter name or email | Matching tickets shown | |
| 5 | Open a ticket | Full ticket detail: submitter, category, subject, message, timestamps | |
| 6 | Write admin reply | Reply text field; submit saves reply | |
| 7 | Change ticket status to **Resolved** | Status updates; user receives "ticket resolved" email | |
| 8 | Change status to **Closed** | Ticket archived | |
| 9 | Ticket linked to a review | Review detail shown with flag status | |

---

## 4.6 Conversations (Moderation)

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/admin/conversations` | List of all platform conversations | |
| 2 | Click a conversation | Full message thread loads in read-only view | |
| 3 | Messages show sender identity | Client or photographer identified per message | |

---

## 4.7 Analytics

| # | Step | Expected Result | Pass |
|---|---|---|---|
| 1 | Go to `/admin/analytics` | Analytics page loads | |
| 2 | Signups over time | Chart or table of new signups by date | |
| 3 | Booking stats | Total bookings, completion rate, cancellation rate | |
| 4 | Review stats | Total reviews submitted, average rating | |
| 5 | Active users | Count of recently active clients and photographers | |

---

---

# EMAIL NOTIFICATIONS — VERIFICATION CHECKLIST

Confirm each email is received, sender shows **TrueNorth Frames**, and content is correct.

| Trigger | Recipient | Check |
|---|---|---|
| Client completes onboarding | Client | Welcome email received |
| Photographer completes onboarding | Photographer | Welcome email received |
| Photographer completes onboarding | Admin | "New photographer needs approval" received |
| Client submits booking request | Photographer | "New booking request" email received |
| Photographer approves booking | Client | "Booking confirmed" email received |
| Photographer declines booking | Client | "Booking declined" email received |
| Booking cancelled | Other party | Cancellation email received |
| Booking marked complete | Client | "Session complete — leave a review" email |
| 24 hours before booking | Both | Reminder email received by both parties |
| Client leaves review | Photographer | "New review received" email |
| Photographer replies to review | Client | "Reply to your review" email |
| Admin approves photographer | Photographer | "Profile approved" email |
| Admin rejects photographer | Photographer | "Profile rejected" email |
| Admin suspends account | Photographer | "Account suspended" email |
| Support ticket submitted | Submitter | "Ticket received" confirmation |
| Admin resolves ticket | Submitter | "Ticket resolved" email |

---

# EDGE CASES & BOUNDARY TESTS

| Test | Expected Result |
|---|---|
| Client tries to access `/dashboard/photographer` | Redirected to client dashboard or 403 |
| Photographer tries to access `/dashboard/client` | Redirected to photographer dashboard or 403 |
| Unauthenticated user tries to access any dashboard | Redirected to `/login` |
| Unauthenticated user tries to book a photographer | Prompted to log in |
| Photographer submits bio under 20 characters | Validation error shown |
| Photo upload over file size limit | Error message, upload rejected |
| Trying to leave a second review on same booking | Form blocked or error shown |
| Booking request for a date photographer has blocked | Date not selectable |
| Admin tries to approve already-approved photographer | No duplicate action |
| Sending a message over the character limit | Input blocked or error shown |

---

*TrueNorth Frames — Complete UAT Testing Guide — June 2026*

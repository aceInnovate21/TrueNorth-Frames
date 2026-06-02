# TrueNorth Frames — UAT Test Scenarios
**Version:** 1.0  
**Date:** May 2026  
**Environment:** https://truenorthframes.vercel.app  
**Prepared by:** TrueNorth Frames Team

---

## Before You Start

- Use a real email address you can access (you'll receive emails during testing)
- Test on both **desktop** and **mobile** if possible
- Use **two separate browsers** or incognito windows to test client + photographer flows simultaneously
- Report any bugs with: what you did, what you expected, what actually happened

---

## Scenario 1 — Client Signup & Onboarding

**Goal:** A new client can sign up and complete their profile setup.

**Steps:**
1. Go to https://truenorthframes.vercel.app
2. Click **Sign up free** in the top navigation
3. Select **Client** as your account type
4. Fill in first name, last name, email, and a password (min 6 characters)
5. Agree to terms and click **Create account**
6. You should be taken to the onboarding page — complete your interests
7. Click **Go to dashboard**

**Expected Results:**
- ✅ Account created without errors
- ✅ Redirected to onboarding after signup
- ✅ Dashboard shows your first name in "Welcome back, [Name]"
- ✅ Welcome email arrives in your inbox from TrueNorth Frames

**Watch for:**
- Name showing blank on dashboard
- Signup error messages being unclear
- Onboarding page not loading

---

## Scenario 2 — Photographer Signup & Profile Setup

**Goal:** A new photographer can sign up, complete onboarding, and publish a profile.

**Steps:**
1. Open a new incognito window and go to https://truenorthframes.vercel.app/signup
2. Select **Photographer** as your account type
3. Fill in details and create the account
4. Complete photographer onboarding — add username, display name, bio, location
5. After onboarding, go to your **dashboard**
6. Add at least **2 specialties** (e.g. Wedding, Portrait)
7. Set your **rate** (e.g. "$150/hr")
8. Upload **at least 3 portfolio photos**
9. Click **Save** on each section

**Expected Results:**
- ✅ Photographer profile created and saved correctly
- ✅ Dashboard shows all entered information
- ✅ Profile completeness score increases as you fill in sections
- ✅ Welcome email arrives mentioning your profile is under review

**Watch for:**
- Photo upload failing or showing errors
- Saved data not persisting after page refresh
- Username taken error not showing clearly

---

## Scenario 3 — Admin Approves Photographer

**Goal:** Admin can review and approve a pending photographer, who then appears publicly.

**Pre-condition:** Scenario 2 completed — photographer profile exists with `pending` status.

**Steps:**
1. Log in as **Admin** at https://truenorthframes.vercel.app/admin/login
2. Go to **Accounts** in the admin nav
3. Find the photographer from Scenario 2
4. Click **Approve**
5. Log out of admin
6. Go to https://truenorthframes.vercel.app/photographers
7. Search for the photographer by name

**Expected Results:**
- ✅ Photographer appears in the admin accounts list with "Pending" badge
- ✅ Approve button works without errors
- ✅ Photographer profile is now visible on the public browse page
- ✅ Photographer receives an email: "You're live on TrueNorth Frames!"

**Watch for:**
- Photographer not appearing in browse after approval
- Approve button showing no feedback
- Admin nav items not highlighting correctly

---

## Scenario 4 — Client Browses & Contacts a Photographer

**Goal:** A client can find a photographer and send them a message.

**Pre-condition:** Scenarios 1 and 3 completed — approved photographer exists.

**Steps:**
1. Log in as the **client** from Scenario 1
2. Go to **Browse photographers** from the dashboard or top nav
3. Filter by a specialty the photographer has
4. Click on the photographer's profile card
5. Review the public profile — portfolio, trust score, specialties, pricing
6. Click **Message [Name]** or **Request a booking**
7. Write a message and send it

**Expected Results:**
- ✅ Photographer appears in browse results with correct specialty filter
- ✅ Public profile shows portfolio photos, specialties, and location
- ✅ Message sends without errors
- ✅ Client sees the conversation in their dashboard under Messages
- ✅ Photographer receives email: "[Client Name] sent you a message"

**Watch for:**
- Public profile showing blank sections
- Message send button not responding
- Conversation not appearing in dashboard after sending

---

## Scenario 5 — Photographer Manages a Booking Request

**Goal:** A photographer can accept a booking request, and client receives confirmation.

**Pre-condition:** Scenario 4 completed — client has messaged photographer.

**Steps:**
1. Log in as the **client** from Scenario 1
2. Go to dashboard → **My bookings** → click **Book a new session**
3. Visit the photographer's profile and submit a booking request:
   - Select occasion (e.g. Portrait)
   - Pick a date at least 2 days from now
   - Add a time slot and location note
4. Log out and log in as the **photographer** from Scenario 2
5. Go to dashboard → **Bookings**
6. Find the new booking request — click **Accept**
7. Add a note to the client (optional) and confirm

**Expected Results:**
- ✅ Booking appears in photographer's dashboard with "Pending" status
- ✅ Photographer can accept with optional note
- ✅ Booking status changes to "Confirmed"
- ✅ Client receives email: "Your booking with [Photographer] is confirmed!"
- ✅ Booking appears in client dashboard as confirmed

**Watch for:**
- Booking not appearing in photographer dashboard
- Accept button throwing an error
- Client email not arriving (check spam)

---

## Scenario 6 — Review Flow (Client Reviews Photographer)

**Goal:** After a completed session, client can leave a review and photographer can reply.

**Pre-condition:** A booking exists. For UAT, admin can mark it as "Completed" directly in the DB, or the photographer marks it complete from their dashboard.

**Steps:**
1. Log in as **photographer** → go to Bookings → mark the booking as **Complete**
2. Log out and log in as **client**
3. Go to dashboard → **My bookings** → find the completed booking
4. Click **Leave a review**
5. Rate the session (1–5 stars), add sub-ratings and a written review
6. Submit the review
7. Log out and log in as **photographer**
8. Go to dashboard → **Reviews**
9. Find the new review and click **Reply**
10. Write and submit a reply

**Expected Results:**
- ✅ Client sees "Leave a review" button on completed booking
- ✅ Review submission works with all rating fields
- ✅ Photographer sees the review in their dashboard
- ✅ Photographer receives email: "[Client] left you a 5★ review"
- ✅ Photographer can reply successfully
- ✅ Client receives email: "[Photographer] replied to your review"
- ✅ Review appears on photographer's public profile

**Watch for:**
- Review button not appearing on completed booking
- Star rating UI not responding on mobile
- Reply not showing on public profile after submission

---

## Scenario 7 — Photographer Flags a Fake Review & Admin Takes Action

**Goal:** Photographer can flag a suspicious review, admin investigates and removes it.

**Pre-condition:** Scenario 6 completed — a review exists on the photographer's profile.

**Steps:**
1. Log in as **photographer**
2. Go to dashboard → **Reviews**
3. Find the review → click **Flag as fake**
4. Enter a reason and submit
5. Log in as **Admin** → go to **Support**
6. Find the new ticket with category "Fake Review"
7. Expand the ticket — click **View Review**
8. Click **Remove review**
9. Log in as **photographer** → check the Reviews tab

**Expected Results:**
- ✅ Flag submits without error
- ✅ Support ticket appears in admin portal with "Fake Review" category
- ✅ Admin can see the review content inline in the ticket
- ✅ Admin removes the review successfully
- ✅ Review shows "Removed by admin" in photographer dashboard (dimmed, red badge)
- ✅ Review no longer visible on the public profile
- ✅ Photographer receives email: "A review on your profile has been removed"

**Watch for:**
- Flag modal not submitting
- Ticket not appearing in admin support
- Review still visible publicly after removal

---

## Scenario 8 — Client Submits a Support Ticket

**Goal:** A client can contact support and receive a resolution email.

**Steps:**
1. Log in as **client**
2. Go to dashboard → scroll to **Contact support** widget
3. Select a topic (e.g. "I have a question about a booking")
4. Write a message and submit
5. Log in as **Admin** → go to **Support**
6. Find the ticket → click **Resolve**
7. Add a resolution note (e.g. "We've looked into this and...")
8. Save

**Expected Results:**
- ✅ Support widget submits without error
- ✅ Client sees a success confirmation after submission
- ✅ Admin receives email notification of new ticket
- ✅ Ticket appears in admin support with correct category and message
- ✅ Admin can resolve the ticket with a note
- ✅ Client receives email: "Your support ticket has been resolved"

**Watch for:**
- Support form showing no feedback after submit
- Ticket not showing in admin portal
- Resolution email not arriving

---

## Scenario 9 — Account Suspension (Admin) & Login Block

**Goal:** Admin can suspend an account and the user cannot log back in.

**Pre-condition:** A photographer or client account exists.

**Steps:**
1. Log in as **Admin** → go to **Accounts**
2. Find the client or photographer from earlier scenarios
3. Click **Suspend**
4. Log out of admin
5. Try to log in as the **suspended user**

**Expected Results:**
- ✅ Suspend action completes without error
- ✅ Account shows "Suspended" badge in admin accounts list
- ✅ Suspended user sees a clear error on login: "Your account has been suspended. Please contact support at support@truenorthframes.ca to resolve this."
- ✅ Suspended user cannot access any dashboard pages
- ✅ Photographer receives email: "Important notice regarding your account"

**Watch for:**
- Suspended user being able to log in anyway
- Login error message not appearing or being generic
- No email sent to suspended photographer

---

## Scenario 10 — Full Mobile Experience Walkthrough

**Goal:** Verify the core flows work correctly on a mobile device.

**Steps:**  
On a real phone or browser dev tools set to mobile viewport (375px):

1. Visit the **homepage** — check hero, featured photographers, specialty grid
2. Use the **search bar** — type a specialty and confirm suggestions appear
3. Browse the **photographers page** — test filters (specialty dropdown)
4. Open a **photographer profile** — scroll through portfolio, trust score, booking section
5. **Sign up** as a new client on mobile
6. Complete **onboarding** on mobile
7. Send a **message** to a photographer from the client dashboard
8. Check the **notifications bell** — confirm unread count shows

**Expected Results:**
- ✅ No horizontal scroll or layout overflow on any page
- ✅ Navigation hamburger menu works (if applicable)
- ✅ Modals and drawers open and close correctly
- ✅ Forms are usable with mobile keyboard (inputs not hidden behind keyboard)
- ✅ Portfolio photo grid looks correct on small screen
- ✅ All CTAs are tappable (min 44px touch targets)

**Watch for:**
- Text overflow or truncation issues
- Buttons too small to tap
- Modals not dismissing on mobile
- Images not loading or appearing stretched

---

## Bug Reporting Template

When you find an issue, report it using this format:

```
Scenario: [number and name]
Step: [which step failed]
Expected: [what should have happened]
Actual: [what actually happened]
Device/Browser: [e.g. iPhone 15 / Safari, MacBook / Chrome]
Screenshot: [attach if possible]
Severity: Critical / Medium / Minor
```

---

## UAT Sign-off Checklist

| Scenario | Tester | Status | Notes |
|---|---|---|---|
| 1 — Client Signup | | ⬜ Pass / ⬜ Fail | |
| 2 — Photographer Signup | | ⬜ Pass / ⬜ Fail | |
| 3 — Admin Approves Photographer | | ⬜ Pass / ⬜ Fail | |
| 4 — Browse & Contact | | ⬜ Pass / ⬜ Fail | |
| 5 — Booking Request & Acceptance | | ⬜ Pass / ⬜ Fail | |
| 6 — Review Flow | | ⬜ Pass / ⬜ Fail | |
| 7 — Fake Review Flag & Removal | | ⬜ Pass / ⬜ Fail | |
| 8 — Support Ticket | | ⬜ Pass / ⬜ Fail | |
| 9 — Account Suspension | | ⬜ Pass / ⬜ Fail | |
| 10 — Mobile Experience | | ⬜ Pass / ⬜ Fail | |

**UAT Approved by:** ___________________  
**Date:** ___________________

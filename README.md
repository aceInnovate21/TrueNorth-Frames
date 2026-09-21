# TrueNorth Frames

**A local photographer marketplace for Edmonton, Alberta — built to send more business to independent photographers and keep it in the local economy.**

Next.js 14 · TypeScript · Supabase (Postgres + Auth + RLS) · Cloudflare R2 · Resend · Tailwind CSS · Vercel

> This repository is also a working example of an **AI-assisted engineering workflow using [Claude Code](https://claude.com/claude-code)**. See [**Built with Claude Code**](#-built-with-claude-code) for how the agent was used to audit, plan, implement, verify, and ship the changes on this branch.

---

## The product

Finding a good photographer in a mid-size city is broken: you scroll Instagram, cross-reference Google reviews on a second tab, and hope the person who posts nicely also shows up on time. TrueNorth Frames fixes that for **Edmonton** specifically.

It's a two-sided marketplace:

- **Clients** browse and compare local photographers by specialty, price, availability, and a **verified Trust Score** built from real signals (Google reviews, portfolio depth, platform activity), then message and request bookings — all in one place.
- **Photographers** get a free, professional profile with a portfolio, packages, availability calendar, direct client enquiries, and reputation tools — without a national platform taking a cut of every job.

### Why "local" is the strategy, not just a tagline

The whole product is deliberately **Edmonton-only**. That focus is the moat: a hyper-local marketplace can build real trust (verified local reviews, no out-of-town noise) and a defensible community that a national aggregator can't replicate. The business model is designed around a **reputation flywheel**:

> more on-platform bookings → more reviews → higher Trust Score & ranking → more new clients discovered → more bookings

Every product decision — the Trust Score, keeping conversations on-platform, the frictionless review loop — exists to spin that flywheel.

### Business model

TrueNorth Frames launches free to build supply and demand, with a clear path to sustainability:

- **Phase 1 — free / discovery** (Thumbtack-style): free profiles and messaging to attract photographers and clients.
- **Phase 2 — transaction fees** (Airbnb-style split): a modest platform fee on bookings — modelled at a combined ~10–17% take, loaded toward the client side to keep the scarce supply side (photographers) happy.
- **Phase 3 — subscriptions**: Premium / Studio tiers for featured placement, analytics, custom URLs, and multi-photographer studio accounts.

The marketing copy is intentionally worded to stay honest across those phases (no "free forever" promises), and the Terms reserve the right to introduce fees with notice.

---

## Feature overview

| Area | What it does |
|---|---|
| **Discovery** | Search/filter photographers by specialty, location, rating, price, availability; compare side by side. |
| **Photographer profiles** | Portfolio albums + standalone media, packages, FAQs, availability calendar, social links, Trust Score. |
| **Trust Score** | A composite reputation score from Google reviews (via the Google Places API), portfolio depth, and platform activity — with verification badges. |
| **Booking requests** | Clients send a dated, described request; photographers approve / decline / complete; multi-day ranges supported. |
| **Reviews flywheel** | One-tap, deep-linked review requests after each completed session, with reminders — the core growth loop. |
| **Messaging** | In-app conversations between clients and photographers, tied to bookings. |
| **Media pipeline** | Browser-side presigned uploads to Cloudflare R2 (public + private buckets), image compression, video handling. |
| **Transactional email** | Resend-powered lifecycle emails (welcome, approval, booking updates, reviews) with locally-rendered HTML templates. |
| **Admin portal** | Account management, a full **profile-review preview** for vetting photographers before approval, reject-with-reason, suspend/reactivate, review moderation, analytics. |
| **SEO / discoverability** | Dynamic `sitemap.xml`, `robots.txt`, per-page canonical + Open Graph metadata, JSON-LD, and accessible markup for AI-agent browsing. |

---

## Architecture

```
Next.js 14 App Router (RSC + client components, TypeScript)
├── app/                    Routes: marketing, dashboards (client/photographer), admin, API
│   ├── api/                Route handlers (server-only, service-role DB access)
│   ├── dashboard/          Client & photographer dashboards
│   ├── admin/              Admin portal
│   └── photographers/      Public directory + [username] profiles
├── components/             Reusable UI (modals, messaging, calendar, admin tools)
├── lib/                    Domain logic: email templates, R2, trust engine, helpers
├── supabase/migrations/    Versioned Postgres schema (39 migrations) + RLS policies
└── middleware.ts           Auth gating & role-based routing
```

**Key technical choices**

- **Supabase Postgres** with Row-Level Security; server route handlers use the service-role key, browser reads go through RLS. Auth is Supabase Auth (email + Google OAuth), with a trigger that provisions the app `users` row on signup.
- **Cloudflare R2** for media, with **presigned browser uploads** (public bucket for portfolio/avatars, private bucket for protected assets) and CORS scoped to the deployment origin.
- **Resend** for email; most templates render HTML locally (`lib/email/templates.ts`) so they need only an API key + verified sender.
- **Scheduled jobs** via Vercel Cron (booking reminders, the review-request nudge, a photographer welcome series, orphaned-asset cleanup).
- **Deployed on Vercel**, using Preview deployments as a dev environment against a separate Supabase project.

---

## 🤖 Built with Claude Code

This project is developed with **Claude Code** as a hands-on engineering agent, not an autocomplete. The workflow on this branch is a representative sample of that collaboration.

### The working loop

Every non-trivial change followed the same disciplined loop:

1. **Audit first.** Before touching code, the agent explored the relevant files (route handlers, schema migrations, components) and reported *how the current system actually works* — e.g. tracing the booking flow end-to-end, or mapping which of two email-sending paths a template used, before proposing anything.
2. **Plan & confirm.** For anything with product or architectural weight (fee model, letting rejected users log back in, canonical domain), the agent surfaced the trade-offs and got an explicit decision rather than guessing.
3. **Implement across the codebase.** Multi-file changes — a new API route + a React component + a migration + wiring into two dashboards — done coherently in one pass.
4. **Self-verify.** After each change the agent ran `tsc --noEmit` and a full `next build`, and fixed its own type/lint/build errors before handing anything back. Nothing was reported "done" without a green build.
5. **Ship in small steps.** Each feature landed as its own reviewed, descriptive commit — often built → audited → committed one step at a time (e.g. the four-step account-lifecycle loop).

### Representative work delivered this way

- **SEO foundation** — diagnosed a Google Search Console report (pages not indexed, duplicate-canonical, page-with-redirect), traced each issue to its root cause in the code, then added a dynamic sitemap, `robots.ts`, `metadataBase` + canonicals, per-page metadata (incl. `generateMetadata` for profile pages), and Organization JSON-LD.
- **AI-agent accessibility** — fixed accessibility-tree warnings so autonomous browsers/agents can navigate the site (accessible names on all public form controls).
- **The reviews flywheel** — designed and built the one-tap, deep-linked review-request email + a prefilled in-app review form + a reminder cron, closing the "leak" between completed sessions and reviews. Included fixing a real login-redirect edge case so the deep link survives sign-in.
- **Account lifecycle** — a complete approve / reject-with-reason / fix / resubmit / suspend / reactivate loop across the admin portal, middleware, API, and photographer dashboard — including an admin "review the full profile before approving" preview.
- **Add-to-Calendar** — Google/Apple/Outlook/`.ics` export for confirmed bookings (no OAuth), with correct timezone handling and a portal-based dropdown that escapes container clipping.
- **Business-safe copy pass** — audited ~30 "free forever / zero commission" marketing claims across 11 pages and reworded them to stay truthful ahead of introducing platform fees, plus a Terms clause.

### Real-world debugging (not just greenfield)

A meaningful part of the work was diagnosing live infrastructure issues from error messages and screenshots — the kind of thing that shows an agent reasoning about a real system:

- Traced a portfolio-upload failure to an **R2 CORS pre-flight** issue (and explained why avatar upload worked — it goes through the server, not a browser presigned PUT).
- Diagnosed a broken email link (`http://undefined/...`) as a **`NEXT_PUBLIC_*` build-time inlining** gotcha, then hardened the templates with a production fallback so it can't recur.
- Walked through the full dev-environment bring-up (Supabase keys/scopes, R2 buckets + CORS, Resend domain verification, Vercel Preview env scoping) and caught classic footguns (dev keys landing on the Production scope, `NEXT_PUBLIC_APP_URL` needing a rebuild).

---

## Local / preview setup

Environment variables, grouped by what they unlock:

**Required (app runs)**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=        # canonical origin — must be set at build time
NEXT_PUBLIC_SITE_URL=
```

**Media uploads (Cloudflare R2)**
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=             # public bucket
R2_PRIVATE_BUCKET_NAME=     # private bucket
R2_PUBLIC_URL=              # public bucket's dev/custom URL
```

**Email (Resend)** — `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (verified sender).

**Optional integrations** — Google Places / OAuth, Facebook / Instagram, `CRON_SECRET` for scheduled jobs.

```bash
npm install
# apply supabase/migrations to your database
npm run dev          # http://localhost:3000
npm run build        # production build
npm test             # vitest
```

R2 uploads happen from the browser via presigned URLs, so the bucket's **CORS policy** must allow `PUT`/`GET` from your origin.

---

## Status

Actively developed. Runs on Vercel with Supabase, Cloudflare R2, and Resend; Preview deployments serve as the staging environment.

---

<sub>Built by Yogesh Kumar R V · engineered with Claude Code.</sub>

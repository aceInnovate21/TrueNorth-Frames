-- Migration 034: Founding Members program
-- Admin-assigned recognition for early photographers. Unlike computed badges
-- (lib/badges.ts), this is a manual flag toggled from the admin portal.
--
-- is_founder   — whether the "Founding Member" badge shows publicly.
-- founder_since — timestamp of the FIRST grant. Kept even if is_founder is
--                 later turned off, so the thank-you email fires exactly once
--                 (guard: only send when founder_since is null at grant time).

ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS is_founder    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founder_since timestamptz;

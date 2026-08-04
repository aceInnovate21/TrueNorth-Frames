-- Migration 036: First-run onboarding tour
-- Tracks whether a photographer has seen (or skipped) the guided dashboard
-- tour, so it shows exactly once per account rather than on every visit or
-- per-browser. Null = not yet seen; a timestamp = completed or skipped.

ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS onboarding_tour_completed_at timestamptz;

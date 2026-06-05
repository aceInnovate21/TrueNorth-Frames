-- Migration 027: Self-reported online presence fields captured during onboarding
-- These are informational signals for admin review only.
-- Badge computation uses verified OAuth data — not these columns.

ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS has_gbp_self_reported          boolean,
  ADD COLUMN IF NOT EXISTS has_gbp_reviews_self_reported  boolean,
  ADD COLUMN IF NOT EXISTS has_website_self_reported      boolean;

COMMENT ON COLUMN photographer_profiles.has_gbp_self_reported         IS 'Photographer self-reported having a Google Business Profile during onboarding';
COMMENT ON COLUMN photographer_profiles.has_gbp_reviews_self_reported IS 'Photographer self-reported having reviews on their GBP during onboarding';
COMMENT ON COLUMN photographer_profiles.has_website_self_reported     IS 'Photographer self-reported having a photography website during onboarding';

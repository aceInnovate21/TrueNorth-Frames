-- Migration 028: Google Places link for trust signals (GBP API replacement)
-- We read public review rating / count / business status via the Places API (New)
-- instead of the owner-authenticated Business Profile API (which requires a
-- verified GBP that online-only businesses cannot obtain). The photographer
-- identifies their public Google listing; we store the resolved place_id.

ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS google_place_id       text,
  ADD COLUMN IF NOT EXISTS google_business_name  text;

COMMENT ON COLUMN photographer_profiles.google_place_id      IS 'Google Places (New) place_id of the photographer''s confirmed public business listing';
COMMENT ON COLUMN photographer_profiles.google_business_name IS 'Display name of the confirmed Google listing (as returned by Places)';

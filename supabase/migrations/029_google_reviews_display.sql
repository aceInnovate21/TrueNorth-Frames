-- Migration 029: Optional public display of Google reviews + combined rating inputs
-- Photographers opt in to showing up to 5 "most relevant" Google reviews on their
-- public profile. We cannot edit or curate them (Google constraint) — they are
-- shown verbatim, attributed, with a "From Google" tag and a link back to Google.

ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS show_google_reviews  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_maps_uri      text,
  ADD COLUMN IF NOT EXISTS google_reviews       jsonb;

COMMENT ON COLUMN photographer_profiles.show_google_reviews IS 'Photographer opted in to display Google review snippets on their public profile';
COMMENT ON COLUMN photographer_profiles.google_maps_uri     IS 'Google Maps URL for the linked listing (used for the "View on Google" link)';
COMMENT ON COLUMN photographer_profiles.google_reviews      IS 'Up to 5 most-relevant Google reviews (verbatim, attributed) from the Places API';

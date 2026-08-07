-- Migration 039: Profile view recorder
-- Depends on: 002_core_tables (photographer_profile_views, profile_view_count)
--
-- The photographer_profile_views table and profile_view_count column shipped in
-- 002 but nothing ever wrote to them. This adds an atomic recorder that the
-- /api/photographer/[username]/view endpoint calls: it inserts a deduped daily
-- view and bumps the cached counter only when a genuinely new row lands.
--
-- Dedup is handled by the existing UNIQUE (photographer_id, viewer_fingerprint,
-- view_date) constraint — one view per viewer per photographer per day.

CREATE OR REPLACE FUNCTION record_profile_view(
  p_photographer_id uuid,
  p_viewer_id       uuid,
  p_viewer_role     text,
  p_fingerprint     text,
  p_referrer_type   text
)
RETURNS boolean   -- true when a NEW view row was recorded, false on a same-day repeat
LANGUAGE plpgsql
AS $$
DECLARE
  rc int;
BEGIN
  INSERT INTO photographer_profile_views
    (photographer_id, viewer_id, viewer_role, viewer_fingerprint, view_date, referrer_type)
  VALUES
    (p_photographer_id, p_viewer_id, NULLIF(p_viewer_role, ''), p_fingerprint,
     (now() AT TIME ZONE 'America/Edmonton')::date, NULLIF(p_referrer_type, ''))
  ON CONFLICT (photographer_id, viewer_fingerprint, view_date) DO NOTHING;

  GET DIAGNOSTICS rc = ROW_COUNT;

  IF rc > 0 THEN
    UPDATE photographer_profiles
    SET profile_view_count = profile_view_count + 1
    WHERE id = p_photographer_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

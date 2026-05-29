-- Migration 023: Auto-sync native_avg_rating and native_review_count on photographer_profiles
-- Fires after every INSERT, UPDATE (rating change), or DELETE on reviews

CREATE OR REPLACE FUNCTION sync_photographer_review_stats()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_photographer_id uuid;
BEGIN
  -- Determine which photographer's stats to refresh
  IF TG_OP = 'DELETE' THEN
    target_photographer_id := OLD.photographer_id;
  ELSE
    target_photographer_id := NEW.photographer_id;
  END IF;

  UPDATE photographer_profiles
  SET
    native_review_count = (
      SELECT COUNT(*) FROM reviews
      WHERE photographer_id = target_photographer_id
        AND flag_status = 'none'
    ),
    native_avg_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews
      WHERE photographer_id = target_photographer_id
        AND flag_status = 'none'
    ), 0),
    updated_at = now()
  WHERE id = target_photographer_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER reviews_sync_photographer_stats
  AFTER INSERT OR UPDATE OF rating, flag_status OR DELETE
  ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_photographer_review_stats();

-- Backfill existing data (in case reviews already exist)
UPDATE photographer_profiles pp
SET
  native_review_count = sub.cnt,
  native_avg_rating   = sub.avg_r
FROM (
  SELECT
    photographer_id,
    COUNT(*)                           AS cnt,
    ROUND(AVG(rating)::numeric, 2)     AS avg_r
  FROM reviews
  WHERE flag_status = 'none'
  GROUP BY photographer_id
) sub
WHERE pp.id = sub.photographer_id;

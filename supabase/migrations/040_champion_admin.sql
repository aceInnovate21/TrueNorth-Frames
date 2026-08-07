-- Migration 040: Champions admin override
-- Depends on: 038_monthly_champions
--
-- Lets an admin curate the frozen leaderboard: manually set a category winner,
-- remove an entry, and lock a month so the monthly cron won't overwrite manual
-- edits. Lock enforcement lives in the writers (cron + admin API), which are the
-- only callers of refresh_monthly_champions.

-- ─── Lock table ───────────────────────────────────────────────────────────────
-- A row here means "this month is admin-curated — do not auto-recompute."
CREATE TABLE champion_locks (
  period     date        PRIMARY KEY,      -- first day of the locked month
  locked_by  uuid        REFERENCES users(id),
  note       text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE champion_locks ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (admin API / cron) touches this table.

-- ─── Re-rank helper: set a manual winner ──────────────────────────────────────
-- Forces p_photographer_id to rank 1 for (period, category), inserting them if
-- they weren't already ranked, then renumbers everyone else by metric_value.
-- Ranks are bumped out of the way first so the UNIQUE(period,category,rank)
-- constraint never trips mid-update.
CREATE OR REPLACE FUNCTION champion_set_winner(
  p_period          date,
  p_category        champion_category,
  p_photographer_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure the chosen photographer has an entry for this period/category.
  INSERT INTO monthly_champions (period, category, photographer_id, rank, metric_value, metric_label)
  SELECT p_period, p_category, p_photographer_id, 9000, 0, 'Admin selection'
  WHERE NOT EXISTS (
    SELECT 1 FROM monthly_champions
    WHERE period = p_period AND category = p_category AND photographer_id = p_photographer_id
  );

  -- Move all ranks out of the low range to avoid unique collisions.
  UPDATE monthly_champions SET rank = rank + 10000
  WHERE period = p_period AND category = p_category;

  -- Chosen photographer first, everyone else by metric strength.
  WITH ordered AS (
    SELECT photographer_id,
           ROW_NUMBER() OVER (
             ORDER BY (photographer_id = p_photographer_id) DESC, metric_value DESC
           ) AS rn
    FROM monthly_champions
    WHERE period = p_period AND category = p_category
  )
  UPDATE monthly_champions mc
  SET rank = o.rn
  FROM ordered o
  WHERE mc.period = p_period AND mc.category = p_category
    AND mc.photographer_id = o.photographer_id;
END;
$$;

-- ─── Re-rank helper: remove an entry ──────────────────────────────────────────
-- Deletes one photographer from a (period, category) and closes the rank gap.
CREATE OR REPLACE FUNCTION champion_remove_entry(
  p_period          date,
  p_category        champion_category,
  p_photographer_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM monthly_champions
  WHERE period = p_period AND category = p_category AND photographer_id = p_photographer_id;

  UPDATE monthly_champions SET rank = rank + 10000
  WHERE period = p_period AND category = p_category;

  WITH ordered AS (
    SELECT photographer_id,
           ROW_NUMBER() OVER (ORDER BY metric_value DESC) AS rn
    FROM monthly_champions
    WHERE period = p_period AND category = p_category
  )
  UPDATE monthly_champions mc
  SET rank = o.rn
  FROM ordered o
  WHERE mc.period = p_period AND mc.category = p_category
    AND mc.photographer_id = o.photographer_id;
END;
$$;

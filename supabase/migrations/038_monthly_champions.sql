-- Migration 038: Monthly Champions (Featured Champions landing section)
-- Depends on: 002_core_tables, 004_bookings_reviews, 005_messaging_network
--
-- Stores a frozen monthly leaderboard so the homepage "Champions" section and
-- the (future) per-photographer achievement history read deterministic rows
-- instead of recomputing live on every request. One aggregation job fills this
-- table at month rollover (see /api/cron/monthly-champions).
--
-- NOTE: This feature is intentionally kept on the Featured-Champions branch and
-- NOT merged to main until real booking data exists.

-- ─── Category enum ────────────────────────────────────────────────────────────
CREATE TYPE champion_category AS ENUM (
  'most_viewed',      -- most profile views this month
  'most_booked',      -- most approved/completed bookings this month (needs booking data)
  'most_contacted',   -- most new client enquiries this month (fallback for most_booked)
  'highest_rated',    -- best average review rating (min review threshold)
  'quick_responder'   -- fastest average first reply to a client this month
);

-- ─── Leaderboard table ────────────────────────────────────────────────────────
-- Top N ranks are stored per (period, category) so the section can show a single
-- winner card AND an expandable table without another query.
CREATE TABLE monthly_champions (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  period          date              NOT NULL,   -- first day of the month (UTC)
  category        champion_category NOT NULL,
  photographer_id uuid              NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  rank            smallint          NOT NULL CHECK (rank >= 1),
  metric_value    numeric           NOT NULL DEFAULT 0,  -- raw comparable number
  metric_label    text,                                  -- human string e.g. "1,240 views"
  created_at      timestamptz       DEFAULT now(),
  CONSTRAINT uq_champion_entry UNIQUE (period, category, photographer_id),
  CONSTRAINT uq_champion_rank  UNIQUE (period, category, rank)
);
CREATE INDEX idx_champions_period_cat ON monthly_champions(period, category, rank);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Public read (the leaderboard is meant to be seen). Writes go through the
-- service-role cron, which bypasses RLS, so no write policy is defined.
ALTER TABLE monthly_champions ENABLE ROW LEVEL SECURITY;
CREATE POLICY monthly_champions_public_read ON monthly_champions
  FOR SELECT USING (true);

-- ─── Aggregation function ─────────────────────────────────────────────────────
-- Recomputes every category for a given month and replaces that month's rows.
-- Safe to re-run (idempotent per period). Defaults to the current month.
--
-- Tunable thresholds live here as locals:
--   top_n            → how many ranked rows to keep per category
--   min_reviews      → minimum reviews to qualify for highest_rated
--   min_conversations→ minimum answered enquiries to qualify for quick_responder
CREATE OR REPLACE FUNCTION refresh_monthly_champions(
  p_period date DEFAULT date_trunc('month', now())::date
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  period_start      timestamptz := p_period::timestamptz;
  period_end        timestamptz := (p_period + interval '1 month')::timestamptz;
  prev_period       date        := (p_period - interval '1 month')::date;
  top_n             int := 10;
  min_reviews       int := 3;
  min_conversations int := 3;
  -- Back-to-back rule: last month's #1 in a category cannot win / rank in the
  -- SAME category this month, to spread wins across more photographers. They
  -- remain fully eligible in every OTHER category. NULL when there was no prior
  -- winner (e.g. the very first month), which disables the exclusion.
  prev_most_viewed     uuid;
  prev_most_booked     uuid;
  prev_most_contacted  uuid;
  prev_highest_rated   uuid;
  prev_quick_responder uuid;
BEGIN
  SELECT photographer_id INTO prev_most_viewed     FROM monthly_champions WHERE period = prev_period AND category = 'most_viewed'     AND rank = 1;
  SELECT photographer_id INTO prev_most_booked     FROM monthly_champions WHERE period = prev_period AND category = 'most_booked'     AND rank = 1;
  SELECT photographer_id INTO prev_most_contacted  FROM monthly_champions WHERE period = prev_period AND category = 'most_contacted'  AND rank = 1;
  SELECT photographer_id INTO prev_highest_rated   FROM monthly_champions WHERE period = prev_period AND category = 'highest_rated'   AND rank = 1;
  SELECT photographer_id INTO prev_quick_responder FROM monthly_champions WHERE period = prev_period AND category = 'quick_responder' AND rank = 1;

  -- Wipe the target month so the recompute is authoritative.
  DELETE FROM monthly_champions WHERE period = p_period;

  -- ── Most Viewed ─────────────────────────────────────────────────────────────
  -- Deduped views already: photographer_profile_views is unique per
  -- (photographer, viewer_fingerprint, view_date). Self-views excluded.
  INSERT INTO monthly_champions (period, category, photographer_id, rank, metric_value, metric_label)
  SELECT p_period, 'most_viewed', t.photographer_id, t.rnk, t.n,
         to_char(t.n, 'FM999,999,999') || ' views'
  FROM (
    SELECT v.photographer_id,
           COUNT(*)::numeric AS n,
           ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rnk
    FROM photographer_profile_views v
    JOIN photographer_profiles p ON p.id = v.photographer_id
    WHERE p.profile_status = 'approved'
      AND v.view_date >= p_period
      AND v.view_date <  (p_period + interval '1 month')
      AND (v.viewer_id IS NULL OR v.viewer_id <> p.user_id)   -- drop self-views
      AND v.photographer_id IS DISTINCT FROM prev_most_viewed -- back-to-back rule
    GROUP BY v.photographer_id
  ) t
  WHERE t.rnk <= top_n;

  -- ── Most Booked ─────────────────────────────────────────────────────────────
  -- Approved or completed bookings created this month. Produces no rows until
  -- bookings exist, which is expected pre-launch.
  INSERT INTO monthly_champions (period, category, photographer_id, rank, metric_value, metric_label)
  SELECT p_period, 'most_booked', t.photographer_id, t.rnk, t.n,
         to_char(t.n, 'FM999,999') || ' bookings'
  FROM (
    SELECT b.photographer_id,
           COUNT(*)::numeric AS n,
           ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rnk
    FROM booking_requests b
    JOIN photographer_profiles p ON p.id = b.photographer_id
    WHERE p.profile_status = 'approved'
      AND b.status IN ('approved', 'completed')
      AND b.created_at >= period_start
      AND b.created_at <  period_end
      AND b.photographer_id IS DISTINCT FROM prev_most_booked  -- back-to-back rule
    GROUP BY b.photographer_id
  ) t
  WHERE t.rnk <= top_n;

  -- ── Most Contacted ──────────────────────────────────────────────────────────
  -- New enquiry threads opened this month, counted by distinct client.
  INSERT INTO monthly_champions (period, category, photographer_id, rank, metric_value, metric_label)
  SELECT p_period, 'most_contacted', t.photographer_id, t.rnk, t.n,
         to_char(t.n, 'FM999,999') || ' new enquiries'
  FROM (
    SELECT c.photographer_id,
           COUNT(DISTINCT c.client_id)::numeric AS n,
           ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT c.client_id) DESC) AS rnk
    FROM conversations c
    JOIN photographer_profiles p ON p.id = c.photographer_id
    WHERE p.profile_status = 'approved'
      AND c.created_at >= period_start
      AND c.created_at <  period_end
      AND c.photographer_id IS DISTINCT FROM prev_most_contacted  -- back-to-back rule
    GROUP BY c.photographer_id
  ) t
  WHERE t.rnk <= top_n;

  -- ── Highest Rated ───────────────────────────────────────────────────────────
  -- Lifetime average rating (stable at low volume) with a minimum review count.
  -- Ranked by rating, then review count as a tie-breaker.
  INSERT INTO monthly_champions (period, category, photographer_id, rank, metric_value, metric_label)
  SELECT p_period, 'highest_rated', t.photographer_id, t.rnk, t.avg_rating,
         to_char(t.avg_rating, 'FM990.0') || '★ · ' || t.cnt || ' reviews'
  FROM (
    SELECT r.photographer_id,
           ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
           COUNT(*)                          AS cnt,
           ROW_NUMBER() OVER (ORDER BY AVG(r.rating) DESC, COUNT(*) DESC) AS rnk
    FROM reviews r
    JOIN photographer_profiles p ON p.id = r.photographer_id
    WHERE p.profile_status = 'approved'
      AND r.flag_status <> 'flagged'
      AND r.photographer_id IS DISTINCT FROM prev_highest_rated  -- back-to-back rule
    GROUP BY r.photographer_id
    HAVING COUNT(*) >= min_reviews
  ) t
  WHERE t.rnk <= top_n;

  -- ── Quick Responder ─────────────────────────────────────────────────────────
  -- Average seconds between a client's first message in a thread and the
  -- photographer's first reply, over threads that got a reply this month.
  INSERT INTO monthly_champions (period, category, photographer_id, rank, metric_value, metric_label)
  SELECT p_period, 'quick_responder', t.photographer_id, t.rnk, t.avg_secs,
         CASE
           WHEN t.avg_secs < 3600  THEN 'replies in ~' || GREATEST(1, ROUND(t.avg_secs / 60))  || ' min'
           WHEN t.avg_secs < 86400 THEN 'replies in ~' || ROUND(t.avg_secs / 3600, 1)          || ' hr'
           ELSE                          'replies in ~' || ROUND(t.avg_secs / 86400, 1)         || ' days'
         END
  FROM (
    WITH first_client AS (
      SELECT conversation_id, MIN(created_at) AS t0
      FROM messages WHERE sender_type = 'client'
      GROUP BY conversation_id
    ),
    first_reply AS (
      SELECT m.conversation_id, MIN(m.created_at) AS t1
      FROM messages m
      JOIN first_client fc ON fc.conversation_id = m.conversation_id
      WHERE m.sender_type = 'photographer' AND m.created_at >= fc.t0
      GROUP BY m.conversation_id
    ),
    resp AS (
      SELECT c.photographer_id,
             EXTRACT(EPOCH FROM (fr.t1 - fc.t0)) AS secs
      FROM conversations c
      JOIN first_client fc ON fc.conversation_id = c.id
      JOIN first_reply  fr ON fr.conversation_id = c.id
      WHERE fr.t1 >= period_start AND fr.t1 < period_end
    )
    SELECT r.photographer_id,
           ROUND(AVG(r.secs)::numeric, 0) AS avg_secs,
           ROW_NUMBER() OVER (ORDER BY AVG(r.secs) ASC) AS rnk
    FROM resp r
    JOIN photographer_profiles p ON p.id = r.photographer_id
    WHERE p.profile_status = 'approved'
      AND r.photographer_id IS DISTINCT FROM prev_quick_responder  -- back-to-back rule
    GROUP BY r.photographer_id
    HAVING COUNT(*) >= min_conversations
  ) t
  WHERE t.rnk <= top_n;
END;
$$;

-- ─── Live standings (teaser) ──────────────────────────────────────────────────
-- Powers the "You're #3 in Most Viewed — 12 more views to take the lead" nudge.
-- Computed LIVE for the current month (not from the frozen snapshot) so the
-- number moves as views/enquiries/bookings come in. Covers the count-based
-- categories where a "N more to take the lead" gap is intuitive.
--
-- Respects the back-to-back rule: last month's category winner is omitted from
-- that category here too (they are sitting this month out), so their standing
-- row simply won't be returned for that category.
--
-- Returns one row per count-category the photographer has any activity in:
--   my_value    → the photographer's current metric
--   my_rank     → their rank among eligible photographers (1 = leading)
--   leader_value→ the current top value in that category
--   gap_to_lead → how many more they need to take #1 (0 if already leading)
CREATE OR REPLACE FUNCTION photographer_live_standings(
  p_photographer_id uuid,
  p_period          date DEFAULT date_trunc('month', now())::date
)
RETURNS TABLE (
  category     champion_category,
  my_value     numeric,
  my_rank      int,
  leader_value numeric,
  gap_to_lead  numeric
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  period_start timestamptz := p_period::timestamptz;
  period_end   timestamptz := (p_period + interval '1 month')::timestamptz;
  prev_period  date        := (p_period - interval '1 month')::date;
  prev_viewed    uuid;
  prev_booked    uuid;
  prev_contacted uuid;
BEGIN
  SELECT photographer_id INTO prev_viewed    FROM monthly_champions WHERE period = prev_period AND category = 'most_viewed'    AND rank = 1;
  SELECT photographer_id INTO prev_booked    FROM monthly_champions WHERE period = prev_period AND category = 'most_booked'    AND rank = 1;
  SELECT photographer_id INTO prev_contacted FROM monthly_champions WHERE period = prev_period AND category = 'most_contacted' AND rank = 1;

  RETURN QUERY
  WITH
  -- Most Viewed live counts
  viewed AS (
    SELECT v.photographer_id AS pid, COUNT(*)::numeric AS n
    FROM photographer_profile_views v
    JOIN photographer_profiles p ON p.id = v.photographer_id
    WHERE p.profile_status = 'approved'
      AND v.view_date >= p_period AND v.view_date < (p_period + interval '1 month')
      AND (v.viewer_id IS NULL OR v.viewer_id <> p.user_id)
      AND v.photographer_id IS DISTINCT FROM prev_viewed
    GROUP BY v.photographer_id
  ),
  viewed_ranked AS (
    SELECT pid, n, RANK() OVER (ORDER BY n DESC) AS rnk, MAX(n) OVER () AS leader FROM viewed
  ),
  -- Most Contacted live counts
  contacted AS (
    SELECT c.photographer_id AS pid, COUNT(DISTINCT c.client_id)::numeric AS n
    FROM conversations c
    JOIN photographer_profiles p ON p.id = c.photographer_id
    WHERE p.profile_status = 'approved'
      AND c.created_at >= period_start AND c.created_at < period_end
      AND c.photographer_id IS DISTINCT FROM prev_contacted
    GROUP BY c.photographer_id
  ),
  contacted_ranked AS (
    SELECT pid, n, RANK() OVER (ORDER BY n DESC) AS rnk, MAX(n) OVER () AS leader FROM contacted
  ),
  -- Most Booked live counts
  booked AS (
    SELECT b.photographer_id AS pid, COUNT(*)::numeric AS n
    FROM booking_requests b
    JOIN photographer_profiles p ON p.id = b.photographer_id
    WHERE p.profile_status = 'approved'
      AND b.status IN ('approved', 'completed')
      AND b.created_at >= period_start AND b.created_at < period_end
      AND b.photographer_id IS DISTINCT FROM prev_booked
    GROUP BY b.photographer_id
  ),
  booked_ranked AS (
    SELECT pid, n, RANK() OVER (ORDER BY n DESC) AS rnk, MAX(n) OVER () AS leader FROM booked
  )
  SELECT 'most_viewed'::champion_category, r.n, r.rnk::int, r.leader,
         CASE WHEN r.rnk = 1 THEN 0 ELSE r.leader - r.n + 1 END
  FROM viewed_ranked r WHERE r.pid = p_photographer_id
  UNION ALL
  SELECT 'most_contacted'::champion_category, r.n, r.rnk::int, r.leader,
         CASE WHEN r.rnk = 1 THEN 0 ELSE r.leader - r.n + 1 END
  FROM contacted_ranked r WHERE r.pid = p_photographer_id
  UNION ALL
  SELECT 'most_booked'::champion_category, r.n, r.rnk::int, r.leader,
         CASE WHEN r.rnk = 1 THEN 0 ELSE r.leader - r.n + 1 END
  FROM booked_ranked r WHERE r.pid = p_photographer_id;
END;
$$;

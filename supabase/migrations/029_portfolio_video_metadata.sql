-- Migration 029: Add tags, shoot month/year to portfolio_videos
-- Mirrors the metadata columns added to portfolio_photos in migration 026.

ALTER TABLE portfolio_videos
  ADD COLUMN IF NOT EXISTS tags               text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_taken_month  smallint CHECK (video_taken_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS video_taken_year   smallint CHECK (video_taken_year  BETWEEN 2000 AND 2100);

-- GIN index for tag filtering (same pattern as photos)
CREATE INDEX IF NOT EXISTS idx_portfolio_videos_tags
  ON portfolio_videos USING GIN (tags);

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_portfolio_videos_date
  ON portfolio_videos (video_taken_year, video_taken_month);

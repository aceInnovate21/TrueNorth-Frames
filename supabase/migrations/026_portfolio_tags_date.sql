-- ─── Portfolio photo tags + shoot date ───────────────────────────────────────
-- Adds searchable tags and the month/year the photo was taken.

ALTER TABLE portfolio_photos
  ADD COLUMN IF NOT EXISTS tags        text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photo_taken_month smallint CHECK (photo_taken_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS photo_taken_year  smallint CHECK (photo_taken_year  BETWEEN 2000 AND 2100);

-- Index for tag filtering in portfolio reel
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_tags
  ON portfolio_photos USING GIN (tags);

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_date
  ON portfolio_photos (photo_taken_year, photo_taken_month);

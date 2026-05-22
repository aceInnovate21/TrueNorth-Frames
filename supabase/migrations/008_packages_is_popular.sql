ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false;

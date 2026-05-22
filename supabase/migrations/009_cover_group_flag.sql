ALTER TABLE connection_groups ADD COLUMN IF NOT EXISTS is_cover_group boolean NOT NULL DEFAULT false;

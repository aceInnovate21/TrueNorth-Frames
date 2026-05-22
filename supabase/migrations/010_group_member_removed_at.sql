ALTER TABLE group_members ADD COLUMN IF NOT EXISTS removed_at timestamptz DEFAULT NULL;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS left_at timestamptz DEFAULT NULL;

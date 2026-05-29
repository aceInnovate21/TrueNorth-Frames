-- Migration 018: Add is_dm flag to connection_groups for private 1-1 DMs between photographers
ALTER TABLE connection_groups ADD COLUMN IF NOT EXISTS is_dm boolean NOT NULL DEFAULT false;
-- Unique constraint so two photographers can only have one DM group
-- We enforce this in application logic (upsert-style) rather than a composite unique index
-- because the two members can appear in either order.
CREATE INDEX IF NOT EXISTS idx_connection_groups_dm ON connection_groups(is_dm) WHERE is_dm = true;

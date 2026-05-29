-- Migration 019: Photographer-to-photographer blocks
-- When photographer A blocks photographer B:
--   - Their DM group is deleted (handled in application logic)
--   - B cannot start a new DM with A
--   - The connection remains (not auto-removed)
CREATE TABLE photographer_blocks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id      uuid        NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  blocked_id      uuid        NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  blocked_at      timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
CREATE INDEX idx_photographer_blocks_blocker ON photographer_blocks(blocker_id);
CREATE INDEX idx_photographer_blocks_blocked ON photographer_blocks(blocked_id);

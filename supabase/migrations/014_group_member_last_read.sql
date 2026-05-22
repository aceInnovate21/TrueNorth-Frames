-- Track when each member last read a group so unread counts are accurate
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

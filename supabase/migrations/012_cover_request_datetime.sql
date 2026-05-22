-- Add structured date/time fields to cover_requests
-- message column kept for backward compat but event_date/start_time/end_time are the source of truth going forward
ALTER TABLE cover_requests
  ADD COLUMN IF NOT EXISTS event_date  date,
  ADD COLUMN IF NOT EXISTS start_time  time,
  ADD COLUMN IF NOT EXISTS end_time    time,
  ADD COLUMN IF NOT EXISTS event_type  varchar(200);

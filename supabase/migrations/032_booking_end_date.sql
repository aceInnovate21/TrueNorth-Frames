-- Migration 032: Multi-day booking support
-- Adds an optional end date to booking_requests. When null the booking is a
-- single day (requested_date); when set it represents the inclusive range
-- [requested_date, requested_end_date].

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS requested_end_date date;

-- Guard: end date, when present, must not precede the start date.
ALTER TABLE booking_requests
  DROP CONSTRAINT IF EXISTS booking_end_after_start;
ALTER TABLE booking_requests
  ADD CONSTRAINT booking_end_after_start
  CHECK (requested_end_date IS NULL OR requested_end_date >= requested_date);

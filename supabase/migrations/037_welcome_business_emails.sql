-- Migration 037: Local-business welcome email tracking
-- Depends on: 002_core_tables.sql
--
-- One timestamp so the daily welcome cron sends the single "keep your business
-- on TrueNorth Frames" email exactly once per photographer, ~a day after they
-- are approved.

ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS welcome_biz_email_at timestamptz;

-- Migration 037: Local-business welcome email series tracking
-- Depends on: 002_core_tables.sql
--
-- Two timestamps so the daily welcome cron sends each email in the 2-part
-- "keep your business on TrueNorth Frames" series exactly once per photographer.

ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS welcome_biz_email_1_at timestamptz,
  ADD COLUMN IF NOT EXISTS welcome_biz_email_2_at timestamptz;

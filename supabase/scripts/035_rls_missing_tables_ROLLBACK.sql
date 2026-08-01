-- ─────────────────────────────────────────────────────────────────────────────
-- 035_rls_missing_tables_ROLLBACK.sql
--
-- Reverses 035_rls_missing_tables.sql — returns all 15 tables to their prior
-- state (RLS disabled, no policies).
--
-- THIS IS NOT A MIGRATION. Do not apply it as part of a normal `supabase db
-- push`. It exists to be pasted into the SQL editor if something unexpected
-- breaks after applying 035. Keep it out of the migration sequence — if your
-- tooling picks up every .sql file in this directory, move this file elsewhere
-- or rename it so it is not auto-applied.
--
-- SAFETY
--   Disabling RLS modifies no data and no schema. It only stops Postgres from
--   evaluating policies. Running this is instant and lossless.
--
-- CONSEQUENCE OF RUNNING THIS
--   These tables become publicly readable and writable via the anon key again,
--   including email_queue (every user's email address), group_messages
--   (private message bodies), and message_rate_limits (anti-spam counters).
--   Only run this if you have an actual breakage to diagnose, and re-apply 035
--   once resolved.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Policies must be dropped before disabling RLS on feature_flags, otherwise
-- they persist (dormant) and will silently take effect if RLS is re-enabled.
DROP POLICY IF EXISTS "flags: public read"  ON feature_flags;
DROP POLICY IF EXISTS "flags: admin write"  ON feature_flags;

-- ─── From 002_core_tables.sql ────────────────────────────────────────────────
ALTER TABLE photographer_profile_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags              DISABLE ROW LEVEL SECURITY;

-- ─── From 005_messaging_network.sql ──────────────────────────────────────────
ALTER TABLE message_rate_limits        DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_message_rate_limits  DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_blocks              DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_groups          DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members              DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites              DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages             DISABLE ROW LEVEL SECURITY;
ALTER TABLE cover_requests             DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences   DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue                DISABLE ROW LEVEL SECURITY;
ALTER TABLE trust_sync_log             DISABLE ROW LEVEL SECURITY;

-- ─── From 019_photographer_blocks.sql ────────────────────────────────────────
ALTER TABLE photographer_blocks        DISABLE ROW LEVEL SECURITY;

-- ─── From 025_client_interests.sql ───────────────────────────────────────────
ALTER TABLE client_interests           DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ─── Verification ────────────────────────────────────────────────────────────
-- Run after applying. Every row should show rowsecurity = false.
--
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--     AND tablename IN (
--       'feature_flags','group_members','connection_groups','group_invites',
--       'message_rate_limits','group_messages','group_message_rate_limits',
--       'email_queue','trust_sync_log','client_interests',
--       'notification_preferences','cover_requests','client_blocks',
--       'photographer_blocks','photographer_profile_views')
--   ORDER BY tablename;

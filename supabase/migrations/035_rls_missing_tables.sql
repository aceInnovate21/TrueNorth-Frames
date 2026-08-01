-- ─────────────────────────────────────────────────────────────────────────────
-- 035_rls_missing_tables.sql
--
-- Enables Row Level Security on the 15 public tables that were missed.
--
-- WHY THESE WERE MISSED
--   006_rls.sql covered tables created in migrations 002-004, but migration
--   005_messaging_network.sql was never given RLS at all (9 of the 15 tables
--   below). The rest are stragglers from 002, 019 and 025. The header comment
--   in 006_rls.sql claiming "All tables have RLS enabled" was inaccurate.
--
-- WHY THIS IS SAFE TO APPLY TO A LIVE DATABASE
--   Every application query to these tables runs through the Supabase service
--   role key (lib/api-helpers.ts `adminDb`, lib/supabase.ts `createServiceClient`).
--   The service role BYPASSES RLS at the Postgres level — policies are not
--   evaluated for it. Verified at time of writing:
--     - 0 `.from(<table>)` queries in browser/client-side code
--     - 0 `.rpc()` calls anywhere in the codebase
--     - only trigger involved is connection_groups_updated_at (same-row
--       updated_at stamp); the signup trigger handle_new_auth_user() is
--       SECURITY DEFINER and touches only public.users
--
-- WHAT THIS CHANGES
--   The anon key (which ships publicly in the JS bundle) can no longer read or
--   write these tables. That is the entire point: before this migration anyone
--   could dump email_queue (every user's email address), read group_messages
--   (private message bodies), or reset message_rate_limits to bypass throttling.
--
-- POLICY MODEL
--   These tables are service-role-only by design. RLS is enabled with NO
--   policies, which denies all anon/authenticated access while leaving the
--   service role unaffected. The single exception is feature_flags, which gets
--   a public SELECT policy to match how platform_config is already policied in
--   006_rls.sql (lines 133-135).
--
--   IMPORTANT FOR FUTURE WORK: if you later query any of these tables directly
--   from the browser, the query will return EMPTY rather than error. Add an
--   explicit policy for that table at that time.
--
-- ROLLBACK
--   See 035_rls_missing_tables_ROLLBACK.sql — disabling RLS is instant and
--   lossless (no data or schema is modified).
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── From 002_core_tables.sql ────────────────────────────────────────────────

-- Viewer identity + fingerprint tracking data. Internal analytics only.
ALTER TABLE photographer_profile_views ENABLE ROW LEVEL SECURITY;

-- Unreleased feature toggles. Public read matches platform_config so the
-- frontend can check flags; writes remain admin-only.
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags: public read" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "flags: admin write" ON feature_flags FOR ALL    USING (auth_is_admin());

-- ─── From 005_messaging_network.sql ──────────────────────────────────────────

-- Anti-spam throttle counters. Was writable by anyone — a user could reset
-- their own bucket to bypass the message rate limit entirely.
ALTER TABLE message_rate_limits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_message_rate_limits ENABLE ROW LEVEL SECURITY;

-- Who blocked whom, including free-text block_reason.
ALTER TABLE client_blocks ENABLE ROW LEVEL SECURITY;

-- Private photographer network graph.
ALTER TABLE connection_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites     ENABLE ROW LEVEL SECURITY;

-- Private group message bodies.
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Private photographer-to-photographer cover request messages.
ALTER TABLE cover_requests ENABLE ROW LEVEL SECURITY;

-- Per-user notification settings. Was writable by strangers.
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Every queued recipient email address plus payload jsonb. Highest-exposure
-- table in this set — a harvestable list of the entire user base.
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Internal sync status, fetched ratings, and error messages.
ALTER TABLE trust_sync_log ENABLE ROW LEVEL SECURITY;

-- ─── From 019_photographer_blocks.sql ────────────────────────────────────────

ALTER TABLE photographer_blocks ENABLE ROW LEVEL SECURITY;

-- ─── From 025_client_interests.sql ───────────────────────────────────────────

ALTER TABLE client_interests ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ─── Verification ────────────────────────────────────────────────────────────
-- Run after applying. Every row should show rowsecurity = true.
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

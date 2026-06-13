-- ─────────────────────────────────────────────────────────────────────────────
-- TrueNorth Frames — Wipe all test data, preserve admin accounts
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Trust & OAuth ─────────────────────────────────────────────────────────────
DELETE FROM trust_sync_log;
DELETE FROM trust_signal_snapshots;
DELETE FROM trust_score_breakdown;
DELETE FROM platform_oauth_tokens;

-- ── Groups & connections ──────────────────────────────────────────────────────
DELETE FROM group_message_rate_limits;
DELETE FROM group_messages;
DELETE FROM group_invites;
DELETE FROM group_members;
DELETE FROM connection_groups;
DELETE FROM photographer_connections;
DELETE FROM photographer_blocks;
DELETE FROM client_blocks;
DELETE FROM saved_photographers;
DELETE FROM cover_requests;

-- ── Messages & conversations ──────────────────────────────────────────────────
DELETE FROM message_rate_limits;
DELETE FROM messages;
DELETE FROM conversations;

-- ── Notifications ─────────────────────────────────────────────────────────────
DELETE FROM notifications
  WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM notification_preferences
  WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');

-- ── Support & audit ───────────────────────────────────────────────────────────
DELETE FROM support_tickets;
DELETE FROM admin_audit_log;
DELETE FROM email_queue;

-- ── Reviews & bookings ────────────────────────────────────────────────────────
DELETE FROM reviews;
DELETE FROM booking_cancellation_requests;
DELETE FROM booking_requests;

-- ── Portfolio & profile data ──────────────────────────────────────────────────
DELETE FROM portfolio_videos;
DELETE FROM portfolio_photos;
DELETE FROM portfolio_albums;
DELETE FROM photographer_specialties;
DELETE FROM photographer_faqs;
DELETE FROM photographer_profile_views;
DELETE FROM external_platform_links;
DELETE FROM packages;
DELETE FROM availability_day_status;
DELETE FROM weekly_time_slots;
DELETE FROM client_interests;

-- ── Storage ───────────────────────────────────────────────────────────────────
DELETE FROM storage_assets
  WHERE owner_id NOT IN (SELECT id FROM users WHERE role = 'admin');

-- ── Profiles ──────────────────────────────────────────────────────────────────
DELETE FROM photographer_profiles
  WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM client_profiles
  WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');

-- ── Auth identities ───────────────────────────────────────────────────────────
DELETE FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.users WHERE role = 'admin');

-- ── Public users (non-admin) ──────────────────────────────────────────────────
DELETE FROM public.users WHERE role != 'admin';

COMMIT;

-- Verify:
-- SELECT role, count(*) FROM public.users GROUP BY role;
-- SELECT count(*) FROM photographer_profiles;
-- SELECT count(*) FROM client_profiles;

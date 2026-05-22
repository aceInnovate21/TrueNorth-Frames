-- TrueNorth Frames — Development Seed Data
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- Run after all migrations. Provides test data matching the frontend mock state.

-- ─── Platform Config (all keys from platform-config.ts) ───────────────────────
INSERT INTO platform_config (key, value, value_type, category, description) VALUES
  -- content
  ('max_photographer_bio_length',       '1200',     'integer', 'content',       'Max chars for photographer bio'),
  ('max_client_bio_length',             '500',      'integer', 'content',       'Max chars for client bio'),
  ('max_package_description_length',    '800',      'integer', 'content',       'Max chars for package description'),
  ('max_booking_description_length',    '600',      'integer', 'content',       'Max chars for booking description'),
  ('max_booking_location_note_length',  '255',      'integer', 'content',       'Max chars for booking location note'),
  ('max_photographer_response_length',  '800',      'integer', 'content',       'Max chars for photographer note on booking'),
  ('max_cancellation_note_length',      '400',      'integer', 'content',       'Max chars for cancellation free-text note'),
  ('max_review_body_length',            '1500',     'integer', 'content',       'Max chars for review body'),
  ('max_review_reply_length',           '800',      'integer', 'content',       'Max chars for photographer public reply'),
  ('max_flag_reason_length',            '600',      'integer', 'content',       'Max chars for review flag reason'),
  ('max_review_private_note_length',    '600',      'integer', 'content',       'Max chars for admin private note on review'),
  ('max_cover_request_message_length',  '600',      'integer', 'content',       'Max chars for cover request message'),
  ('max_notification_body_length',      '400',      'integer', 'content',       'Max chars for notification body'),
  ('max_ticket_description_length',     '2000',     'integer', 'content',       'Max chars for support ticket description'),
  ('max_ticket_resolution_note_length', '1000',     'integer', 'content',       'Max chars for ticket resolution note'),
  -- portfolio
  ('max_albums_per_photographer',       '3',        'integer', 'portfolio',     'Max portfolio albums per photographer'),
  ('max_photos_per_photographer',       '50',       'integer', 'portfolio',     'Max photos across all albums'),
  ('max_videos_per_photographer',       '3',        'integer', 'portfolio',     'Max videos across all albums'),
  ('max_videos_per_album',              '2',        'integer', 'portfolio',     'Max videos per album'),
  ('max_photo_bytes',                   '5242880',  'integer', 'portfolio',     'Max photo upload size in bytes (5 MB)'),
  ('max_video_bytes',                   '104857600','integer', 'portfolio',     'Max video upload size in bytes (100 MB)'),
  ('max_avatar_bytes',                  '3145728',  'integer', 'portfolio',     'Max avatar upload size in bytes (3 MB)'),
  ('max_cover_bytes',                   '8388608',  'integer', 'portfolio',     'Max cover image upload size in bytes (8 MB)'),
  ('max_photo_caption_length',          '255',      'integer', 'portfolio',     'Max chars for photo caption'),
  ('max_video_title_length',            '120',      'integer', 'portfolio',     'Max chars for video title'),
  ('max_album_name_length',             '120',      'integer', 'portfolio',     'Max chars for album name'),
  -- packages
  ('max_package_name_length',           '120',      'integer', 'packages',      'Max chars for package name'),
  ('max_packages_per_photographer',     '10',       'integer', 'packages',      'Max packages per photographer'),
  -- faq
  ('max_faqs_per_photographer',         '5',        'integer', 'faq',           'Max FAQs per photographer'),
  ('max_faq_question_length',           '160',      'integer', 'faq',           'Max chars for FAQ question'),
  ('max_faq_answer_length',             '600',      'integer', 'faq',           'Max chars for FAQ answer'),
  -- messaging
  ('max_message_length',                '1000',     'integer', 'messaging',     'Max chars per message (DM and group)'),
  ('max_messages_per_hour',             '20',       'integer', 'messaging',     'Max DMs a client can send per hour'),
  ('max_group_messages_per_hour',       '30',       'integer', 'messaging',     'Max group messages per photographer per hour'),
  ('max_unread_conversations_shown',    '15',       'integer', 'messaging',     'Max unread conversations shown in inbox UI'),
  ('rate_limit_warning_threshold',      '3',        'integer', 'messaging',     'Warn client when N or fewer messages remain this hour'),
  ('spam_auto_suspend_threshold',       '3',        'integer', 'messaging',     'Auto-suspend photographer after N unique client spam reports'),
  ('rate_limit_row_ttl_hours',          '2',        'integer', 'messaging',     'Purge rate limit rows after N hours'),
  -- notifications
  ('max_notification_badge_count',      '99',       'integer', 'notifications', 'Bell badge cap — show "N+" above this number'),
  -- network
  ('max_owned_groups_per_photographer', '2',        'integer', 'network',       'Max groups a photographer can create (joining is unlimited)'),
  -- booking
  ('booking_window_days',               '90',       'integer', 'booking',       'How far ahead clients can book (days)'),
  -- auth
  ('login_max_failed_attempts',         '10',       'integer', 'auth',          'Consecutive failed logins before lockout'),
  ('login_lockout_minutes',             '15',       'integer', 'auth',          'Lockout duration in minutes'),
  ('login_warning_threshold',           '3',        'integer', 'auth',          'Warn when N or fewer attempts remain before lockout'),
  ('password_reset_max_per_hour',       '3',        'integer', 'auth',          'Max password reset emails per hour per account'),
  ('session_access_token_minutes',      '60',       'integer', 'auth',          'Supabase JWT access token TTL (informational)'),
  ('session_refresh_token_days',        '7',        'integer', 'auth',          'Supabase refresh token TTL (informational)'),
  -- api
  ('api_rate_limit_per_minute',         '100',      'integer', 'api',           'Max API requests per IP per minute'),
  ('api_body_size_limit_mb',            '10',       'integer', 'api',           'Next.js body parser limit in MB'),
  ('search_page_size',                  '20',       'integer', 'api',           'Max photographers returned per search page'),
  -- storage
  ('r2_presigned_url_expiry_seconds',   '900',      'integer', 'storage',       'Presigned upload URL TTL in seconds (15 min)'),
  ('r2_orphan_asset_ttl_hours',         '1',        'integer', 'storage',       'Purge unlinked storage assets after N hours'),
  ('notification_retention_days',       '90',       'integer', 'storage',       'Purge read notifications older than N days'),
  ('group_message_retention_days',      '365',      'integer', 'storage',       'Purge group messages older than N days'),
  ('audit_log_archive_after_days',      '730',      'integer', 'storage',       'Archive admin_audit_log rows after N days (2 years)'),
  -- analytics
  ('profile_view_retention_days',       '365',      'integer', 'analytics',     'Purge photographer_profile_views rows older than N days'),
  -- email
  ('max_email_retry_attempts',          '3',        'integer', 'email',         'Max Resend retry attempts before marking failed'),
  -- trust
  ('trust_sync_stale_after_days',       '8',        'integer', 'trust',         'Max days since last fetch before platform link is ignored in trust score')
ON CONFLICT (key) DO NOTHING;

-- ─── Test Users ───────────────────────────────────────────────────────────────
-- NOTE: These are public-schema rows only. Auth records must be created via
-- Supabase Auth (dashboard or supabase auth admin createUser) to get real sessions.
-- UUIDs are stable so foreign keys work across re-seeding.

INSERT INTO users (id, email, role, full_name, account_status, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'client@test.com',       'client',       'Alex Thompson',    'active', true),
  ('00000000-0000-0000-0000-000000000002', 'photographer@test.com', 'photographer', 'Jordan Rivers',    'active', true),
  ('00000000-0000-0000-0000-000000000003', 'admin@test.com',        'admin',        'Sam Admin',        'active', true),
  ('00000000-0000-0000-0000-000000000004', 'priya@test.com',        'client',       'Priya Patel',      'active', true),
  ('00000000-0000-0000-0000-000000000005', 'marcus@test.com',       'photographer', 'Marcus Chen',      'active', true),
  ('00000000-0000-0000-0000-000000000006', 'sofia@test.com',        'photographer', 'Sofia Andersen',   'active', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Photographer Profiles ────────────────────────────────────────────────────
INSERT INTO photographer_profiles (id, user_id, username, display_name, tagline, bio, location, years_experience, profile_status, trust_score, native_avg_rating, native_review_count) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'jordan-rivers',
    'Jordan Rivers',
    'Capturing Edmonton''s golden moments',
    'Award-winning photographer based in Edmonton, AB. Specializing in weddings, portraits, and corporate events with 8 years of professional experience.',
    'Edmonton, AB',
    8,
    'approved',
    87.4,
    4.82,
    47
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000005',
    'marcus-chen',
    'Marcus Chen',
    'Real estate & architecture photography',
    'Architectural and real estate photographer helping Edmonton properties stand out. Clean, professional images that sell.',
    'Edmonton, AB',
    5,
    'approved',
    79.2,
    4.60,
    23
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000006',
    'sofia-andersen',
    'Sofia Andersen',
    'Newborn & family photography',
    'Gentle, timeless newborn and family portraits. Creating heirlooms for Edmonton families since 2018.',
    'Edmonton, AB',
    6,
    'approved',
    92.1,
    4.95,
    61
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Photographer Specialties ─────────────────────────────────────────────────
INSERT INTO photographer_specialties (photographer_id, specialty) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Wedding'),
  ('10000000-0000-0000-0000-000000000001', 'Portrait'),
  ('10000000-0000-0000-0000-000000000001', 'Corporate'),
  ('10000000-0000-0000-0000-000000000002', 'Real Estate'),
  ('10000000-0000-0000-0000-000000000002', 'Architecture'),
  ('10000000-0000-0000-0000-000000000003', 'Newborn'),
  ('10000000-0000-0000-0000-000000000003', 'Family')
ON CONFLICT (photographer_id, specialty) DO NOTHING;

-- ─── Client Profiles ──────────────────────────────────────────────────────────
INSERT INTO client_profiles (user_id, location) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Edmonton, AB'),
  ('00000000-0000-0000-0000-000000000004', 'Edmonton, AB')
ON CONFLICT (user_id) DO NOTHING;

-- ─── Packages ─────────────────────────────────────────────────────────────────
INSERT INTO packages (id, photographer_id, name, description, billing_type, price, duration_minutes, deliverables, is_active, sort_order) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Golden Hour Portrait Session',
    'A 90-minute outdoor session at sunset. Perfect for individuals, couples, or small families.',
    'package', 380.00, 90,
    ARRAY['30 edited photos', 'Online gallery', '2-week delivery'],
    true, 0
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Full Day Wedding Coverage',
    'Complete wedding day coverage from getting ready through first dance.',
    'package', 2800.00, 480,
    ARRAY['400+ edited photos', 'Online gallery', 'USB drive', '4-week delivery'],
    true, 1
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Real Estate Standard',
    'Interior and exterior shots for listings up to 2500 sq ft.',
    'package', 299.00, 120,
    ARRAY['25 edited photos', 'MLS-ready delivery', '48hr turnaround'],
    true, 0
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Booking Requests ─────────────────────────────────────────────────────────
INSERT INTO booking_requests (id, client_id, photographer_id, package_id, occasion, description, billing_type, billing_detail, requested_date, time_slot, status, completed_at) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Engagement Photos',
    'Looking for outdoor engagement photos at Hawrelak Park. Golden hour preferred.',
    'package', 'Golden Hour Portrait Session · $380',
    '2026-06-15', 'Saturday · 6:00 PM – 7:30 PM',
    'pending', NULL
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    NULL,
    'Condo Listing',
    '900 sq ft condo in Oliver. Need photos for MLS listing by end of month.',
    'package', 'Real Estate Standard · $299',
    '2026-05-28', 'Wednesday · 11:00 AM – 1:00 PM',
    'approved', NULL
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    NULL,
    'Newborn Session',
    'Our baby girl arrived May 3rd. Looking for soft, timeless newborn portraits at your studio.',
    'package', 'Newborn Package · $450',
    '2026-05-20', 'Tuesday · 10:00 AM – 12:00 PM',
    'completed', now()
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Conversations & Messages ─────────────────────────────────────────────────
INSERT INTO conversations (id, client_id, photographer_id, booking_id, last_message_at) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    now() - interval '2 hours'
  )
ON CONFLICT (client_id, photographer_id) DO NOTHING;

INSERT INTO messages (conversation_id, sender_id, sender_type, body, read_at) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'client',
    'Hi Jordan! I''d love to book a golden hour engagement session. Are you available June 15th?',
    now() - interval '2 hours'
  ),
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'photographer',
    'Hey Alex! June 15th works perfectly. Hawrelak Park is one of my favourite spots for golden hour. I''ll send over the booking confirmation shortly.',
    NULL
  )
ON CONFLICT DO NOTHING;

-- ─── Feature Flags (defaults off) ─────────────────────────────────────────────
INSERT INTO feature_flags (key, is_enabled, description) VALUES
  ('photographer_network',    false, 'Photographer connections and groups tab'),
  ('cover_requests',          false, 'Photographer-to-photographer cover requests'),
  ('trust_score_display',     true,  'Show trust score on public photographer profiles'),
  ('group_messaging',         false, 'Group messaging within photographer networks'),
  ('external_platform_sync',  false, 'Automated cron sync of Google/Yelp/Facebook ratings')
ON CONFLICT (key) DO NOTHING;

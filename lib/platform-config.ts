// Static fallback values — mirrors every row in the platform_config DB table.
// Server components: use getPlatformConfig() from lib/get-platform-config.ts (live DB, 5-min cache).
// Client components: import PLATFORM_CONFIG directly (these static values).

export const PLATFORM_CONFIG = {

  // ── content ──────────────────────────────────────────────────────────────
  max_photographer_bio_length:          1200,
  max_client_bio_length:                500,
  max_package_name_length:              120,
  max_package_description_length:       800,
  max_booking_description_length:       600,
  max_booking_location_note_length:     255,
  max_photographer_response_length:     800,
  max_cancellation_note_length:         400,
  max_review_body_length:               1500,
  max_review_reply_length:              800,
  max_flag_reason_length:               600,
  max_review_private_note_length:       600,
  max_cover_request_message_length:     600,
  max_notification_body_length:         400,
  max_ticket_description_length:        2000,
  max_ticket_resolution_note_length:    1000,

  // ── messaging ─────────────────────────────────────────────────────────────
  max_message_length:                   1000,
  max_messages_per_hour:                20,   // DM cap (client → photographer)
  max_group_messages_per_hour:          30,   // group chat cap (photographer sender) — higher, collaborative context
  max_unread_conversations_shown:       15,
  rate_limit_warning_threshold:         3,    // warn when ≤ N messages remaining this hour
  spam_auto_suspend_threshold:          3,    // unique-client reports before auto-suspend
  rate_limit_row_ttl_hours:             2,
  max_notification_badge_count:         99,   // bell badge display cap — UI shows "N+" above this

  // ── faq ───────────────────────────────────────────────────────────────────
  max_faqs_per_photographer:            5,
  max_faq_question_length:              160,
  max_faq_answer_length:                600,

  // ── portfolio ─────────────────────────────────────────────────────────────
  max_albums_per_photographer:          3,
  max_photos_per_photographer:          150,  // byte quota is the real governor; this is a sanity bound
  max_videos_per_photographer:          3,
  max_videos_per_album:                 2,
  // Per-photographer STORED (post-compression) budget. Keeps the whole
  // marketplace under the R2 free-tier / budget-guard ceiling: 10 × 500 MB = 5 GB.
  max_storage_bytes_per_photographer:   500 * 1024 * 1024,  // 500 MB
  // Ceiling on the COMPRESSED artefact accepted by presign. Photos are
  // compressed to WebP in the browser before upload, so the raw source has no
  // user-facing size limit — this just guards against absurd/abusive payloads.
  max_compressed_photo_bytes:           15 * 1024 * 1024,   // 15 MB
  max_photo_bytes:                      5  * 1024 * 1024,   // 5 MB (legacy server-side POST path)
  max_video_bytes:                      100 * 1024 * 1024,  // 100 MB (raw video, direct-to-R2)
  max_avatar_bytes:                     3  * 1024 * 1024,   // 3 MB
  max_cover_bytes:                      8  * 1024 * 1024,   // 8 MB
  max_photo_caption_length:             255,
  max_video_title_length:               120,
  max_album_name_length:                120,

  // ── packages ──────────────────────────────────────────────────────────────
  max_packages_per_photographer:        3,

  // ── network ───────────────────────────────────────────────────────────────
  max_owned_groups_per_photographer:    2,   // cap on groups you CREATE — joining others is unlimited

  // ── booking ───────────────────────────────────────────────────────────────
  booking_window_days:                  90,

  // ── auth ──────────────────────────────────────────────────────────────────
  login_max_failed_attempts:            10,
  login_lockout_minutes:                15,
  login_warning_threshold:              3,    // warn when ≤ N attempts remaining before lockout
  password_reset_max_per_hour:          3,
  session_access_token_minutes:         60,
  session_refresh_token_days:           7,

  // ── api ───────────────────────────────────────────────────────────────────
  api_rate_limit_per_minute:            100,
  api_body_size_limit_mb:               10,
  search_page_size:                     20,

  // ── storage ───────────────────────────────────────────────────────────────
  r2_presigned_url_expiry_seconds:      900,   // 15 min
  r2_orphan_asset_ttl_hours:            1,
  notification_retention_days:          90,
  group_message_retention_days:         365,
  audit_log_archive_after_days:         730,

  // ── email ─────────────────────────────────────────────────────────────────
  max_email_retry_attempts:             3,

  // ── trust ─────────────────────────────────────────────────────────────────
  trust_sync_stale_after_days:          8,

  // ── analytics ─────────────────────────────────────────────────────────────
  profile_view_retention_days:          365,  // cron purges photographer_profile_views rows older than this

} as const

export type PlatformConfigKey = keyof typeof PLATFORM_CONFIG

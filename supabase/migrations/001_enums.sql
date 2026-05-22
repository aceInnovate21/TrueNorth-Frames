-- Migration 001: All enums
-- Run first — tables depend on these types

CREATE TYPE user_role AS ENUM ('client', 'photographer', 'admin');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'banned', 'deactivated');
CREATE TYPE photographer_profile_status AS ENUM ('draft', 'pending', 'approved', 'suspended', 'banned');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'declined', 'cancelled', 'cancellation_pending', 'completed');
CREATE TYPE cancellation_actor AS ENUM ('client', 'photographer', 'admin');
CREATE TYPE billing_type AS ENUM ('hourly', 'package');
CREATE TYPE availability_status AS ENUM ('available', 'tentative', 'busy');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE group_invite_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE cover_request_status AS ENUM ('pending', 'accepted', 'declined', 'withdrawn');
CREATE TYPE review_flag_status AS ENUM ('none', 'flagged', 'flag_resolved');
CREATE TYPE platform_name AS ENUM ('google', 'yelp', 'facebook', 'instagram');
CREATE TYPE trust_sync_status AS ENUM ('success', 'partial', 'failed');
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_review', 'resolved', 'closed');
CREATE TYPE support_ticket_category AS ENUM (
  'fake_review', 'inappropriate_content', 'spam_report',
  'billing_dispute', 'account_issue', 'other'
);
CREATE TYPE notification_type AS ENUM (
  'booking_request', 'booking_approved', 'booking_declined', 'booking_cancelled',
  'booking_completed', 'new_message', 'connection_request', 'connection_accepted',
  'group_invite', 'review_received', 'review_reply', 'trust_score_updated'
);
CREATE TYPE message_sender_type AS ENUM ('client', 'photographer');
CREATE TYPE email_queue_status AS ENUM ('queued', 'sent', 'failed');
CREATE TYPE platform_config_type AS ENUM ('integer', 'numeric', 'boolean', 'text');

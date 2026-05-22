-- Migration 005: Messaging, network, notifications, support, trust
-- Depends on: 004_bookings_reviews.sql

-- ─── Conversations ────────────────────────────────────────────────────────────
CREATE TABLE conversations (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid          REFERENCES booking_requests(id),
  client_id       uuid          NOT NULL REFERENCES users(id),
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id),
  last_message_at timestamptz,
  is_frozen       boolean       DEFAULT false,
  is_flagged      boolean       DEFAULT false,
  flag_reason     text,
  flagged_at      timestamptz,
  flagged_by      uuid          REFERENCES users(id),
  frozen_at       timestamptz,
  frozen_by       uuid          REFERENCES users(id),
  created_at      timestamptz   DEFAULT now(),
  CONSTRAINT idx_conv_participants UNIQUE (client_id, photographer_id)
);
CREATE INDEX idx_conv_last_message ON conversations(last_message_at);
CREATE INDEX idx_conv_flagged ON conversations(is_flagged);

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid                NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid                NOT NULL REFERENCES users(id),
  sender_type     message_sender_type NOT NULL,
  body            text                NOT NULL,
  read_at         timestamptz,
  created_at      timestamptz         DEFAULT now()
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages(sender_id, read_at);

-- ─── Message Rate Limits ──────────────────────────────────────────────────────
CREATE TABLE message_rate_limits (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hour_bucket   bigint      NOT NULL,
  message_count smallint    NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (client_id, hour_bucket)
);

-- ─── Client Blocks ────────────────────────────────────────────────────────────
CREATE TABLE client_blocks (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  blocked_at      timestamptz   DEFAULT now(),
  block_reason    varchar(120),
  UNIQUE (client_id, photographer_id)
);
CREATE INDEX idx_blocks_photographer ON client_blocks(photographer_id);

-- ─── Saved Photographers ──────────────────────────────────────────────────────
CREATE TABLE saved_photographers (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  saved_at        timestamptz   DEFAULT now(),
  UNIQUE (client_id, photographer_id)
);

-- ─── Photographer Connections ─────────────────────────────────────────────────
CREATE TABLE photographer_connections (
  id            uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid              NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  addressee_id  uuid              NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  status        connection_status NOT NULL DEFAULT 'pending',
  requested_at  timestamptz       DEFAULT now(),
  responded_at  timestamptz,
  UNIQUE (requester_id, addressee_id)
);
CREATE INDEX idx_connections_status ON photographer_connections(status);

-- ─── Connection Groups ────────────────────────────────────────────────────────
CREATE TABLE connection_groups (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  name         varchar(120)  NOT NULL,
  emoji        varchar(8),
  description  text,
  member_count integer       DEFAULT 1,
  created_at   timestamptz   DEFAULT now(),
  updated_at   timestamptz   DEFAULT now()
);
CREATE TRIGGER connection_groups_updated_at BEFORE UPDATE ON connection_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE group_members (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid          NOT NULL REFERENCES connection_groups(id) ON DELETE CASCADE,
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  joined_at       timestamptz   DEFAULT now(),
  is_owner        boolean       DEFAULT false,
  UNIQUE (group_id, photographer_id)
);

CREATE TABLE group_invites (
  id           uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid                NOT NULL REFERENCES connection_groups(id) ON DELETE CASCADE,
  inviter_id   uuid                NOT NULL REFERENCES photographer_profiles(id),
  invitee_id   uuid                NOT NULL REFERENCES photographer_profiles(id),
  status       group_invite_status NOT NULL DEFAULT 'pending',
  invited_at   timestamptz         DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT idx_group_invite_unique UNIQUE (group_id, invitee_id)
);
CREATE INDEX idx_group_invites_invitee ON group_invites(invitee_id);

CREATE TABLE group_messages (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid          NOT NULL REFERENCES connection_groups(id) ON DELETE CASCADE,
  sender_id  uuid          NOT NULL REFERENCES photographer_profiles(id),
  body       varchar(1000) NOT NULL,
  created_at timestamptz   DEFAULT now()
);
CREATE INDEX idx_group_messages ON group_messages(group_id, created_at);
CREATE INDEX idx_group_messages_sender ON group_messages(sender_id);

CREATE TABLE group_message_rate_limits (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     uuid        NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  hour_bucket   bigint      NOT NULL,
  message_count smallint    NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (sender_id, hour_bucket)
);

-- ─── Cover Requests ───────────────────────────────────────────────────────────
CREATE TABLE cover_requests (
  id           uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid                  NOT NULL REFERENCES photographer_profiles(id),
  recipient_id uuid                  NOT NULL REFERENCES photographer_profiles(id),
  booking_id   uuid                  REFERENCES booking_requests(id),
  message      varchar(600),
  status       cover_request_status  NOT NULL DEFAULT 'pending',
  created_at   timestamptz           DEFAULT now(),
  responded_at timestamptz
);
CREATE INDEX idx_cover_requester ON cover_requests(requester_id, booking_id);
CREATE INDEX idx_cover_recipient ON cover_requests(recipient_id);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       varchar(160)      NOT NULL,
  body        varchar(400),
  read_at     timestamptz,
  expires_at  timestamptz,
  entity_type varchar(40),
  entity_id   uuid,
  created_at  timestamptz       DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at);
CREATE INDEX idx_notifications_expiry ON notifications(user_id, expires_at);
CREATE INDEX idx_notifications_entity ON notifications(entity_id);

CREATE TABLE notification_preferences (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid          UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_booking       boolean       DEFAULT true,
  email_messages      boolean       DEFAULT true,
  email_connections   boolean       DEFAULT true,
  email_reviews       boolean       DEFAULT true,
  email_trust_updates boolean       DEFAULT false,
  push_booking        boolean       DEFAULT true,
  push_messages       boolean       DEFAULT true,
  push_connections    boolean       DEFAULT true,
  updated_at          timestamptz   DEFAULT now()
);

-- ─── External Platform Trust ──────────────────────────────────────────────────
CREATE TABLE external_platform_links (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id       uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  platform              platform_name NOT NULL,
  profile_url           text          NOT NULL,
  platform_rating       numeric(3,2),
  platform_review_count integer,
  is_verified           boolean       DEFAULT false,
  last_fetched_at       timestamptz,
  created_at            timestamptz   DEFAULT now(),
  UNIQUE (photographer_id, platform)
);

CREATE TABLE trust_sync_log (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid              NOT NULL REFERENCES photographer_profiles(id),
  platform        platform_name     NOT NULL,
  status          trust_sync_status NOT NULL,
  fetched_rating  numeric(3,2),
  fetched_count   integer,
  error_message   text,
  synced_at       timestamptz       DEFAULT now()
);
CREATE INDEX idx_trust_sync ON trust_sync_log(photographer_id, synced_at);

-- ─── Support & Admin ──────────────────────────────────────────────────────────
CREATE TABLE support_tickets (
  id               uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by     uuid                    NOT NULL REFERENCES users(id),
  review_id        uuid                    REFERENCES reviews(id),
  conversation_id  uuid                    REFERENCES conversations(id),
  reported_user_id uuid                    REFERENCES users(id),
  spam_reason      varchar(120),
  spam_report_count smallint,
  category         support_ticket_category NOT NULL,
  subject          varchar(200)            NOT NULL,
  description      varchar(2000)           NOT NULL,
  status           support_ticket_status   NOT NULL DEFAULT 'open',
  assigned_to      uuid                    REFERENCES users(id),
  resolution_note  varchar(1000),
  created_at       timestamptz             DEFAULT now(),
  updated_at       timestamptz             DEFAULT now(),
  resolved_at      timestamptz
);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_submitter ON support_tickets(submitted_by);
CREATE INDEX idx_tickets_review ON support_tickets(review_id);
CREATE INDEX idx_tickets_conversation ON support_tickets(conversation_id);
CREATE INDEX idx_tickets_reported ON support_tickets(reported_user_id);
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE admin_audit_log (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid          NOT NULL REFERENCES users(id),
  action      varchar(80)   NOT NULL,
  entity_type varchar(40)   NOT NULL,
  entity_id   uuid          NOT NULL,
  notes       text,
  ip_address  inet,
  created_at  timestamptz   DEFAULT now()
);
CREATE INDEX idx_audit_actor ON admin_audit_log(actor_id, created_at);
CREATE INDEX idx_audit_entity ON admin_audit_log(entity_id);

-- ─── Email Queue ──────────────────────────────────────────────────────────────
CREATE TABLE email_queue (
  id               uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email         varchar(255)       NOT NULL,
  template_id      varchar(80)        NOT NULL,
  payload          jsonb              NOT NULL,
  status           email_queue_status NOT NULL DEFAULT 'queued',
  attempts         smallint           DEFAULT 0,
  last_attempted_at timestamptz,
  sent_at          timestamptz,
  error            text,
  created_at       timestamptz        DEFAULT now()
);
CREATE INDEX idx_email_queue_status ON email_queue(status, created_at);

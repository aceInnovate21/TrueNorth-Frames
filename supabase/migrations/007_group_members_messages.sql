-- Migration: ensure group_members and group_messages exist
-- These tables may already exist from 005_messaging_network.sql
-- Using CREATE TABLE IF NOT EXISTS for idempotency

CREATE TABLE IF NOT EXISTS group_members (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid        NOT NULL REFERENCES connection_groups(id) ON DELETE CASCADE,
  photographer_id uuid        NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  joined_at       timestamptz DEFAULT now(),
  is_owner        boolean     DEFAULT false,
  UNIQUE (group_id, photographer_id)
);

CREATE TABLE IF NOT EXISTS group_invites (
  id           uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid                NOT NULL REFERENCES connection_groups(id) ON DELETE CASCADE,
  inviter_id   uuid                NOT NULL REFERENCES photographer_profiles(id),
  invitee_id   uuid                NOT NULL REFERENCES photographer_profiles(id),
  status       group_invite_status NOT NULL DEFAULT 'pending',
  invited_at   timestamptz         DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT idx_group_invite_unique UNIQUE (group_id, invitee_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid          NOT NULL REFERENCES connection_groups(id) ON DELETE CASCADE,
  sender_id  uuid          NOT NULL REFERENCES photographer_profiles(id),
  body       varchar(1000) NOT NULL,
  created_at timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_members_group    ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_phot     ON group_members(photographer_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_invitee  ON group_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group   ON group_messages(group_id, created_at);

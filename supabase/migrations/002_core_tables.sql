-- Migration 002: Core identity tables
-- Depends on: 001_enums.sql

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                          uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  email                       varchar(255)    UNIQUE NOT NULL,
  role                        user_role       NOT NULL,
  full_name                   varchar(120)    NOT NULL,
  avatar_url                  text,
  account_status              account_status  NOT NULL DEFAULT 'active',
  status_reason               text,
  status_changed_at           timestamptz,
  status_changed_by           uuid            REFERENCES users(id),
  is_verified                 boolean         DEFAULT false,
  failed_login_count          smallint        DEFAULT 0,
  locked_until                timestamptz,
  password_reset_count        smallint        DEFAULT 0,
  password_reset_window_start timestamptz,
  created_at                  timestamptz     DEFAULT now(),
  updated_at                  timestamptz     DEFAULT now(),
  last_active_at              timestamptz,
  deleted_at                  timestamptz
);

-- ─── Client Profiles ──────────────────────────────────────────────────────────
CREATE TABLE client_profiles (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio             varchar(500),
  location        varchar(120),
  preferred_style varchar(80),
  avatar_url      text
);

-- ─── Photographer Profiles ────────────────────────────────────────────────────
CREATE TABLE photographer_profiles (
  id                        uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid                        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username                  varchar(40)                 UNIQUE NOT NULL,
  display_name              varchar(120)                NOT NULL,
  tagline                   varchar(160),
  bio                       varchar(1200),
  location                  varchar(120),
  years_experience          smallint,
  avatar_url                text,
  cover_image_url           text,
  instagram_url             text,
  website_url               text,
  rate_display              varchar(40),
  rate_note                 varchar(160),
  trust_score               numeric(4,1)                DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  native_avg_rating         numeric(3,2)                DEFAULT 0 CHECK (native_avg_rating BETWEEN 0 AND 5),
  native_review_count       integer                     DEFAULT 0,
  last_trust_sync_at        timestamptz,
  profile_view_count        integer                     DEFAULT 0,
  completeness_score        smallint                    DEFAULT 0,
  profile_status            photographer_profile_status NOT NULL DEFAULT 'draft',
  submitted_for_review_at   timestamptz,
  approved_at               timestamptz,
  approved_by               uuid                        REFERENCES users(id),
  status_note               text,
  created_at                timestamptz                 DEFAULT now(),
  updated_at                timestamptz                 DEFAULT now()
);

-- ─── Photographer Specialties ─────────────────────────────────────────────────
CREATE TABLE photographer_specialties (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  specialty       varchar(60)   NOT NULL,
  UNIQUE (photographer_id, specialty)
);
CREATE INDEX idx_specialty ON photographer_specialties(specialty);

-- ─── Profile Views ────────────────────────────────────────────────────────────
CREATE TABLE photographer_profile_views (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id     uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  viewer_id           uuid          REFERENCES users(id),
  viewer_role         varchar(20),
  viewer_fingerprint  varchar(64)   NOT NULL,
  view_date           date          NOT NULL,
  referrer_type       varchar(40),
  viewed_at           timestamptz   DEFAULT now(),
  CONSTRAINT idx_profile_view_dedup UNIQUE (photographer_id, viewer_fingerprint, view_date)
);
CREATE INDEX idx_profile_view_window ON photographer_profile_views(photographer_id, view_date);
CREATE INDEX idx_profile_view_viewer ON photographer_profile_views(viewer_id);

-- ─── Platform Config ──────────────────────────────────────────────────────────
CREATE TABLE platform_config (
  id          uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  key         varchar(80)           UNIQUE NOT NULL,
  value       text                  NOT NULL,
  value_type  platform_config_type  NOT NULL,
  category    varchar(40)           NOT NULL,
  description text,
  updated_at  timestamptz           DEFAULT now(),
  updated_by  uuid                  REFERENCES users(id)
);
CREATE INDEX idx_platform_config_category ON platform_config(category);

-- ─── Feature Flags ────────────────────────────────────────────────────────────
CREATE TABLE feature_flags (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  key         varchar(80)   UNIQUE NOT NULL,
  is_enabled  boolean       DEFAULT false,
  description text,
  updated_at  timestamptz   DEFAULT now(),
  updated_by  uuid          REFERENCES users(id)
);

-- ─── Storage Assets ───────────────────────────────────────────────────────────
CREATE TABLE storage_assets (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bucket            varchar(60)   NOT NULL,
  key               text          NOT NULL,
  content_type      varchar(80),
  size_bytes        bigint,
  entity_type       varchar(40),
  entity_id         uuid,
  orphan_expires_at timestamptz,
  created_at        timestamptz   DEFAULT now(),
  UNIQUE (bucket, key)
);
CREATE INDEX idx_storage_owner ON storage_assets(owner_id, entity_type);
CREATE INDEX idx_storage_orphan ON storage_assets(entity_id, orphan_expires_at);

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER photographer_profiles_updated_at BEFORE UPDATE ON photographer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER platform_config_updated_at BEFORE UPDATE ON platform_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

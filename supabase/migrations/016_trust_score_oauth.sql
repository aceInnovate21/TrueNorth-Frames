-- Migration 016: Trust Score OAuth + Signal Storage
-- Depends on: 015_standalone_portfolio.sql

-- ─── Widen platform_name enum ─────────────────────────────────────────────────
-- Add 'facebook' already exists in 001; add nothing new to enum here (all covered).
-- We track instagram via Graph API — same 'instagram' enum value.

-- ─── OAuth tokens (encrypted at rest via Supabase Vault in prod) ──────────────
CREATE TABLE platform_oauth_tokens (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id  uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  platform         platform_name NOT NULL,
  access_token     text          NOT NULL,
  refresh_token    text,
  token_expires_at timestamptz,
  scope            text,
  platform_user_id text,
  platform_username text,
  is_active        boolean       DEFAULT true,
  connected_at     timestamptz   DEFAULT now(),
  last_refreshed_at timestamptz,
  UNIQUE (photographer_id, platform)
);
CREATE INDEX idx_oauth_tokens_platform ON platform_oauth_tokens(platform, is_active);

-- ─── Trust signal snapshots (one row per sync per platform) ───────────────────
CREATE TABLE trust_signal_snapshots (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id      uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  platform             platform_name NOT NULL,
  -- Common signals
  follower_count       integer,
  following_count      integer,
  post_count           integer,
  account_age_days     integer,
  is_verified          boolean,
  -- Engagement signals
  avg_likes_per_post   numeric(10,2),
  avg_comments_per_post numeric(10,2),
  engagement_rate      numeric(6,4),   -- 0.0000–1.0000
  -- Review signals
  review_rating        numeric(3,2),
  review_count         integer,
  -- Posting consistency (0–1 score)
  posting_consistency  numeric(4,3),
  -- Raw score contribution from this platform (0–100)
  platform_score       numeric(5,2),
  snapped_at           timestamptz   DEFAULT now()
);
CREATE INDEX idx_trust_snapshots_photographer ON trust_signal_snapshots(photographer_id, snapped_at DESC);
CREATE INDEX idx_trust_snapshots_platform ON trust_signal_snapshots(photographer_id, platform, snapped_at DESC);

-- ─── Trust score breakdown (current, one row per photographer) ────────────────
CREATE TABLE trust_score_breakdown (
  photographer_id      uuid          PRIMARY KEY REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  total_score          numeric(5,2)  NOT NULL DEFAULT 0,
  -- Per-pillar weighted scores (each 0–100 before weighting)
  platform_score       numeric(5,2)  DEFAULT 0,   -- social proof (instagram/facebook)
  review_score         numeric(5,2)  DEFAULT 0,   -- google + native reviews
  activity_score       numeric(5,2)  DEFAULT 0,   -- posting consistency, account age
  verification_score   numeric(5,2)  DEFAULT 0,   -- verified account, profile completeness
  -- Signal detail JSON for dashboard display
  signals              jsonb         DEFAULT '{}',
  last_computed_at     timestamptz   DEFAULT now()
);

-- ─── Extend external_platform_links with richer data ─────────────────────────
ALTER TABLE external_platform_links
  ADD COLUMN IF NOT EXISTS follower_count       integer,
  ADD COLUMN IF NOT EXISTS following_count      integer,
  ADD COLUMN IF NOT EXISTS post_count           integer,
  ADD COLUMN IF NOT EXISTS account_age_days     integer,
  ADD COLUMN IF NOT EXISTS engagement_rate      numeric(6,4),
  ADD COLUMN IF NOT EXISTS posting_consistency  numeric(4,3),
  ADD COLUMN IF NOT EXISTS platform_user_id     text,
  ADD COLUMN IF NOT EXISTS platform_username    text,
  ADD COLUMN IF NOT EXISTS is_oauth_connected   boolean DEFAULT false;

-- ─── Extend trust_sync_log with richer error context ─────────────────────────
ALTER TABLE trust_sync_log
  ADD COLUMN IF NOT EXISTS signals_fetched  jsonb,
  ADD COLUMN IF NOT EXISTS score_before     numeric(5,2),
  ADD COLUMN IF NOT EXISTS score_after      numeric(5,2);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE platform_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oauth_tokens: own read/write" ON platform_oauth_tokens
  FOR ALL USING (
    photographer_id IN (
      SELECT id FROM photographer_profiles WHERE user_id = auth.uid()
    )
  );

ALTER TABLE trust_signal_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trust_snapshots: own read" ON trust_signal_snapshots
  FOR SELECT USING (
    photographer_id IN (
      SELECT id FROM photographer_profiles WHERE user_id = auth.uid()
    )
  );

ALTER TABLE trust_score_breakdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trust_breakdown: own read" ON trust_score_breakdown
  FOR SELECT USING (
    photographer_id IN (
      SELECT id FROM photographer_profiles WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "trust_breakdown: public read approved" ON trust_score_breakdown
  FOR SELECT USING (
    photographer_id IN (
      SELECT id FROM photographer_profiles WHERE profile_status = 'approved'
    )
  );

-- Migration 003: Portfolio, packages, FAQ, availability
-- Depends on: 002_core_tables.sql

-- ─── Portfolio Albums ─────────────────────────────────────────────────────────
CREATE TABLE portfolio_albums (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  title           varchar(120)  NOT NULL,
  description     text,
  cover_photo_id  uuid,         -- circular ref set after first photo insert
  sort_order      smallint      DEFAULT 0,
  is_published    boolean       DEFAULT false,
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now()
);
CREATE INDEX idx_albums_photographer ON portfolio_albums(photographer_id, sort_order);
CREATE TRIGGER portfolio_albums_updated_at BEFORE UPDATE ON portfolio_albums FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Portfolio Photos ─────────────────────────────────────────────────────────
CREATE TABLE portfolio_photos (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id         uuid          NOT NULL REFERENCES portfolio_albums(id) ON DELETE CASCADE,
  photographer_id  uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  storage_asset_id uuid          NOT NULL REFERENCES storage_assets(id),
  caption          varchar(255),
  alt_text         varchar(255),
  sort_order       smallint      DEFAULT 0,
  width_px         integer,
  height_px        integer,
  uploaded_at      timestamptz   DEFAULT now()
);
CREATE INDEX idx_photos_album ON portfolio_photos(album_id, sort_order);
CREATE INDEX idx_photos_photographer ON portfolio_photos(photographer_id);

-- Set cover_photo_id FK now that portfolio_photos exists
ALTER TABLE portfolio_albums ADD CONSTRAINT fk_cover_photo
  FOREIGN KEY (cover_photo_id) REFERENCES portfolio_photos(id) ON DELETE SET NULL;

-- ─── Portfolio Videos ─────────────────────────────────────────────────────────
CREATE TABLE portfolio_videos (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id           uuid          NOT NULL REFERENCES portfolio_albums(id) ON DELETE CASCADE,
  photographer_id    uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  storage_asset_id   uuid          NOT NULL REFERENCES storage_assets(id),
  thumbnail_asset_id uuid          REFERENCES storage_assets(id),
  title              varchar(120),
  caption            varchar(255),
  duration_seconds   smallint,
  sort_order         smallint      DEFAULT 0,
  uploaded_at        timestamptz   DEFAULT now()
);
CREATE INDEX idx_videos_album ON portfolio_videos(album_id, sort_order);
CREATE INDEX idx_videos_photographer ON portfolio_videos(photographer_id);

-- ─── FAQs ─────────────────────────────────────────────────────────────────────
CREATE TABLE photographer_faqs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  question        varchar(160)  NOT NULL,
  answer          varchar(600)  NOT NULL,
  sort_order      smallint      NOT NULL DEFAULT 0,
  is_published    boolean       DEFAULT true,
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now()
);
CREATE INDEX idx_faqs_photographer ON photographer_faqs(photographer_id, sort_order);
CREATE TRIGGER photographer_faqs_updated_at BEFORE UPDATE ON photographer_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Packages ─────────────────────────────────────────────────────────────────
CREATE TABLE packages (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  name            varchar(120)  NOT NULL,
  description     varchar(800),
  billing_type    billing_type  NOT NULL,
  price           numeric(10,2) NOT NULL CHECK (price >= 0),
  duration_minutes integer      CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  deliverables    text[],
  is_active       boolean       DEFAULT true,
  sort_order      smallint      DEFAULT 0,
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now()
);
CREATE TRIGGER packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Availability ─────────────────────────────────────────────────────────────
CREATE TABLE availability_day_status (
  id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid                NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  date            date                NOT NULL,
  status          availability_status NOT NULL,
  note            varchar(255),
  UNIQUE (photographer_id, date)
);

CREATE TABLE weekly_time_slots (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid          NOT NULL REFERENCES photographer_profiles(id) ON DELETE CASCADE,
  day_of_week     smallint      NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      time          NOT NULL,
  end_time        time          NOT NULL CHECK (end_time > start_time),
  slot_label      varchar(60)   NOT NULL,
  max_clients     smallint      NOT NULL DEFAULT 1,
  is_active       boolean       DEFAULT true,
  UNIQUE (photographer_id, day_of_week, start_time)
);

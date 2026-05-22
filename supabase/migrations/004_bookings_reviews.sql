-- Migration 004: Bookings and reviews
-- Depends on: 003_portfolio_packages.sql

-- ─── Booking Requests ─────────────────────────────────────────────────────────
CREATE TABLE booking_requests (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid            NOT NULL REFERENCES users(id),
  photographer_id     uuid            NOT NULL REFERENCES photographer_profiles(id),
  package_id          uuid            REFERENCES packages(id),
  time_slot_id        uuid            REFERENCES weekly_time_slots(id),
  occasion            varchar(120)    NOT NULL,
  description         varchar(600),
  billing_type        billing_type    NOT NULL,
  billing_detail      varchar(120),
  requested_date      date            NOT NULL,
  time_slot           varchar(80)     NOT NULL,
  location_note       varchar(255),
  status              booking_status  NOT NULL DEFAULT 'pending',
  photographer_note   varchar(800),
  cancellation_reason varchar(120),
  cancellation_note   varchar(400),
  completed_at        timestamptz,
  created_at          timestamptz     DEFAULT now(),
  updated_at          timestamptz     DEFAULT now()
);
CREATE INDEX idx_booking_client_photographer_date ON booking_requests(client_id, photographer_id, requested_date);
CREATE INDEX idx_booking_status ON booking_requests(status);
CREATE INDEX idx_booking_photographer_date ON booking_requests(photographer_id, requested_date);
CREATE TRIGGER booking_requests_updated_at BEFORE UPDATE ON booking_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Booking Cancellation Requests ────────────────────────────────────────────
CREATE TABLE booking_cancellation_requests (
  id                    uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            uuid                NOT NULL REFERENCES booking_requests(id),
  requested_by          uuid                NOT NULL REFERENCES users(id),
  actor                 cancellation_actor  NOT NULL,
  reason                varchar(120)        NOT NULL,
  note                  varchar(400),
  photographer_response varchar(20),
  responded_at          timestamptz,
  resolved_at           timestamptz,
  created_at            timestamptz         DEFAULT now()
);
CREATE INDEX idx_cancellation_booking ON booking_cancellation_requests(booking_id);
CREATE INDEX idx_cancellation_requester ON booking_cancellation_requests(requested_by);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id               uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid                UNIQUE NOT NULL REFERENCES booking_requests(id),
  client_id        uuid                NOT NULL REFERENCES users(id),
  photographer_id  uuid                NOT NULL REFERENCES photographer_profiles(id),
  rating           smallint            NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body             varchar(1500),
  public_reply     varchar(800),
  replied_at       timestamptz,
  flag_status      review_flag_status  NOT NULL DEFAULT 'none',
  flag_reason      varchar(600),
  flag_submitted_at timestamptz,
  flag_resolved_at  timestamptz,
  flag_resolved_by  uuid               REFERENCES users(id),
  private_note     varchar(600),
  created_at       timestamptz         DEFAULT now(),
  updated_at       timestamptz         DEFAULT now()
);
CREATE INDEX idx_reviews_photographer ON reviews(photographer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_flag ON reviews(flag_status);
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

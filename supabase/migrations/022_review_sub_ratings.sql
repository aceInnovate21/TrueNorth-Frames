-- Migration 022: Two-way structured reviews
-- Adds sub-ratings (client → photographer) and photographer-on-client private review

ALTER TABLE reviews
  -- Sub-ratings from client (all optional)
  ADD COLUMN communication_rating  smallint CHECK (communication_rating BETWEEN 1 AND 5),
  ADD COLUMN quality_rating        smallint CHECK (quality_rating BETWEEN 1 AND 5),
  ADD COLUMN value_rating          smallint CHECK (value_rating BETWEEN 1 AND 5),
  ADD COLUMN punctuality_rating    smallint CHECK (punctuality_rating BETWEEN 1 AND 5),

  -- Photographer's private review of the client (never shown publicly)
  ADD COLUMN client_review_rating  smallint CHECK (client_review_rating BETWEEN 1 AND 5),
  ADD COLUMN client_review_body    varchar(600),
  ADD COLUMN client_review_at      timestamptz;

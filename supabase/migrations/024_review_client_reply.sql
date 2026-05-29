-- Migration 024: Client reply to photographer's public reply on a review

ALTER TABLE reviews
  ADD COLUMN client_reply      varchar(800),
  ADD COLUMN client_replied_at timestamptz;

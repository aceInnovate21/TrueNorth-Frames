-- Migration 025: Client photography interests
CREATE TABLE client_interests (
  user_id   uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest  varchar(80)   NOT NULL,
  PRIMARY KEY (user_id, interest)
);
CREATE INDEX idx_client_interests_user ON client_interests(user_id);

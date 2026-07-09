-- Migration 033: Private message attachments
--
-- Message/group attachments move to a private R2 bucket, served via short-lived
-- signed URLs. We store the R2 object KEY (not a public URL); the URL is
-- generated on read. Legacy rows keep their public attachment_url as a fallback.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_key text;

ALTER TABLE group_messages
  ADD COLUMN IF NOT EXISTS attachment_key text;

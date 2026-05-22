-- Add attachment support to client↔photographer messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_url  text,
  ADD COLUMN IF NOT EXISTS attachment_type varchar(20),   -- 'image' | 'video' | 'pdf'
  ADD COLUMN IF NOT EXISTS attachment_name varchar(255),
  ADD COLUMN IF NOT EXISTS attachment_size integer;       -- bytes (post-compression)

-- Add attachment support to photographer group messages
ALTER TABLE group_messages
  ADD COLUMN IF NOT EXISTS attachment_url  text,
  ADD COLUMN IF NOT EXISTS attachment_type varchar(20),
  ADD COLUMN IF NOT EXISTS attachment_name varchar(255),
  ADD COLUMN IF NOT EXISTS attachment_size integer;

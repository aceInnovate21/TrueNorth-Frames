-- Add banner_url to packages table for photographer-uploaded banner images
ALTER TABLE packages ADD COLUMN IF NOT EXISTS banner_url text DEFAULT NULL;

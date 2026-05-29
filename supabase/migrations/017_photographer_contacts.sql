-- Add manual social link columns to photographer_profiles
-- (website_url already exists; these are for manually-entered Instagram/Facebook URLs,
--  separate from OAuth-connected data in external_platform_links)
ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS contact_instagram_url text,
  ADD COLUMN IF NOT EXISTS contact_facebook_url  text;

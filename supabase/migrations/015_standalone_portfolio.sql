-- Migration 015: Make album_id nullable on portfolio_photos and portfolio_videos
-- Allows photographers to upload standalone photos/videos without creating an album first.
-- When an album is deleted, its photos/videos become standalone (album_id → null) instead of cascading.

-- portfolio_photos: drop NOT NULL + swap CASCADE FK for nullable SET NULL FK
ALTER TABLE portfolio_photos DROP CONSTRAINT portfolio_photos_album_id_fkey;
ALTER TABLE portfolio_photos ALTER COLUMN album_id DROP NOT NULL;
ALTER TABLE portfolio_photos
  ADD CONSTRAINT portfolio_photos_album_id_fkey
    FOREIGN KEY (album_id) REFERENCES portfolio_albums(id) ON DELETE SET NULL;

-- portfolio_videos: same
ALTER TABLE portfolio_videos DROP CONSTRAINT portfolio_videos_album_id_fkey;
ALTER TABLE portfolio_videos ALTER COLUMN album_id DROP NOT NULL;
ALTER TABLE portfolio_videos
  ADD CONSTRAINT portfolio_videos_album_id_fkey
    FOREIGN KEY (album_id) REFERENCES portfolio_albums(id) ON DELETE SET NULL;

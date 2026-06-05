-- Migration 028: Add 'rejected' to photographer_profile_status enum
-- Required so admin can reject a pending profile without a DB error.

ALTER TYPE photographer_profile_status ADD VALUE IF NOT EXISTS 'rejected';

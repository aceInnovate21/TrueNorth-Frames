-- Migration 030: Add welcome and profile_approved notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'welcome';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'profile_approved';

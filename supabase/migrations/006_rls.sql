-- Migration 006: Row Level Security policies
-- Depends on: 005_messaging_network.sql
-- All tables have RLS enabled. Public read where appropriate, auth required for writes.

-- Helper: get current user's role from users table
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── users ────────────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users: own row" ON users FOR ALL USING (id = auth.uid());
CREATE POLICY "users: admin all" ON users FOR ALL USING (auth_is_admin());

-- ─── client_profiles ──────────────────────────────────────────────────────────
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_profiles: own" ON client_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "client_profiles: admin" ON client_profiles FOR ALL USING (auth_is_admin());

-- ─── photographer_profiles ────────────────────────────────────────────────────
ALTER TABLE photographer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photographer_profiles: public approved" ON photographer_profiles FOR SELECT
  USING (profile_status = 'approved');
CREATE POLICY "photographer_profiles: own" ON photographer_profiles FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "photographer_profiles: admin" ON photographer_profiles FOR ALL
  USING (auth_is_admin());

-- ─── photographer_specialties ─────────────────────────────────────────────────
ALTER TABLE photographer_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialties: public read" ON photographer_specialties FOR SELECT USING (true);
CREATE POLICY "specialties: own write" ON photographer_specialties FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "specialties: admin" ON photographer_specialties FOR ALL USING (auth_is_admin());

-- ─── portfolio_albums ─────────────────────────────────────────────────────────
ALTER TABLE portfolio_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albums: public published" ON portfolio_albums FOR SELECT USING (is_published = true);
CREATE POLICY "albums: own all" ON portfolio_albums FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "albums: admin" ON portfolio_albums FOR ALL USING (auth_is_admin());

-- ─── portfolio_photos ─────────────────────────────────────────────────────────
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos: public read" ON portfolio_photos FOR SELECT USING (true);
CREATE POLICY "photos: own write" ON portfolio_photos FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "photos: admin" ON portfolio_photos FOR ALL USING (auth_is_admin());

-- ─── portfolio_videos ─────────────────────────────────────────────────────────
ALTER TABLE portfolio_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos: public read" ON portfolio_videos FOR SELECT USING (true);
CREATE POLICY "videos: own write" ON portfolio_videos FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "videos: admin" ON portfolio_videos FOR ALL USING (auth_is_admin());

-- ─── packages ─────────────────────────────────────────────────────────────────
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages: public active" ON packages FOR SELECT USING (is_active = true);
CREATE POLICY "packages: own" ON packages FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "packages: admin" ON packages FOR ALL USING (auth_is_admin());

-- ─── photographer_faqs ────────────────────────────────────────────────────────
ALTER TABLE photographer_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs: public published" ON photographer_faqs FOR SELECT USING (is_published = true);
CREATE POLICY "faqs: own" ON photographer_faqs FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "faqs: admin" ON photographer_faqs FOR ALL USING (auth_is_admin());

-- ─── availability ─────────────────────────────────────────────────────────────
ALTER TABLE availability_day_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avail: public read" ON availability_day_status FOR SELECT USING (true);
CREATE POLICY "avail: own write" ON availability_day_status FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));

ALTER TABLE weekly_time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots: public read" ON weekly_time_slots FOR SELECT USING (true);
CREATE POLICY "slots: own write" ON weekly_time_slots FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));

-- ─── booking_requests ─────────────────────────────────────────────────────────
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings: own client" ON booking_requests FOR ALL USING (client_id = auth.uid());
CREATE POLICY "bookings: own photographer" ON booking_requests FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "bookings: admin" ON booking_requests FOR ALL USING (auth_is_admin());

-- ─── booking_cancellation_requests ───────────────────────────────────────────
ALTER TABLE booking_cancellation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cancel_req: parties" ON booking_cancellation_requests FOR ALL
  USING (booking_id IN (SELECT id FROM booking_requests WHERE client_id = auth.uid()
    OR photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid())));
CREATE POLICY "cancel_req: admin" ON booking_cancellation_requests FOR ALL USING (auth_is_admin());

-- ─── reviews ─────────────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews: public read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews: own client write" ON reviews FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "reviews: own client update" ON reviews FOR UPDATE USING (client_id = auth.uid());
CREATE POLICY "reviews: photographer reply" ON reviews FOR UPDATE
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "reviews: admin" ON reviews FOR ALL USING (auth_is_admin());

-- ─── conversations ────────────────────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv: parties" ON conversations FOR ALL
  USING (client_id = auth.uid()
    OR photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "conv: admin" ON conversations FOR ALL USING (auth_is_admin());

-- ─── messages ─────────────────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages: parties" ON messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE client_id = auth.uid()
      OR photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid())
  ));
CREATE POLICY "messages: admin" ON messages FOR ALL USING (auth_is_admin());

-- ─── notifications ────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications: own" ON notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "notifications: admin" ON notifications FOR ALL USING (auth_is_admin());

-- ─── platform_config ──────────────────────────────────────────────────────────
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config: public read" ON platform_config FOR SELECT USING (true);
CREATE POLICY "config: admin write" ON platform_config FOR ALL USING (auth_is_admin());

-- ─── support_tickets ─────────────────────────────────────────────────────────
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets: own submitter" ON support_tickets FOR SELECT USING (submitted_by = auth.uid());
CREATE POLICY "tickets: own insert" ON support_tickets FOR INSERT WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "tickets: admin" ON support_tickets FOR ALL USING (auth_is_admin());

-- ─── admin_audit_log ──────────────────────────────────────────────────────────
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit: admin only" ON admin_audit_log FOR ALL USING (auth_is_admin());

-- ─── saved_photographers ─────────────────────────────────────────────────────
ALTER TABLE saved_photographers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved: own" ON saved_photographers FOR ALL USING (client_id = auth.uid());

-- ─── photographer_connections ─────────────────────────────────────────────────
ALTER TABLE photographer_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "connections: participants" ON photographer_connections FOR ALL
  USING (requester_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid())
    OR addressee_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "connections: admin" ON photographer_connections FOR ALL USING (auth_is_admin());

-- ─── storage_assets ───────────────────────────────────────────────────────────
ALTER TABLE storage_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets: own" ON storage_assets FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "assets: admin" ON storage_assets FOR ALL USING (auth_is_admin());

-- ─── external_platform_links ─────────────────────────────────────────────────
ALTER TABLE external_platform_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ext_links: public read" ON external_platform_links FOR SELECT USING (true);
CREATE POLICY "ext_links: own write" ON external_platform_links FOR ALL
  USING (photographer_id IN (SELECT id FROM photographer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "ext_links: admin" ON external_platform_links FOR ALL USING (auth_is_admin());

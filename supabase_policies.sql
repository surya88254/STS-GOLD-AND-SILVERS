-- Supabase RLS and storage policies for promo_banners and banners bucket

-- 1) Enable extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Enable RLS on promo_banners
ALTER TABLE IF EXISTS promo_banners ENABLE ROW LEVEL SECURITY;

-- Policy: allow users with JWT claim role='admin' to INSERT/UPDATE/DELETE/SELECT
-- This assumes you set a custom claim `role` in the user's JWT to 'admin' for admins.
CREATE POLICY IF NOT EXISTS "promo_banners_admins_full_access"
  ON promo_banners
  FOR ALL
  USING (current_setting('jwt.claims.role', true) = 'admin')
  WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');

-- Development fallback (uncomment if you want logged-in users to be allowed, less secure):
-- CREATE POLICY IF NOT EXISTS "promo_banners_authenticated"
--   ON promo_banners
--   FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- 3) Storage bucket policy: allow authenticated users to upload to the `banners` bucket
-- Storage uses schema `storage.objects` with columns (id, name, bucket_id, owner, ...)

-- Make sure the bucket exists and is named 'banners'.

-- Enable RLS on storage.objects (Supabase may already have policies, modify with caution)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to upload to bucket 'banners'
CREATE POLICY IF NOT EXISTS "allow_authenticated_uploads_to_banners"
  ON storage.objects
  FOR INSERT
  USING (
    bucket_id = 'banners' AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'banners' AND auth.role() = 'authenticated'
  );

-- Policy: allow authenticated users to delete their own objects from 'banners' (owner match)
CREATE POLICY IF NOT EXISTS "allow_delete_own_banners"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'banners' AND owner = auth.uid()
  );

-- Note:
-- - If you plan to upload from a client as an admin, ensure the admin user has the JWT claim `role='admin'` or use a more specific claim check in the policy.
-- - Alternatively, make the 'banners' bucket public if you prefer public file access and avoid storage RLS complexity.
-- - After applying policies, test uploads from your admin UI while authenticated.

-- supabase/migrations/20260604000001_add_must_change_password.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Mark Carlos Caldera so he is prompted on next login
UPDATE profiles
SET must_change_password = true
WHERE id = 'a45444ad-a566-4646-ad91-91e6b53b302e';

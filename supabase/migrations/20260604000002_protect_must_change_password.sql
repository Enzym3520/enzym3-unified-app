-- Prevent authenticated users from directly writing must_change_password.
-- Only the service role (edge functions) can set this column.
-- The anon/authenticated role can still read it.

CREATE OR REPLACE FUNCTION check_must_change_password_write()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if no change to the column
  IF NEW.must_change_password IS NOT DISTINCT FROM OLD.must_change_password THEN
    RETURN NEW;
  END IF;
  -- Allow service role (used by edge functions) to change it
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- Block authenticated users from changing it directly
  RAISE EXCEPTION 'must_change_password can only be modified by administrators';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_must_change_password
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_must_change_password_write();

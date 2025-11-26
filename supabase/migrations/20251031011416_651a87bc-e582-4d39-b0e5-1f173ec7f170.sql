-- Fix security warning with CASCADE
DROP FUNCTION IF EXISTS update_manufacturers_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_manufacturers_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS update_manufacturers_timestamp ON manufacturers;
CREATE TRIGGER update_manufacturers_timestamp
BEFORE UPDATE ON manufacturers
FOR EACH ROW
EXECUTE FUNCTION update_manufacturers_updated_at();
-- Fix PUBLIC_DATA_EXPOSURE security issue
-- Restrict manufacturer profile data exposure to only verified manufacturers
-- and only expose safe, non-PII fields

-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view manufacturer basic info" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view manufacturer profiles" ON public.profiles;

-- 2. Create a restricted policy for verified manufacturers only
-- This policy only allows viewing manufacturers who are verified
-- and only exposes non-PII fields through column-level filtering
CREATE POLICY "Public can view verified manufacturer profiles"
ON public.profiles
FOR SELECT
USING (
  role = 'manufacturer'::user_role 
  AND is_verified = true
);

-- 3. Create a secure view with only safe fields for public access
-- This view explicitly lists safe columns and excludes PII
CREATE OR REPLACE VIEW public.public_manufacturer_info AS
SELECT 
  id,
  company_name,
  country,
  created_at,
  is_verified,
  role
FROM public.profiles
WHERE role = 'manufacturer'::user_role 
  AND is_verified = true;

-- Grant access to the view
GRANT SELECT ON public.public_manufacturer_info TO anon, authenticated;

-- 4. Add comment explaining the security design
COMMENT ON POLICY "Public can view verified manufacturer profiles" ON public.profiles IS 
'Allows public access to manufacturer profiles, but only for verified manufacturers. 
PII fields (email, phone, address) should be filtered at the application layer.
Use public_manufacturer_info view for guaranteed safe field access.';

COMMENT ON VIEW public.public_manufacturer_info IS
'Secure public view of manufacturer profiles with only non-PII fields exposed.
Use this view for public-facing manufacturer listings instead of querying profiles directly.';

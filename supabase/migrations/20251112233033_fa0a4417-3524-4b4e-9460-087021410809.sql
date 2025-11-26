-- Fix security definer view warning
-- Replace the view to ensure it doesn't use SECURITY DEFINER
-- Views should use SECURITY INVOKER to enforce querying user's permissions

DROP VIEW IF EXISTS public.public_manufacturer_info;

-- Create view with explicit SECURITY INVOKER (default, but being explicit)
CREATE VIEW public.public_manufacturer_info 
WITH (security_invoker = true)
AS
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

COMMENT ON VIEW public.public_manufacturer_info IS
'Secure public view of manufacturer profiles with only non-PII fields exposed.
Uses SECURITY INVOKER to enforce RLS policies from the querying user perspective.
Use this view for public-facing manufacturer listings instead of querying profiles directly.';

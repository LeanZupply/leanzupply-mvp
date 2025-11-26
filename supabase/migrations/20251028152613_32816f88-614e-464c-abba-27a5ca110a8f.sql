-- Fix infinite recursion in profiles policies by using role check function
-- Drop existing recursive policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Superadmins can view all profiles'
  ) THEN
    DROP POLICY "Superadmins can view all profiles" ON public.profiles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Superadmins can update all profiles'
  ) THEN
    DROP POLICY "Superadmins can update all profiles" ON public.profiles;
  END IF;
END $$;

-- Recreate non-recursive superadmin policies using has_role()
CREATE POLICY "Superadmins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

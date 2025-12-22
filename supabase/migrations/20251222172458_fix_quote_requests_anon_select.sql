-- Fix RLS policy for quote_requests to allow anonymous users to SELECT
-- The insert().select() pattern requires both INSERT and SELECT permissions
-- Anonymous users could INSERT but not SELECT, causing the .select() to fail

-- Allow anonymous users to read quote requests they created (where user_id is null)
CREATE POLICY "Anonymous users can read guest quote requests"
  ON public.quote_requests FOR SELECT
  TO anon
  USING (user_id IS NULL);

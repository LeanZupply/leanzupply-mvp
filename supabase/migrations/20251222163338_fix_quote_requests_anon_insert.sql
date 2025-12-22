-- Fix RLS policy for quote_requests to allow anonymous users to insert
-- The original policy didn't specify TO role, which doesn't properly apply to anon role
-- This caused "row violates row-level security policy" errors for guest users

-- Drop the existing policy that doesn't specify a role
DROP POLICY IF EXISTS "Anyone can insert quote requests" ON public.quote_requests;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can insert quote requests"
  ON public.quote_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for anonymous users (guests)
CREATE POLICY "Anonymous users can insert quote requests"
  ON public.quote_requests FOR INSERT
  TO anon
  WITH CHECK (true);

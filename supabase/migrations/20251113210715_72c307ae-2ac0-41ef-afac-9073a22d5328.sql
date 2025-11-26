-- Remove the overly permissive public insert policy on order_tracking
-- This policy allows unauthenticated spam and data pollution
DROP POLICY IF EXISTS "Anyone can insert tracking" ON order_tracking;

-- The secure policy "Users can insert own tracking" with check (user_id = auth.uid()) 
-- remains in place and is sufficient for authenticated tracking
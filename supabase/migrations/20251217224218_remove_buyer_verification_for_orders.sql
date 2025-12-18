-- Remove verification requirement for buyer orders
-- This aligns with the business decision to allow unverified buyers to submit order proposals

-- Drop the existing policy that requires verification
DROP POLICY IF EXISTS "Verified buyers can insert own orders" ON orders;

-- Create new policy without verification requirement
CREATE POLICY "Buyers can insert own orders"
ON orders
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'buyer'::app_role)
  AND buyer_id = auth.uid()
);

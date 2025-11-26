-- Update RLS policies to enforce validation requirements

-- Drop existing manufacturer insert policy
DROP POLICY IF EXISTS "Manufacturers can insert own products" ON products;

-- Create new policy: manufacturers must be verified to create products
CREATE POLICY "Verified manufacturers can insert own products"
ON products
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manufacturer'::app_role) 
  AND manufacturer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_verified = true
  )
);

-- Drop existing buyer insert policy for orders
DROP POLICY IF EXISTS "Buyers can insert own orders" ON orders;

-- Create new policy: buyers must be verified to create orders
CREATE POLICY "Verified buyers can insert own orders"
ON orders
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'buyer'::app_role) 
  AND buyer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_verified = true
  )
);

-- Ensure public catalog access remains open (policy already exists but confirming)
-- Public can view active products policy should remain as is
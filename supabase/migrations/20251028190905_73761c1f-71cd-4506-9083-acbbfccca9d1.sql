
-- Fix the trigger function to properly fill buyer data
DROP TRIGGER IF EXISTS trg_fill_order_buyer_data ON orders;
DROP FUNCTION IF EXISTS fill_order_buyer_data();

CREATE OR REPLACE FUNCTION public.fill_order_buyer_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Fill buyer data from profiles
  SELECT email, company_name
  INTO NEW.buyer_email, NEW.buyer_company
  FROM profiles
  WHERE id = NEW.buyer_id;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger to run BEFORE insert
CREATE TRIGGER trg_fill_order_buyer_data
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION public.fill_order_buyer_data();

-- Update existing orders that don't have buyer data
UPDATE orders o
SET 
  buyer_email = p.email,
  buyer_company = p.company_name
FROM profiles p
WHERE o.buyer_id = p.id 
  AND (o.buyer_email IS NULL OR o.buyer_company IS NULL);

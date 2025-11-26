-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_fill_order_buyer_data ON orders;
DROP FUNCTION IF EXISTS fill_order_buyer_data();

-- Create improved function that fills buyer data immediately after insert
CREATE OR REPLACE FUNCTION public.fill_order_buyer_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _company text;
BEGIN
  -- Get buyer data
  SELECT email, company_name 
  INTO _email, _company
  FROM profiles 
  WHERE id = NEW.buyer_id;

  -- Update the just-inserted order with buyer data
  UPDATE orders
  SET buyer_email = _email,
      buyer_company = _company
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger that runs AFTER insert
CREATE TRIGGER trg_fill_order_buyer_data
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION public.fill_order_buyer_data();

-- Update all existing orders that don't have buyer data populated
UPDATE orders o
SET 
  buyer_email = p.email,
  buyer_company = p.company_name
FROM profiles p
WHERE o.buyer_id = p.id 
  AND (o.buyer_email IS NULL OR o.buyer_company IS NULL);
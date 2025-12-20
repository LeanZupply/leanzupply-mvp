-- Notify manufacturer when quote request is created for their product
CREATE OR REPLACE FUNCTION public.notify_manufacturer_quote_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manufacturer_id UUID;
  v_product_name TEXT;
BEGIN
  -- Get manufacturer and product name
  SELECT manufacturer_id, name INTO v_manufacturer_id, v_product_name
  FROM products WHERE id = NEW.product_id;

  -- Create notification for manufacturer
  IF v_manufacturer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      v_manufacturer_id,
      'Nueva solicitud de informacion',
      'Has recibido una solicitud de informacion para ' || COALESCE(v_product_name, 'tu producto') || '. Email: ' || NEW.email || ' | Tel: ' || NEW.mobile_phone,
      'order',
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_manufacturer_quote_request
AFTER INSERT ON quote_requests
FOR EACH ROW
EXECUTE FUNCTION notify_manufacturer_quote_request();

-- Add RLS policy for manufacturers to view quote requests for their products
CREATE POLICY "Manufacturers can view quote requests for their products"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = quote_requests.product_id
      AND products.manufacturer_id = auth.uid()
    )
  );

-- Automatic Notification Triggers for LenzSupply Platform

-- 1. Notify manufacturer and superadmin when a new order is placed
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manufacturer_id UUID;
  v_superadmin_id UUID;
  v_product_name TEXT;
BEGIN
  -- Get manufacturer from the product
  SELECT manufacturer_id, name INTO v_manufacturer_id, v_product_name
  FROM products 
  WHERE id = NEW.product_id;

  -- Notify manufacturer
  IF v_manufacturer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      v_manufacturer_id,
      'New Order Received',
      'You have received a new order for ' || v_product_name || ' (' || NEW.quantity || ' units)',
      'order',
      false
    );
  END IF;

  -- Notify superadmin
  SELECT id INTO v_superadmin_id 
  FROM profiles 
  WHERE role = 'superadmin' 
  LIMIT 1;
  
  IF v_superadmin_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      v_superadmin_id,
      'New Order Created',
      'Order placed for ' || v_product_name || ' by buyer',
      'system',
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_order
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_order();

-- 2. Notify manufacturer when a product is approved or rejected
CREATE OR REPLACE FUNCTION public.handle_product_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.manufacturer_id,
      CASE NEW.status
        WHEN 'active' THEN 'Product Approved ✓'
        WHEN 'rejected' THEN 'Product Rejected'
        ELSE 'Product Status Updated'
      END,
      'Your product "' || NEW.name || '" status is now: ' || NEW.status,
      'product',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_product_status_update
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION public.handle_product_status_update();

-- 3. Notify buyer when manufacturer updates order status
CREATE OR REPLACE FUNCTION public.handle_order_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_name TEXT;
BEGIN
  -- Only notify if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Get product name
    SELECT name INTO v_product_name
    FROM products
    WHERE id = NEW.product_id;
    
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.buyer_id,
      'Order Status Updated',
      'Your order for ' || COALESCE(v_product_name, 'product') || ' is now: ' || REPLACE(NEW.status, '_', ' '),
      'order',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_update
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_update();

-- 4. Notify manufacturer when a document is verified
CREATE OR REPLACE FUNCTION public.handle_document_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if verification status changed to true
  IF NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false) THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.user_id,
      'Document Verified ✓',
      'Your ' || NEW.type || ' document has been verified by admin',
      'validation',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_document_verification
AFTER UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_document_verification();
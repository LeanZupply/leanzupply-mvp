-- Create trigger to notify superadmin when new product is created
CREATE OR REPLACE FUNCTION public.handle_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_superadmin_id UUID;
BEGIN
  -- Notify superadmin
  SELECT id INTO v_superadmin_id 
  FROM profiles 
  WHERE role = 'superadmin' 
  LIMIT 1;
  
  IF v_superadmin_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      v_superadmin_id,
      'Nuevo Producto para Revisar',
      'El fabricante ha cargado un nuevo producto: ' || NEW.name || '. Por favor revisalo.',
      'product',
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on products table for new inserts
DROP TRIGGER IF EXISTS on_product_created ON products;
CREATE TRIGGER on_product_created
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_product();
-- Add new control fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS preview_url TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;

-- Update the product status update trigger to record validation timestamp
CREATE OR REPLACE FUNCTION public.handle_product_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.manufacturer_id,
      CASE NEW.status
        WHEN 'active' THEN '✅ Producto Aprobado'
        WHEN 'rejected' THEN '❌ Producto Rechazado'
        ELSE '⚙️ Producto Actualizado'
      END,
      'Tu producto "' || NEW.name || '" ahora está en estado: ' || NEW.status || 
      CASE 
        WHEN NEW.status = 'rejected' AND NEW.admin_notes IS NOT NULL 
        THEN '. Nota del admin: ' || NEW.admin_notes
        ELSE ''
      END,
      'product',
      false
    );

    -- Record validation timestamp when approved
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
      NEW.validated_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
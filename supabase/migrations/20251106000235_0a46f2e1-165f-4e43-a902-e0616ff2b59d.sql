
-- Eliminar función con CASCADE para eliminar triggers dependientes
DROP FUNCTION IF EXISTS public.notify_manufacturer_verification() CASCADE;

-- Recrear la función corregida sin referencias a verification_status
CREATE OR REPLACE FUNCTION public.notify_manufacturer_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notificar cuando un fabricante es verificado o des-verificado
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified AND NEW.role = 'manufacturer' THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.is_verified = true THEN '✅ Perfil Verificado'
        ELSE '⚠️ Verificación Revocada'
      END,
      CASE 
        WHEN NEW.is_verified = true THEN 'Tu perfil de fabricante ha sido verificado. Ya puedes comenzar a vender tus productos.'
        ELSE 'La verificación de tu perfil ha sido revocada. Contacta al administrador para más información.'
      END,
      'validation',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recrear trigger con el nombre correcto
CREATE TRIGGER manufacturer_verification_notify
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_manufacturer_verification();

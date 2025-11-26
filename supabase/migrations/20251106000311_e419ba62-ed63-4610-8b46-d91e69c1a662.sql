
-- Eliminar función notify_profile_update que también usa verification_status
DROP FUNCTION IF EXISTS public.notify_profile_update() CASCADE;

-- Recrear sin referencias a verification_status
CREATE OR REPLACE FUNCTION public.notify_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_superadmin_id UUID;
BEGIN
  IF NEW.role = 'manufacturer' AND (
    NEW.company_name IS DISTINCT FROM OLD.company_name OR
    NEW.country IS DISTINCT FROM OLD.country OR
    NEW.is_verified IS DISTINCT FROM OLD.is_verified OR
    NEW.documents IS DISTINCT FROM OLD.documents
  ) THEN
    SELECT id INTO v_superadmin_id 
    FROM profiles 
    WHERE role = 'superadmin' 
    LIMIT 1;
    
    IF v_superadmin_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES (
        v_superadmin_id,
        'Perfil de Fabricante Actualizado',
        'El fabricante ' || COALESCE(NEW.company_name, NEW.email) || ' actualizó su información de empresa.',
        'system',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recrear trigger
CREATE TRIGGER profile_update_notify
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_profile_update();

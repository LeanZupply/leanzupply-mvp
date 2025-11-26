
-- Arreglar trigger para usar solo campos que existen en profiles
DROP FUNCTION IF EXISTS public.notify_profile_update() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_superadmin_id UUID;
BEGIN
  -- Solo notificar cuando un fabricante actualiza info relevante
  IF NEW.role = 'manufacturer' AND (
    NEW.company_name IS DISTINCT FROM OLD.company_name OR
    NEW.country IS DISTINCT FROM OLD.country OR
    NEW.full_name IS DISTINCT FROM OLD.full_name
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
        'El fabricante ' || COALESCE(NEW.company_name, NEW.email) || ' actualizó su información.',
        'system',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_update_notify
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_profile_update();

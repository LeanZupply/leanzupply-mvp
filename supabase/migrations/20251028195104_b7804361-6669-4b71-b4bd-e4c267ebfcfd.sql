-- Add verification fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'changes_requested')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role_verification ON profiles(role, verification_status);

-- Function to notify manufacturer of verification changes
CREATE OR REPLACE FUNCTION notify_manufacturer_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if verification_status changed and user is a manufacturer
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NEW.role = 'manufacturer' THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.id,
      CASE NEW.verification_status
        WHEN 'approved' THEN '✅ Perfil Aprobado'
        WHEN 'rejected' THEN '❌ Perfil Rechazado'
        WHEN 'changes_requested' THEN '📝 Cambios Solicitados'
        ELSE 'Estado de Verificación Actualizado'
      END,
      CASE NEW.verification_status
        WHEN 'approved' THEN 'Tu perfil de fabricante ha sido aprobado. Ya puedes comenzar a cargar productos.'
        WHEN 'rejected' THEN 'Tu perfil ha sido rechazado de forma permanente. ' || COALESCE('Razón: ' || NEW.verification_notes, '')
        WHEN 'changes_requested' THEN 'Se requieren cambios en tu perfil. ' || COALESCE(NEW.verification_notes, 'Por favor revisa la información.')
        ELSE 'El estado de tu perfil ha cambiado.'
      END,
      'validation',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for manufacturer verification notifications
DROP TRIGGER IF EXISTS manufacturer_verification_notify ON profiles;
CREATE TRIGGER manufacturer_verification_notify
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_manufacturer_verification();
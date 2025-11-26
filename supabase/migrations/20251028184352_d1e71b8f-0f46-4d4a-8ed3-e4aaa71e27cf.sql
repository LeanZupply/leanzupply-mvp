-- Extender tabla profiles con campos del fabricante
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS production_capacity TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Crear bucket para documentos de fabricantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('manufacturer-docs', 'manufacturer-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para documentos de fabricantes
CREATE POLICY "Manufacturers can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'manufacturer-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Manufacturers can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'manufacturer-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Superadmins can view all manufacturer documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'manufacturer-docs' 
  AND has_role(auth.uid(), 'superadmin'::app_role)
);

-- Trigger para notificar al superadmin cuando un fabricante actualiza su perfil
CREATE OR REPLACE FUNCTION public.notify_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_superadmin_id UUID;
BEGIN
  -- Solo notificar si es un fabricante y cambió datos relevantes
  IF NEW.role = 'manufacturer' AND (
    NEW.company_name IS DISTINCT FROM OLD.company_name OR
    NEW.country IS DISTINCT FROM OLD.country OR
    NEW.verification_status IS DISTINCT FROM OLD.verification_status OR
    NEW.documents IS DISTINCT FROM OLD.documents
  ) THEN
    -- Obtener ID del superadmin
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

CREATE TRIGGER on_manufacturer_profile_update
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_profile_update();
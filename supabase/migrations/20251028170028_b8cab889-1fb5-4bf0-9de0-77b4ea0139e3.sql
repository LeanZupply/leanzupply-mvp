-- Agregar campos faltantes a profiles para buyers
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS importer_status TEXT,
  ADD COLUMN IF NOT EXISTS billing_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contracts JSONB DEFAULT '[]'::jsonb;

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMENT ON COLUMN public.profiles.tax_id IS 'CUIT/Tax ID de la empresa';
COMMENT ON COLUMN public.profiles.address IS 'Dirección fiscal completa';
COMMENT ON COLUMN public.profiles.importer_status IS 'Estado de importador/aduana';
COMMENT ON COLUMN public.profiles.billing_info IS 'Datos de facturación en formato JSON';
COMMENT ON COLUMN public.profiles.contracts IS 'Array de contratos subidos [{name,url}]';
-- DROP old manufacturer-related fields and create new manufacturers table

-- 1. Create manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- INFORMACIÓN GENERAL DE LA EMPRESA
  legal_name text NOT NULL,
  tax_id text NOT NULL,
  registered_brand text NOT NULL,
  brand_logo_url text NOT NULL,
  country text NOT NULL,
  province text NOT NULL,
  city text NOT NULL,
  postal_code text,
  address text NOT NULL,
  official_website text NOT NULL CHECK (
    official_website NOT ILIKE '%alibaba%' 
    AND official_website NOT ILIKE '%made-in-china%'
  ),

  -- DATOS DE CONTACTO
  primary_contact_name text NOT NULL,
  primary_contact_email text NOT NULL,
  primary_contact_phone text NOT NULL,
  primary_contact_messaging text,

  secondary_contact_name text,
  secondary_contact_email text,
  secondary_contact_phone text,
  secondary_contact_messaging text,

  english_level text NOT NULL CHECK (
    english_level IN ('básico', 'intermedio', 'fluido', 'alta capacidad')
  ),

  -- DATOS OPERATIVOS
  certifications text[] NOT NULL,
  vacation_dates text NOT NULL,
  product_sectors text[] NOT NULL,
  production_capacity text,
  machinery text,
  total_employees int,
  facility_area_m2 int,
  factory_positioning text NOT NULL,
  factory_history text NOT NULL,

  -- EVIDENCIA VISUAL
  photos_production_lines text[] NOT NULL DEFAULT '{}',
  photos_staff text[] NOT NULL DEFAULT '{}',
  photos_machinery text[] NOT NULL DEFAULT '{}',
  photos_warehouse text[] NOT NULL DEFAULT '{}',
  photos_container_loading text[] NOT NULL DEFAULT '{}',

  -- ESTADO
  terms_accepted boolean NOT NULL DEFAULT false,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Manufacturers can view own profile"
ON manufacturers FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Manufacturers can insert own profile"
ON manufacturers FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Manufacturers can update own profile"
ON manufacturers FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all manufacturers"
ON manufacturers FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Remove old manufacturer-specific columns from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS production_capacity,
DROP COLUMN IF EXISTS certifications,
DROP COLUMN IF EXISTS payment_terms,
DROP COLUMN IF EXISTS logo_url,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS tax_id,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS importer_status,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS postal_code,
DROP COLUMN IF EXISTS billing_info,
DROP COLUMN IF EXISTS contracts,
DROP COLUMN IF EXISTS documents,
DROP COLUMN IF EXISTS verified_at,
DROP COLUMN IF EXISTS verified_by,
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS verification_notes;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_manufacturers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manufacturers_timestamp
BEFORE UPDATE ON manufacturers
FOR EACH ROW
EXECUTE FUNCTION update_manufacturers_updated_at();
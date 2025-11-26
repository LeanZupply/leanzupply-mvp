-- Actualizar tabla products con nuevos campos
ALTER TABLE products
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS packaging_length_cm numeric,
ADD COLUMN IF NOT EXISTS packaging_width_cm numeric,
ADD COLUMN IF NOT EXISTS packaging_height_cm numeric,
ADD COLUMN IF NOT EXISTS packaging_type text,
ADD COLUMN IF NOT EXISTS logistics_time_days integer,
ADD COLUMN IF NOT EXISTS transport_notes text,
ADD COLUMN IF NOT EXISTS price_usd numeric,
ADD COLUMN IF NOT EXISTS condition text,
ADD COLUMN IF NOT EXISTS stock_min integer,
ADD COLUMN IF NOT EXISTS discount_3u numeric,
ADD COLUMN IF NOT EXISTS discount_5u numeric,
ADD COLUMN IF NOT EXISTS discount_8u numeric,
ADD COLUMN IF NOT EXISTS discount_10u numeric,
ADD COLUMN IF NOT EXISTS service_terms text,
ADD COLUMN IF NOT EXISTS videos text[];

-- Agregar constraint para condition
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_condition_check CHECK (condition IN ('EXW', 'FCA'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Hacer manufacturer_id nullable temporalmente
ALTER TABLE products ALTER COLUMN manufacturer_id DROP NOT NULL;

-- Limpiar productos sin fabricante válido
UPDATE products 
SET manufacturer_id = NULL 
WHERE manufacturer_id IS NOT NULL 
AND manufacturer_id NOT IN (SELECT id FROM manufacturers);

-- Eliminar productos huérfanos (opcional, comentar si se quiere mantener)
-- DELETE FROM products WHERE manufacturer_id IS NULL;

-- Actualizar referencia de manufacturer_id
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_manufacturer_id_fkey;

ALTER TABLE products
ADD CONSTRAINT products_manufacturer_id_fkey 
FOREIGN KEY (manufacturer_id) 
REFERENCES manufacturers(id) 
ON DELETE CASCADE;

-- Crear índice para búsquedas por fabricante
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON products(manufacturer_id);

-- Actualizar trigger para updated_at si no existe
DO $$ BEGIN
  CREATE TRIGGER update_products_updated_at_trigger
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
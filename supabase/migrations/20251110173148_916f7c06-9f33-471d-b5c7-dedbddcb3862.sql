-- Actualizar las políticas RLS para soportar el estado "paused"
-- Los productos pausados no deben ser visibles para usuarios autenticados ni público

-- Recrear la política de lectura para usuarios autenticados (compradores y público)
DROP POLICY IF EXISTS "authenticated_read_verified_products" ON products;
CREATE POLICY "authenticated_read_verified_products" 
ON products 
FOR SELECT 
USING (
  status = 'active' 
  AND is_manufacturer_verified(manufacturer_id)
);

-- Recrear la política de lectura pública
DROP POLICY IF EXISTS "public_read_verified_manufacturer_products" ON products;
CREATE POLICY "public_read_verified_manufacturer_products" 
ON products 
FOR SELECT 
USING (
  status = 'active' 
  AND is_manufacturer_verified(manufacturer_id)
);

-- Comentario explicativo sobre el estado "paused"
COMMENT ON COLUMN products.status IS 'Estados posibles: pending (pendiente de aprobación), active (activo y visible), rejected (rechazado), paused (pausado temporalmente por admin)';
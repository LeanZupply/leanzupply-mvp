-- Función para verificar si un fabricante está verificado
CREATE OR REPLACE FUNCTION public.is_manufacturer_verified(_manufacturer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_verified FROM profiles WHERE id = _manufacturer_id AND role = 'manufacturer'),
    false
  );
$$;

-- Eliminar políticas antiguas de productos para compradores/público
DROP POLICY IF EXISTS "public_read_active_products" ON products;
DROP POLICY IF EXISTS "authenticated_users_read_active_products" ON products;

-- Nueva política: compradores/público solo ven productos activos de fabricantes verificados
CREATE POLICY "public_read_verified_manufacturer_products" ON products
FOR SELECT
USING (
  status = 'active' 
  AND is_manufacturer_verified(manufacturer_id)
);

-- Política para usuarios autenticados (sin rol específico o buyers)
CREATE POLICY "authenticated_read_verified_products" ON products
FOR SELECT
USING (
  status = 'active' 
  AND is_manufacturer_verified(manufacturer_id)
);
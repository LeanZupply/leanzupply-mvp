-- Permitir a usuarios autenticados (especialmente buyers) ver productos activos
CREATE POLICY "authenticated_users_read_active_products"
ON products
FOR SELECT
TO authenticated
USING (status = 'active');
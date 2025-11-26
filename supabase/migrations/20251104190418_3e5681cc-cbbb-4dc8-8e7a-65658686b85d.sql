-- Limpiar todas las políticas de products y crear solo las necesarias
-- 1. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view active products" ON public.products;
DROP POLICY IF EXISTS "Buyers can view active products" ON public.products;
DROP POLICY IF EXISTS "Manufacturers can view own products" ON public.products;
DROP POLICY IF EXISTS "Manufacturers can view their own products" ON public.products;
DROP POLICY IF EXISTS "Manufacturers can update own products" ON public.products;
DROP POLICY IF EXISTS "Manufacturers can update their own products" ON public.products;
DROP POLICY IF EXISTS "Manufacturers can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Manufacturers can insert products" ON public.products;
DROP POLICY IF EXISTS "Verified manufacturers can insert own products" ON public.products;
DROP POLICY IF EXISTS "Superadmins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Superadmins can view all products" ON public.products;
DROP POLICY IF EXISTS "Superadmins can update all products" ON public.products;

-- 2. Crear políticas limpias y simples
-- LECTURA: Cualquier persona (autenticada o no) puede ver productos activos
CREATE POLICY "public_read_active_products" 
ON public.products 
FOR SELECT 
TO public
USING (status = 'active');

-- LECTURA: Manufacturers pueden ver sus propios productos (cualquier status)
CREATE POLICY "manufacturers_read_own" 
ON public.products 
FOR SELECT 
TO authenticated
USING (manufacturer_id = auth.uid());

-- INSERCIÓN: Solo manufacturers verificados pueden insertar
CREATE POLICY "manufacturers_insert_own" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (
  manufacturer_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'manufacturer' 
    AND is_verified = true
  )
);

-- ACTUALIZACIÓN: Manufacturers pueden actualizar sus propios productos
CREATE POLICY "manufacturers_update_own" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (manufacturer_id = auth.uid());

-- ELIMINACIÓN: Manufacturers pueden eliminar sus propios productos
CREATE POLICY "manufacturers_delete_own" 
ON public.products 
FOR DELETE 
TO authenticated
USING (manufacturer_id = auth.uid());

-- SUPERADMIN: Acceso completo
CREATE POLICY "superadmin_all" 
ON public.products 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));
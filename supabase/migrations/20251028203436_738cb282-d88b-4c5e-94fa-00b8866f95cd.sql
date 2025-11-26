-- Eliminar la política anterior que era muy restrictiva
DROP POLICY IF EXISTS "Public can view manufacturer profiles" ON public.profiles;

-- Crear nueva política más permisiva para ver fabricantes en el contexto de productos
CREATE POLICY "Anyone can view manufacturer basic info"
ON public.profiles
FOR SELECT
TO public
USING (role = 'manufacturer');
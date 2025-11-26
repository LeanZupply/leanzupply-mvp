-- Permitir que todos los usuarios autenticados puedan ver perfiles de fabricantes
-- Esto es necesario para que los compradores puedan ver información del fabricante en la página de detalle del producto

CREATE POLICY "Public can view manufacturer profiles"
ON public.profiles
FOR SELECT
TO public
USING (
  role = 'manufacturer' 
  AND verification_status = 'approved'
);
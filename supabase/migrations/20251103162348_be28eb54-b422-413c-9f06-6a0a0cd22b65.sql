-- Arreglar políticas de storage para que fabricantes puedan subir archivos

-- Eliminar políticas existentes de storage si existen
DROP POLICY IF EXISTS "Allow manufacturers to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow manufacturers to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow manufacturers to upload product docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow manufacturers to upload logo" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read product docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of manufacturer docs" ON storage.objects;

-- Políticas para producto-imágenes (bucket público)
CREATE POLICY "Allow authenticated users to upload product images" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public read of product images" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow owners to update product images" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow owners to delete product images" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para documentos de productos (bucket privado)
CREATE POLICY "Allow authenticated users to upload product docs" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product-docs');

CREATE POLICY "Allow authenticated users to read product docs" 
ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'product-docs');

CREATE POLICY "Allow owners to update product docs" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'product-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow owners to delete product docs" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'product-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para documentos de fabricantes (bucket público)
CREATE POLICY "Allow authenticated users to upload manufacturer docs" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'manufacturer-docs');

CREATE POLICY "Allow public read of manufacturer docs" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'manufacturer-docs');

CREATE POLICY "Allow owners to update manufacturer docs" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'manufacturer-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow owners to delete manufacturer docs" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'manufacturer-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Arreglar políticas RLS para que los fabricantes puedan ver sus productos
-- Y los buyers puedan ver productos activos

-- Eliminar política existente conflictiva
DROP POLICY IF EXISTS "Manufacturers can view their own products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view active products" ON products;

-- Política para que fabricantes vean sus propios productos (cualquier estado)
CREATE POLICY "Manufacturers can view their own products" 
ON products
FOR SELECT 
TO authenticated
USING (auth.uid() = manufacturer_id);

-- Política para que usuarios autenticados vean productos activos
CREATE POLICY "Authenticated users can view active products" 
ON products
FOR SELECT 
TO authenticated
USING (status = 'active');

-- Política para que superadmins vean todos los productos
CREATE POLICY "Superadmins can view all products" 
ON products
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Política para que fabricantes puedan insertar productos
CREATE POLICY "Manufacturers can insert products" 
ON products
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = manufacturer_id);

-- Política para que fabricantes puedan actualizar sus productos
CREATE POLICY "Manufacturers can update their own products" 
ON products
FOR UPDATE 
TO authenticated
USING (auth.uid() = manufacturer_id);

-- Política para que superadmins puedan actualizar cualquier producto
CREATE POLICY "Superadmins can update all products" 
ON products
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Política para que fabricantes puedan eliminar sus productos
CREATE POLICY "Manufacturers can delete their own products" 
ON products
FOR DELETE 
TO authenticated
USING (auth.uid() = manufacturer_id);

-- Arreglar políticas del perfil de fabricantes
DROP POLICY IF EXISTS "Manufacturers can view their own profile" ON manufacturers;
DROP POLICY IF EXISTS "Manufacturers can create their profile" ON manufacturers;
DROP POLICY IF EXISTS "Manufacturers can update their own profile" ON manufacturers;

-- Política para que fabricantes vean su propio perfil
CREATE POLICY "Manufacturers can view their own profile" 
ON manufacturers
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Política para que superadmins vean todos los perfiles
CREATE POLICY "Superadmins can view all manufacturer profiles" 
ON manufacturers
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Política para que fabricantes puedan crear su perfil
CREATE POLICY "Manufacturers can create their profile" 
ON manufacturers
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política para que fabricantes puedan actualizar su perfil
CREATE POLICY "Manufacturers can update their own profile" 
ON manufacturers
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);
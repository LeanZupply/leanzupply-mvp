-- Políticas RLS para el bucket manufacturer-docs
-- Permitir a los fabricantes subir y actualizar sus propios archivos

-- Policy para INSERT (upload)
CREATE POLICY "Manufacturers can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'manufacturer-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy para UPDATE (reemplazar archivos)
CREATE POLICY "Manufacturers can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'manufacturer-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'manufacturer-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy para SELECT (leer archivos)
CREATE POLICY "Manufacturers can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'manufacturer-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy para DELETE (eliminar archivos)
CREATE POLICY "Manufacturers can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'manufacturer-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Hacer el bucket público para que los logos se puedan ver sin autenticación
UPDATE storage.buckets
SET public = true
WHERE id = 'manufacturer-docs';
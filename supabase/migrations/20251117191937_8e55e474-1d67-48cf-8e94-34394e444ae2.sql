-- Make manufacturer-docs bucket private to protect sensitive business data
UPDATE storage.buckets 
SET public = false 
WHERE name = 'manufacturer-docs';

-- Add RLS policy for manufacturers to view their own documents
CREATE POLICY "Manufacturers can view own docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'manufacturer-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policy for manufacturers to upload their own documents
CREATE POLICY "Manufacturers can upload own docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'manufacturer-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policy for manufacturers to update their own documents
CREATE POLICY "Manufacturers can update own docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'manufacturer-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policy for manufacturers to delete their own documents
CREATE POLICY "Manufacturers can delete own docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'manufacturer-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policy for superadmins to view all manufacturer documents
CREATE POLICY "Superadmins can view all manufacturer docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'manufacturer-docs' 
  AND has_role(auth.uid(), 'superadmin')
);

-- Make product-docs bucket private as well (medium priority but fixing while we're here)
UPDATE storage.buckets 
SET public = false 
WHERE name = 'product-docs';

-- Add RLS policies for product-docs
CREATE POLICY "Authenticated users can view product docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-docs');

CREATE POLICY "Manufacturers can manage own product docs"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'product-docs'
  AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.manufacturer_id = auth.uid()
    AND name LIKE p.id::text || '/%'
  )
);

CREATE POLICY "Superadmins can manage all product docs"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'product-docs'
  AND has_role(auth.uid(), 'superadmin')
);
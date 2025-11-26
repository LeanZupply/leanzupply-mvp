-- Ensure product-docs bucket exists and is public
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-docs'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('product-docs', 'product-docs', true);
  ELSE
    UPDATE storage.buckets SET public = true WHERE id = 'product-docs';
  END IF;
END $$;

-- Storage policies for product-docs allowing authenticated users to manage objects
-- Create policy helpers conditionally
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated_read_product_docs'
  ) THEN
    CREATE POLICY authenticated_read_product_docs ON storage.objects
      FOR SELECT
      USING (bucket_id = 'product-docs' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated_insert_product_docs'
  ) THEN
    CREATE POLICY authenticated_insert_product_docs ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'product-docs' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated_update_product_docs'
  ) THEN
    CREATE POLICY authenticated_update_product_docs ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'product-docs' AND auth.uid() IS NOT NULL)
      WITH CHECK (bucket_id = 'product-docs' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'authenticated_delete_product_docs'
  ) THEN
    CREATE POLICY authenticated_delete_product_docs ON storage.objects
      FOR DELETE
      USING (bucket_id = 'product-docs' AND auth.uid() IS NOT NULL);
  END IF;
END $$;
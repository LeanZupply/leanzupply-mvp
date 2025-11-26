-- Ensure bucket exists and is public
insert into storage.buckets (id, name, public)
values ('product-docs', 'product-docs', true)
on conflict (id) do update set public = true, name = excluded.name;

-- Policies for authenticated users on product-docs
-- Create SELECT policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'product-docs select for authenticated'
  ) THEN
    CREATE POLICY "product-docs select for authenticated"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-docs' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Create INSERT policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'product-docs insert for authenticated'
  ) THEN
    CREATE POLICY "product-docs insert for authenticated"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'product-docs' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Optional UPDATE policy to allow replacing files (upsert uses update semantics)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'product-docs update for authenticated'
  ) THEN
    CREATE POLICY "product-docs update for authenticated"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'product-docs' AND auth.role() = 'authenticated')
    WITH CHECK (bucket_id = 'product-docs' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Fix manufacturer profile + uploads + product visibility
-- 1) Ensure profiles are created on signup and roles are synced
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'sync_role_after_profile_upsert'
  ) THEN
    CREATE TRIGGER sync_role_after_profile_upsert
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();
  END IF;
END $$;

-- 2) Make manufacturers.user_id upsertable/unique and keep timestamps fresh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'manufacturers_user_id_key'
  ) THEN
    ALTER TABLE public.manufacturers
    ADD CONSTRAINT manufacturers_user_id_key UNIQUE (user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_manufacturers_updated_at_tr'
  ) THEN
    CREATE TRIGGER update_manufacturers_updated_at_tr
    BEFORE UPDATE ON public.manufacturers
    FOR EACH ROW EXECUTE FUNCTION public.update_manufacturers_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at_tr'
  ) THEN
    CREATE TRIGGER update_products_updated_at_tr
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- 3) Storage policies to allow manufacturers to upload files and images
-- manufacturer-docs: public read, owners can insert/update/delete within their own folder (first path segment = user id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read manufacturer-docs'
  ) THEN
    CREATE POLICY "Public read manufacturer-docs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'manufacturer-docs');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users manage own files manufacturer-docs'
  ) THEN
    CREATE POLICY "Users manage own files manufacturer-docs"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'manufacturer-docs' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'manufacturer-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- product-images: public read, owners can manage own files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read product-images'
  ) THEN
    CREATE POLICY "Public read product-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users manage own files product-images'
  ) THEN
    CREATE POLICY "Users manage own files product-images"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- product-docs: private read/write for owner only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users read own product-docs'
  ) THEN
    CREATE POLICY "Users read own product-docs"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'product-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users manage own product-docs'
  ) THEN
    CREATE POLICY "Users manage own product-docs"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'product-docs' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'product-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

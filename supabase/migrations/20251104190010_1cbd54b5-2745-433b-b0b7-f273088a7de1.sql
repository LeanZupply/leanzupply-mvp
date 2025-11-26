-- Remove the foreign key constraint from products to manufacturers
-- Products should link to profiles (users) directly, not to the manufacturers table
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_manufacturer_id_fkey;

-- Add a proper foreign key to profiles instead
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_manufacturer_id_profiles_fkey;

ALTER TABLE public.products
ADD CONSTRAINT products_manufacturer_id_profiles_fkey
FOREIGN KEY (manufacturer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
-- Extender tabla products con campos completos
alter table public.products
  add column if not exists sku text,
  add column if not exists images jsonb default '[]'::jsonb,
  add column if not exists length_cm numeric,
  add column if not exists width_cm numeric,
  add column if not exists height_cm numeric,
  add column if not exists volume_m3 numeric,
  add column if not exists weight_net_kg numeric,
  add column if not exists weight_gross_kg numeric,
  add column if not exists packaging_type text,
  add column if not exists lead_time_production_days int,
  add column if not exists lead_time_logistics_days int,
  add column if not exists warranty_terms text,
  add column if not exists certifications jsonb default '[]'::jsonb,
  add column if not exists technical_docs jsonb default '[]'::jsonb;

-- Índices útiles
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_status_category on public.products(status, category);

-- Crear buckets de storage para imágenes y documentos de productos
insert into storage.buckets (id, name, public)
values 
  ('product-images', 'product-images', true),
  ('product-docs', 'product-docs', false)
on conflict (id) do nothing;

-- RLS para product-images: manufacturer puede subir/ver sus archivos, superadmin todo
create policy "Manufacturers can upload own product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Manufacturers can view own product images"
on storage.objects for select
using (
  bucket_id = 'product-images' and
  (auth.uid()::text = (storage.foldername(name))[1] or has_role(auth.uid(), 'superadmin'))
);

create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Manufacturers can delete own product images"
on storage.objects for delete
using (
  bucket_id = 'product-images' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS para product-docs: solo manufacturer y superadmin
create policy "Manufacturers can upload own product docs"
on storage.objects for insert
with check (
  bucket_id = 'product-docs' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Manufacturers can view own product docs"
on storage.objects for select
using (
  bucket_id = 'product-docs' and
  (auth.uid()::text = (storage.foldername(name))[1] or has_role(auth.uid(), 'superadmin'))
);

create policy "Manufacturers can delete own product docs"
on storage.objects for delete
using (
  bucket_id = 'product-docs' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Superadmins full access to product-images"
on storage.objects for all
using (bucket_id = 'product-images' and has_role(auth.uid(), 'superadmin'));

create policy "Superadmins full access to product-docs"
on storage.objects for all
using (bucket_id = 'product-docs' and has_role(auth.uid(), 'superadmin'));
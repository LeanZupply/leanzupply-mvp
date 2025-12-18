-- Make manufacturer-docs bucket public to allow image previews
UPDATE storage.buckets SET public = true WHERE name = 'manufacturer-docs';

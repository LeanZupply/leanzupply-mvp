-- Create policy to allow public access to active products
CREATE POLICY "Public can view active products"
ON products FOR SELECT
TO anon
USING (status = 'active');
-- Enable public access to active products catalog
CREATE POLICY "Anyone can view active products"
ON products
FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- Enable public access to manufacturer profiles (for product cards)
CREATE POLICY "Anyone can view manufacturer profiles"
ON profiles
FOR SELECT
TO anon, authenticated
USING (role = 'manufacturer');
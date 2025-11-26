-- Crear índices para optimizar consultas frecuentes

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON products (manufacturer_id);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_manufacturer_id ON orders (manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles (country);
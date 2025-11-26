-- Agregar nuevos campos a la tabla products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS delivery_port TEXT;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN products.brand IS 'Marca del producto';
COMMENT ON COLUMN products.delivery_port IS 'Puerto de entrega FOB (Tianjin, Qingdao, Shanghai, Ningbo, Xiamen, Shenzhen, Guangzhou)';
-- Crear tabla de rutas de envío con tiempos de tránsito
CREATE TABLE IF NOT EXISTS shipping_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_port TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  destination_port TEXT,
  min_days INTEGER NOT NULL,
  max_days INTEGER NOT NULL,
  freight_cost_override NUMERIC,
  last_updated TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_route UNIQUE(origin_port, destination_country, destination_port)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_shipping_routes_origin ON shipping_routes(origin_port);
CREATE INDEX idx_shipping_routes_destination ON shipping_routes(destination_country, destination_port);
CREATE INDEX idx_shipping_routes_active ON shipping_routes(active) WHERE active = true;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_shipping_routes_updated_at
  BEFORE UPDATE ON shipping_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS policies
ALTER TABLE shipping_routes ENABLE ROW LEVEL SECURITY;

-- Cualquiera autenticado puede ver rutas activas
CREATE POLICY "Anyone can view active shipping routes"
  ON shipping_routes FOR SELECT
  USING (active = true);

-- Superadmins pueden gestionar todas las rutas
CREATE POLICY "Superadmins can manage shipping routes"
  ON shipping_routes FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Insertar rutas iniciales para España (basadas en tu Sheet)
INSERT INTO shipping_routes (origin_port, destination_country, destination_port, min_days, max_days, notes) VALUES
  ('Shanghai', 'spain', 'Barcelona', 27, 31, 'Ruta principal China-España'),
  ('Shanghai', 'spain', 'Valencia', 28, 32, 'Ruta alternativa vía Valencia'),
  ('Ningbo', 'spain', 'Barcelona', 28, 32, 'Desde puerto Ningbo'),
  ('Qingdao', 'spain', 'Barcelona', 29, 33, 'Norte de China'),
  ('Tianjin', 'spain', 'Barcelona', 30, 34, 'Puerto cercano a Beijing'),
  ('Shenzhen', 'spain', 'Barcelona', 26, 30, 'Sur de China - ruta rápida'),
  ('Guangzhou', 'spain', 'Barcelona', 26, 30, 'Sur de China'),
  ('Xiamen', 'spain', 'Barcelona', 27, 31, 'Costa sureste China')
ON CONFLICT (origin_port, destination_country, destination_port) DO NOTHING;

COMMENT ON TABLE shipping_routes IS 'Rutas de envío con tiempos estimados de tránsito entre puertos';
COMMENT ON COLUMN shipping_routes.min_days IS 'Días mínimos de tránsito estimados';
COMMENT ON COLUMN shipping_routes.max_days IS 'Días máximos de tránsito estimados';
COMMENT ON COLUMN shipping_routes.freight_cost_override IS 'Costo de flete específico para esta ruta (sobreescribe el default del país si está definido)';
COMMENT ON COLUMN shipping_routes.last_updated IS 'Última actualización de los tiempos - alertar si >90 días';
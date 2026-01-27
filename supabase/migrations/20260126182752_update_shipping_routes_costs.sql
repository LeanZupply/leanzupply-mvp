-- Update shipping routes with port-specific freight costs and corrected transit times
-- Based on Google Sheet "LZ | Tester Modulo Logistica y Comercio Exterior"

-- Tianjin: €75/m³, 38-45 days
UPDATE shipping_routes
SET
  freight_cost_override = 75,
  min_days = 38,
  max_days = 45,
  last_updated = now(),
  updated_at = now()
WHERE origin_port = 'Tianjin' AND destination_country = 'spain';

-- Qingdao: €70/m³, 35-42 days
UPDATE shipping_routes
SET
  freight_cost_override = 70,
  min_days = 35,
  max_days = 42,
  last_updated = now(),
  updated_at = now()
WHERE origin_port = 'Qingdao' AND destination_country = 'spain';

-- Shanghai: €65/m³, 30-38 days
UPDATE shipping_routes
SET
  freight_cost_override = 65,
  min_days = 30,
  max_days = 38,
  last_updated = now(),
  updated_at = now()
WHERE origin_port = 'Shanghai' AND destination_country = 'spain';

-- Ningbo: €65/m³, 28-35 days
UPDATE shipping_routes
SET
  freight_cost_override = 65,
  min_days = 28,
  max_days = 35,
  last_updated = now(),
  updated_at = now()
WHERE origin_port = 'Ningbo' AND destination_country = 'spain';

-- Xiamen: €70/m³, 27-33 days
UPDATE shipping_routes
SET
  freight_cost_override = 70,
  min_days = 27,
  max_days = 33,
  last_updated = now(),
  updated_at = now()
WHERE origin_port = 'Xiamen' AND destination_country = 'spain';

-- Shenzhen: €70/m³, 25-30 days
UPDATE shipping_routes
SET
  freight_cost_override = 70,
  min_days = 25,
  max_days = 30,
  last_updated = now(),
  updated_at = now()
WHERE origin_port = 'Shenzhen' AND destination_country = 'spain';

-- Guangzhou: €70/m³, 25-32 days
UPDATE shipping_routes
SET
  freight_cost_override = 70,
  min_days = 25,
  max_days = 32,
  last_updated = now(),
  updated_at = now()
WHERE origin_port = 'Guangzhou' AND destination_country = 'spain';

COMMENT ON TABLE shipping_routes IS 'Rutas de envío con tiempos estimados y costos de flete por puerto de origen. Actualizado 2026-01-26 según Sheet Logística.';

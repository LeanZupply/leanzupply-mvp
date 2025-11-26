-- Fase 1: Agregar parámetros logísticos de España a la tabla settings
INSERT INTO settings (key, value, type, description) VALUES
  ('spain_freight_cost_per_m3', '115', 'number', 'Flete marítimo por m³ para España (€)'),
  ('spain_marine_insurance_percentage', '1', 'number', 'Seguro internacional para España (%)'),
  ('spain_destination_variable_cost', '65', 'number', 'Gastos destino variable España (€)'),
  ('spain_destination_fixed_cost', '180', 'number', 'Gastos destino fijo España (€)'),
  ('spain_dua_cost', '105', 'number', 'DUA - Despacho de Aduanas España (€)'),
  ('spain_tariff_percentage', '3', 'number', 'Arancel base España (%)'),
  ('spain_vat_percentage', '21', 'number', 'IVA España (%)'),
  ('spain_origin_expenses', '0', 'number', 'Gastos de origen por defecto España (€)'),
  ('spain_local_delivery_cost', '0', 'number', 'Entrega local por defecto España (€)')
ON CONFLICT (key) DO NOTHING;

-- Fase 3: Agregar campo calculation_snapshot a tabla orders para auditoría
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS calculation_snapshot JSONB DEFAULT NULL;

COMMENT ON COLUMN orders.calculation_snapshot IS 
'Snapshot completo del cálculo logístico usado al crear la orden. Permite reconstruir el cálculo exacto incluso si los parámetros cambian después.';
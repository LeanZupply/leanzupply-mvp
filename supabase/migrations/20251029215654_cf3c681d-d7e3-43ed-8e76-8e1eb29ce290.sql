-- Add cost calculation fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS freight_cost_per_m3 NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS origin_expenses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS marine_insurance_percentage NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS destination_expenses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS local_delivery_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tariff_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_percentage NUMERIC DEFAULT 21,
ADD COLUMN IF NOT EXISTS shipping_cost_total NUMERIC GENERATED ALWAYS AS (
  COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
  COALESCE(origin_expenses, 0) + 
  COALESCE(destination_expenses, 0) + 
  COALESCE(local_delivery_cost, 0)
) STORED,
ADD COLUMN IF NOT EXISTS cif_value NUMERIC GENERATED ALWAYS AS (
  price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)
) STORED,
ADD COLUMN IF NOT EXISTS marine_insurance_cost NUMERIC GENERATED ALWAYS AS (
  (price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)) * 
  COALESCE(marine_insurance_percentage, 0.5) / 100
) STORED,
ADD COLUMN IF NOT EXISTS taxable_base NUMERIC GENERATED ALWAYS AS (
  price_unit + 
  COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
  COALESCE(origin_expenses, 0) + 
  ((price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)) * COALESCE(marine_insurance_percentage, 0.5) / 100) +
  COALESCE(destination_expenses, 0)
) STORED,
ADD COLUMN IF NOT EXISTS tariff_cost NUMERIC GENERATED ALWAYS AS (
  (price_unit + 
   COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
   COALESCE(origin_expenses, 0) + 
   ((price_unit + COALESCE(freight_cost_per_m3, 0) + COALESCE(origin_expenses, 0)) * COALESCE(marine_insurance_percentage, 0.5) / 100) +
   COALESCE(destination_expenses, 0)) * COALESCE(tariff_percentage, 0) / 100
) STORED,
ADD COLUMN IF NOT EXISTS vat_cost NUMERIC GENERATED ALWAYS AS (
  (price_unit + 
   COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
   COALESCE(origin_expenses, 0) + 
   ((price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)) * COALESCE(marine_insurance_percentage, 0.5) / 100) +
   COALESCE(destination_expenses, 0) +
   ((price_unit + 
     COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
     COALESCE(origin_expenses, 0) + 
     ((price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)) * COALESCE(marine_insurance_percentage, 0.5) / 100) +
     COALESCE(destination_expenses, 0)) * COALESCE(tariff_percentage, 0) / 100)
  ) * COALESCE(vat_percentage, 21) / 100
) STORED,
ADD COLUMN IF NOT EXISTS total_cost_with_taxes NUMERIC GENERATED ALWAYS AS (
  price_unit + 
  COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
  COALESCE(origin_expenses, 0) + 
  ((price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)) * COALESCE(marine_insurance_percentage, 0.5) / 100) +
  COALESCE(destination_expenses, 0) +
  COALESCE(local_delivery_cost, 0) +
  ((price_unit + 
    COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
    COALESCE(origin_expenses, 0) + 
    ((price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)) * COALESCE(marine_insurance_percentage, 0.5) / 100) +
    COALESCE(destination_expenses, 0)) * COALESCE(tariff_percentage, 0) / 100) +
  ((price_unit + 
    COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
    COALESCE(origin_expenses, 0) + 
    ((price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)) * COALESCE(marine_insurance_percentage, 0.5) / 100) +
    COALESCE(destination_expenses, 0) +
    ((price_unit + 
      COALESCE(freight_cost_per_m3 * volume_m3, 0) + 
      COALESCE(origin_expenses, 0) + 
      ((price_unit + COALESCE(freight_cost_per_m3 * volume_m3, 0) + COALESCE(origin_expenses, 0)) * COALESCE(marine_insurance_percentage, 0.5) / 100) +
      COALESCE(destination_expenses, 0)) * COALESCE(tariff_percentage, 0) / 100)
   ) * COALESCE(vat_percentage, 21) / 100)
) STORED;

COMMENT ON COLUMN products.freight_cost_per_m3 IS 'Costo de flete marítimo por m³';
COMMENT ON COLUMN products.origin_expenses IS 'Gastos en origen (fijos)';
COMMENT ON COLUMN products.marine_insurance_percentage IS 'Porcentaje de seguro marítimo (default 0.5%)';
COMMENT ON COLUMN products.destination_expenses IS 'Gastos en destino';
COMMENT ON COLUMN products.local_delivery_cost IS 'Costo de entrega local';
COMMENT ON COLUMN products.tariff_percentage IS 'Porcentaje de arancel';
COMMENT ON COLUMN products.vat_percentage IS 'Porcentaje de IVA (default 21%)';
COMMENT ON COLUMN products.shipping_cost_total IS 'Costo total de envío (autocalculado)';
COMMENT ON COLUMN products.cif_value IS 'Valor CIF (Cost, Insurance, Freight) autocalculado';
COMMENT ON COLUMN products.marine_insurance_cost IS 'Costo del seguro marítimo (autocalculado)';
COMMENT ON COLUMN products.taxable_base IS 'Base imponible para impuestos (autocalculado)';
COMMENT ON COLUMN products.tariff_cost IS 'Costo del arancel (autocalculado)';
COMMENT ON COLUMN products.vat_cost IS 'Costo del IVA (autocalculado)';
COMMENT ON COLUMN products.total_cost_with_taxes IS 'Costo total con todos los impuestos (autocalculado)';
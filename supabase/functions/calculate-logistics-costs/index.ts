import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const CalculationInputSchema = z.object({
  product_id: z.string().uuid({ message: 'Invalid product_id format' }),
  quantity: z.number().int().positive().max(1000000, { message: 'Quantity exceeds maximum allowed' }),
  destination_country: z.string().trim().min(2).max(100).regex(/^[a-zA-Z\s\-]+$/, { message: 'Invalid country name format' }),
  destination_port: z.string().trim().max(100).optional(),
  origin_port: z.string().trim().max(100).optional(),
  buyer_id: z.string().uuid({ message: 'Invalid buyer_id format' }).optional()
});

interface CalculationInput {
  product_id: string;
  quantity: number;
  destination_country: string;
  destination_port?: string;
  origin_port?: string;
  buyer_id?: string;
}

interface Product {
  id: string;
  name: string;
  price_unit: number;
  volume_m3: number;
  moq: number;
  discount_3u: number | null;
  discount_5u: number | null;
  discount_8u: number | null;
  discount_10u: number | null;
  tariff_percentage: number | null;
  hs_code: string | null;
  status: string;
  lead_time_production_days: number | null;
  lead_time_logistics_days: number | null;
}

interface LogisticsParameters {
  freight_cost_per_m3: number;
  marine_insurance_percentage: number;
  destination_variable_cost: number;
  destination_fixed_cost: number;
  dua_cost: number;
  tariff_percentage: number;
  vat_percentage: number;
  origin_expenses: number;
  local_delivery_cost: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key to bypass RLS for settings table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate input
    const rawInput = await req.json();
    
    let input: CalculationInput;
    try {
      input = CalculationInputSchema.parse(rawInput);
    } catch (error) {
      console.error('[CALC] Input validation failed:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input parameters',
          details: error instanceof z.ZodError ? error.errors : undefined
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { product_id, quantity, destination_country, destination_port, origin_port, buyer_id } = input;

    console.log('[CALC] Starting calculation', { product_id, quantity, destination_country, destination_port, origin_port });

    // 1. Obtener producto de DB
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price_unit, volume_m3, moq, discount_3u, discount_5u, discount_8u, discount_10u, tariff_percentage, hs_code, status, lead_time_production_days, lead_time_logistics_days')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      throw new Error(`Product not found: ${product_id}`);
    }

    console.log('[CALC] Product data:', product);

    // Validaciones del producto
    if (product.status !== 'active') {
      throw new Error(`Product is not active: ${product.status}`);
    }

    if (!product.volume_m3 || product.volume_m3 <= 0) {
      throw new Error('Product volume_m3 must be greater than 0');
    }

    if (!product.price_unit || product.price_unit <= 0) {
      throw new Error('Product price_unit must be greater than 0');
    }

    if (quantity < product.moq) {
      throw new Error(`Quantity ${quantity} is below minimum order quantity (MOQ: ${product.moq})`);
    }

    // 2. Obtener parámetros logísticos del país
    const country_prefix = destination_country.toLowerCase();
    const neededKeys = [
      'freight_cost_per_m3',
      'marine_insurance_percentage',
      'destination_variable_cost',
      'destination_fixed_cost',
      'dua_cost',
      'tariff_percentage',
      'vat_percentage',
      'origin_expenses',
      'local_delivery_cost',
    ];
    const fullKeys = neededKeys.map((k) => `${country_prefix}_${k}`);

    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', fullKeys);

    console.log('[CALC] Query settings with keys:', fullKeys, 'Error:', settingsError, 'Results:', settings?.length);

    if (settingsError) {
      console.error('[CALC] Settings query error:', settingsError);
      throw new Error(`Error fetching logistics parameters: ${settingsError.message}`);
    }

    if (!settings || settings.length === 0) {
      console.error('[CALC] No settings found for country:', destination_country);
      throw new Error(`No logistics parameters configured for country: ${destination_country}`);
    }

    // Validar faltantes
    const foundKeys = new Set(settings.map((s) => s.key));
    const missing = fullKeys.filter((k) => !foundKeys.has(k));
    if (missing.length) {
      console.warn('[CALC] Missing logistics keys:', missing);
    }

    console.log('[CALC] Settings loaded:', settings);

    // Convertir settings a objeto
    const parameters: LogisticsParameters = {
      freight_cost_per_m3: 0,
      marine_insurance_percentage: 0,
      destination_variable_cost: 0,
      destination_fixed_cost: 0,
      dua_cost: 0,
      tariff_percentage: 0,
      vat_percentage: 0,
      origin_expenses: 0,
      local_delivery_cost: 0,
    };

    settings.forEach(setting => {
      const key = setting.key.replace(`${country_prefix}_`, '');
      parameters[key as keyof LogisticsParameters] = parseFloat(setting.value);
    });

    console.log('[CALC] Parameters processed:', parameters);

    // 2.5. Obtener tiempos de tránsito y seleccionar mejor ruta
    let transitInfo = null;
    let freightCostForRoute = parameters.freight_cost_per_m3;
    let selectedDestinationPort = destination_port;
    
    if (origin_port) {
      // Si NO se especificó puerto de destino, buscar la mejor ruta automáticamente
      if (!destination_port) {
        console.log('[CALC] No destination port specified, finding optimal route...');
        
        const { data: allRoutes, error: routesError } = await supabase
          .from('shipping_routes')
          .select('*')
          .eq('origin_port', origin_port)
          .eq('destination_country', destination_country.toLowerCase())
          .eq('active', true)
          .order('min_days', { ascending: true });

        if (allRoutes && allRoutes.length > 0) {
          // Seleccionar la ruta con menor tiempo de tránsito (min_days)
          const bestRoute = allRoutes[0];
          selectedDestinationPort = bestRoute.destination_port;
          
          transitInfo = {
            origin_port: bestRoute.origin_port,
            destination_port: bestRoute.destination_port,
            min_days: bestRoute.min_days,
            max_days: bestRoute.max_days,
            last_updated: bestRoute.last_updated,
            is_outdated: new Date().getTime() - new Date(bestRoute.last_updated).getTime() > 90 * 24 * 60 * 60 * 1000,
          };
          
          if (bestRoute.freight_cost_override) {
            freightCostForRoute = bestRoute.freight_cost_override;
          }
          
          console.log('[CALC] Optimal route selected automatically:', {
            destination_port: selectedDestinationPort,
            min_days: bestRoute.min_days,
            available_routes: allRoutes.length
          });
        } else {
          console.log('[CALC] No routes found for origin port, using default parameters');
        }
      } else {
        // Puerto destino especificado, usar ruta específica
        const { data: routeData, error: routeError } = await supabase
          .from('shipping_routes')
          .select('*')
          .eq('origin_port', origin_port)
          .eq('destination_port', destination_port)
          .eq('destination_country', destination_country.toLowerCase())
          .eq('active', true)
          .maybeSingle();

        if (routeData) {
          transitInfo = {
            origin_port: routeData.origin_port,
            destination_port: routeData.destination_port,
            min_days: routeData.min_days,
            max_days: routeData.max_days,
            last_updated: routeData.last_updated,
            is_outdated: new Date().getTime() - new Date(routeData.last_updated).getTime() > 90 * 24 * 60 * 60 * 1000,
          };
          
          if (routeData.freight_cost_override) {
            freightCostForRoute = routeData.freight_cost_override;
            console.log('[CALC] Using route-specific freight cost:', freightCostForRoute);
          }
          
          console.log('[CALC] Transit info loaded:', transitInfo);
        } else {
          console.log('[CALC] No specific route found, using default parameters');
        }
      }
    }

    // 3. Aplicar descuento por volumen
    let discount_rate = 0;
    let discount_tier = 'none';
    
    if (quantity >= 10 && product.discount_10u) {
      discount_rate = product.discount_10u / 100;
      discount_tier = '10u';
    } else if (quantity >= 8 && product.discount_8u) {
      discount_rate = product.discount_8u / 100;
      discount_tier = '8u';
    } else if (quantity >= 5 && product.discount_5u) {
      discount_rate = product.discount_5u / 100;
      discount_tier = '5u';
    } else if (quantity >= 3 && product.discount_3u) {
      discount_rate = product.discount_3u / 100;
      discount_tier = '3u';
    }

    console.log('[CALC] Discount applied:', { discount_rate, discount_tier });

    // 4. Calcular FOB (Free On Board)
    const fob = Math.round(product.price_unit * quantity * (1 - discount_rate) * 100) / 100;
    console.log('[CALC] FOB calculated:', fob);

    // 5. Calcular Flete Marítimo
    const total_volume_m3 = product.volume_m3 * quantity;
    let freight = Math.round(total_volume_m3 * freightCostForRoute * 100) / 100;
    console.log('[CALC] Base freight calculated:', freight, { total_volume_m3, freight_cost_per_m3: freightCostForRoute });

    // 5.5. Aplicar surcharge por volumen si aplica
    const { data: volumeSurcharges, error: surchargeError } = await supabase
      .from('volume_surcharges')
      .select('*')
      .eq('active', true)
      .lte('min_volume', total_volume_m3)
      .or(`max_volume.gte.${total_volume_m3},max_volume.is.null`)
      .order('min_volume', { ascending: false })
      .limit(1)
      .maybeSingle();

    let volume_surcharge = 0;
    let surcharge_tier = null;
    if (volumeSurcharges) {
      volume_surcharge = volumeSurcharges.surcharge_amount;
      surcharge_tier = `${volumeSurcharges.min_volume}-${volumeSurcharges.max_volume || '∞'} m³`;
      freight = Math.round((freight + volume_surcharge) * 100) / 100;
      console.log('[CALC] Volume surcharge applied:', { surcharge_tier, surcharge_amount: volume_surcharge, freight_total: freight });
    }

    // 6. Gastos de Origen
    const origin_expenses = parameters.origin_expenses || 0;
    console.log('[CALC] Origin expenses:', origin_expenses);

    // 7. Calcular Seguro Marítimo (sobre FOB + Flete, NO incluye gastos origen)
    const insurance_base = Math.round((fob + freight) * 100) / 100;
    const insurance = Math.round(insurance_base * (parameters.marine_insurance_percentage / 100) * 100) / 100;
    console.log('[CALC] Insurance calculated:', insurance, { insurance_base, rate: parameters.marine_insurance_percentage });

    // 8. Calcular CIF (Cost, Insurance, Freight) 
    const cif = Math.round((fob + freight + insurance) * 100) / 100;
    console.log('[CALC] CIF calculated:', cif);

    // 9. Calcular Base Imponible (CIF + Gastos Origen + Gastos Destino)
    // El costo variable de destino se multiplica por volumen (€/m³)
    const destination_variable_total = Math.round(parameters.destination_variable_cost * total_volume_m3 * 100) / 100;
    const destination_fixed_cost = parameters.destination_fixed_cost;
    const dua_cost = parameters.dua_cost;
    const destination_expenses = destination_variable_total + destination_fixed_cost + dua_cost;
    const taxable_base = Math.round((cif + origin_expenses + destination_expenses) * 100) / 100;
    console.log('[CALC] Taxable base calculated:', taxable_base, { cif, origin_expenses, destination_variable_total, destination_fixed_cost, dua_cost, destination_expenses });

    // 10. Calcular Arancel (sobre la base imponible)
    const tariff_rate = parameters.tariff_percentage;
    const tariff = Math.round(taxable_base * (tariff_rate / 100) * 100) / 100;
    console.log('[CALC] Tariff calculated:', tariff, { taxable_base, tariff_rate });

    // 11. Calcular IVA (sobre base imponible + arancel)
    const vat_base = Math.round((taxable_base + tariff) * 100) / 100;
    const vat = Math.round(vat_base * (parameters.vat_percentage / 100) * 100) / 100;
    console.log('[CALC] VAT calculated:', vat, { vat_base, vat_rate: parameters.vat_percentage });

    // 11. Calcular subtotales intermedios
    const subtotal_shipping_taxes = Math.round((freight + insurance + destination_expenses + tariff + vat) * 100) / 100;
    const total_without_taxes = Math.round((fob + freight + insurance + destination_expenses) * 100) / 100;
    const buyer_fee_percentage = 2;
    const buyer_fee = Math.round(total_without_taxes * (buyer_fee_percentage / 100) * 100) / 100;
    
    // 12. Calcular Total Final
    const total = Math.round((taxable_base + tariff + vat + buyer_fee) * 100) / 100;
    console.log('[CALC] Final total:', total);

    // 11.5. Calcular timeline de entrega completo
    const production_days = product.lead_time_production_days || 0;
    const logistics_to_port_days = product.lead_time_logistics_days || 0;
    
    // CRITICAL: Use actual route days, only fallback if transitInfo is completely null
    const maritime_min_days = transitInfo ? transitInfo.min_days : 30;
    const maritime_max_days = transitInfo ? transitInfo.max_days : 35;
    
    const customs_clearance_days_min = 5; // Estimado mínimo estándar
    const customs_clearance_days_max = 7; // Estimado máximo estándar
    
    console.log('[CALC] Timeline components:', {
      production_days,
      logistics_to_port_days,
      maritime_min_days,
      maritime_max_days,
      transitInfo_exists: !!transitInfo,
      route_info: transitInfo ? `${transitInfo.origin_port} → ${transitInfo.destination_port}` : 'No route'
    });
    
    const total_delivery_min = production_days + logistics_to_port_days + maritime_min_days + customs_clearance_days_min;
    const total_delivery_max = production_days + logistics_to_port_days + maritime_max_days + customs_clearance_days_max;
    
    const delivery_timeline = {
      production_days,
      logistics_to_port_days,
      maritime_transit_min_days: maritime_min_days,
      maritime_transit_max_days: maritime_max_days,
      customs_clearance_min_days: customs_clearance_days_min,
      customs_clearance_max_days: customs_clearance_days_max,
      total_min_days: total_delivery_min,
      total_max_days: total_delivery_max,
      has_complete_data: production_days > 0 && logistics_to_port_days > 0 && transitInfo !== null,
    };
    
    console.log('[CALC] Delivery timeline calculated:', delivery_timeline);

    // 12. Preparar respuesta con desglose completo
    const calculation = {
      // Inputs
      product_id: product.id,
      product_name: product.name,
      quantity,
      destination_country,
      calculated_at: new Date().toISOString(),

      // Parámetros usados (para snapshot)
      parameters: {
        freight_cost_per_m3: freightCostForRoute,
        marine_insurance_percentage: parameters.marine_insurance_percentage,
        destination_variable_cost: parameters.destination_variable_cost,
        destination_fixed_cost: parameters.destination_fixed_cost,
        dua_cost: parameters.dua_cost,
        tariff_percentage: tariff_rate,
        vat_percentage: parameters.vat_percentage,
        origin_expenses: parameters.origin_expenses,
        local_delivery_cost: parameters.local_delivery_cost,
      },

      // Información de tránsito (si está disponible)
      transit_info: transitInfo,

      // Timeline de entrega estimado
      delivery_timeline,

      // Resultados paso a paso
      breakdown: {
        price_unit: product.price_unit,
        total_volume_m3,
        discount_applied: Math.round(discount_rate * 100 * 100) / 100, // % con 2 decimales
        discount_tier,
        fob,
        freight_base: Math.round(total_volume_m3 * freightCostForRoute * 100) / 100,
        volume_surcharge,
        freight,
        origin_expenses,
        cif,
        insurance,
        destination_variable_total,
        destination_fixed_cost,
        dua_cost,
        destination_expenses,
        taxable_base,
        tariff,
        vat,
        subtotal_shipping_taxes,
        total_without_taxes,
        buyer_fee,
        buyer_fee_percentage,
        total,
      },

      // Metadata para transparencia
      metadata: {
        volume_per_unit: product.volume_m3,
        total_volume_m3,
        moq: product.moq,
        moq_validated: quantity >= product.moq,
        hs_code: product.hs_code,
        volume_surcharge_tier: surcharge_tier,
      },
    };

    console.log('[CALC] Calculation complete:', calculation);

    return new Response(
      JSON.stringify({ success: true, calculation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    // Log detailed error server-side only
    console.error('[CALC] Error calculating logistics costs:', error);
    
    // Return generic, safe message to client
    const userMessage = error?.message?.includes('Product not found') 
      ? 'Product not found'
      : error?.message?.includes('Quantity') || error?.message?.includes('quantity')
      ? 'Invalid quantity specified'
      : error?.message?.includes('Country') || error?.message?.includes('country')
      ? 'Unsupported destination country'
      : 'Unable to calculate logistics costs. Please try again.';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: userMessage
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

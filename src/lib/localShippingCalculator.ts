import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/formatters";

interface PostalCodeRange {
  start: string;
  end: string;
  label: string;
  is_fallback?: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  postal_code_ranges: PostalCodeRange[];
  active: boolean;
  display_order: number;
}

interface VolumeSurcharge {
  id: string;
  min_volume: number;
  max_volume: number | null;
  surcharge_amount: number;
  requires_quote: boolean;
  description: string | null;
  active: boolean;
}

export interface LocalShippingCalculation {
  zone: ShippingZone | null;
  zone_price: number;
  volume_surcharge: VolumeSurcharge | null;
  surcharge_amount: number;
  total_local_shipping: number;
  requires_quote: boolean;
  postal_code: string;
  total_volume_m3: number;
  breakdown: {
    zone_name: string;
    zone_description: string;
    base_price: number;
    volume_range: string;
    surcharge: number;
  };
}

/**
 * Detecta la zona de envío basándose en el código postal
 */
export async function detectShippingZone(postalCode: string): Promise<ShippingZone | null> {
  try {
    const { data: zones, error } = await supabase
      .from("local_shipping_zones")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    if (!zones || zones.length === 0) return null;

    // Normalizar el código postal (quitar espacios, convertir a mayúsculas)
    const normalizedCP = postalCode.replace(/\s/g, "").toUpperCase();

    // Buscar la primera zona que coincida
    for (const zone of zones) {
      const ranges = zone.postal_code_ranges as unknown as PostalCodeRange[];
      for (const range of ranges) {
        // Si es un rango fallback, se usa como último recurso
        if (range.is_fallback) continue;

        const start = range.start.replace(/\s/g, "");
        const end = range.end.replace(/\s/g, "");

        // Comparar rangos (asumiendo códigos numéricos)
        if (normalizedCP >= start && normalizedCP <= end) {
          return zone as any;
        }
      }
    }

    // Si no se encontró coincidencia, buscar zona fallback
    for (const zone of zones) {
      const ranges = zone.postal_code_ranges as unknown as PostalCodeRange[];
      const hasFallback = ranges.some(r => r.is_fallback);
      if (hasFallback) return zone as any;
    }

    return null;
  } catch (error) {
    console.error("[LocalShipping] Error detecting zone:", error);
    return null;
  }
}

/**
 * Detecta el recargo por volumen
 */
export async function detectVolumeSurcharge(totalVolumeM3: number): Promise<VolumeSurcharge | null> {
  try {
    const { data: surcharges, error } = await supabase
      .from("volume_surcharges")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    if (!surcharges || surcharges.length === 0) return null;

    // Buscar el primer recargo que aplique
    for (const surcharge of surcharges) {
      if (totalVolumeM3 >= surcharge.min_volume) {
        if (surcharge.max_volume === null || totalVolumeM3 < surcharge.max_volume) {
          return surcharge;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[LocalShipping] Error detecting surcharge:", error);
    return null;
  }
}

/**
 * Calcula el costo total de envío local
 */
export async function calculateLocalShipping(
  postalCode: string,
  totalVolumeM3: number
): Promise<LocalShippingCalculation> {
  const zone = await detectShippingZone(postalCode);
  const volumeSurcharge = await detectVolumeSurcharge(totalVolumeM3);

  const zonePrice = zone?.base_price || 0;
  const surchargeAmount = volumeSurcharge?.surcharge_amount || 0;
  const total = zonePrice + surchargeAmount;

  return {
    zone,
    zone_price: zonePrice,
    volume_surcharge: volumeSurcharge,
    surcharge_amount: surchargeAmount,
    total_local_shipping: total,
    requires_quote: volumeSurcharge?.requires_quote || false,
    postal_code: postalCode,
    total_volume_m3: totalVolumeM3,
    breakdown: {
      zone_name: zone?.name || "Zona no detectada",
      zone_description: zone?.description || "",
      base_price: zonePrice,
      volume_range: volumeSurcharge
        ? `${formatNumber(volumeSurcharge.min_volume)} - ${volumeSurcharge.max_volume != null ? formatNumber(volumeSurcharge.max_volume) : "∞"} m³`
        : "No aplicable",
      surcharge: surchargeAmount,
    },
  };
}

/**
 * Valida si un código postal es español
 */
export function isSpanishPostalCode(postalCode: string): boolean {
  const normalized = postalCode.replace(/\s/g, "");
  // Códigos postales españoles: 5 dígitos, empiezan del 01 al 52
  return /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(normalized);
}

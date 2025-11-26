import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductsQueryOptions {
  status?: string;
  limit?: number;
  manufacturerId?: string;
}

export const useProductsQuery = (options: ProductsQueryOptions = {}) => {
  const { status = "active", limit = 100, manufacturerId } = options;

  return useQuery({
    queryKey: ["products", status, manufacturerId, limit],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          category,
          subcategory,
          description,
          price_unit,
          moq,
          stock,
          status,
          images,
          lead_time_production_days,
          views_count,
          material,
          weight,
          dimensions,
          color,
          specs,
          sku,
          length_cm,
          width_cm,
          height_cm,
          weight_net_kg,
          weight_gross_kg,
          volume_m3,
          freight_cost_per_m3,
          origin_expenses,
          marine_insurance_percentage,
          destination_expenses,
          local_delivery_cost,
          tariff_percentage,
          vat_percentage,
          shipping_cost_total,
          cif_value,
          marine_insurance_cost,
          taxable_base,
          tariff_cost,
          vat_cost,
          total_cost_with_taxes,
          manufacturer_id
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      }

      if (manufacturerId) {
        query = query.eq("manufacturer_id", manufacturerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const products = data || [];
      
      // Cargar info básica del fabricante desde profiles en un segundo query
      const manufacturerIds = Array.from(
        new Set(products.map((p: any) => p.manufacturer_id).filter(Boolean))
      );
      
      let profilesMap: Record<string, { company_name: string; country: string }> = {};
      if (manufacturerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, company_name, country")
          .in("id", manufacturerIds as string[]);
        profilesMap = Object.fromEntries(
          (profilesData || []).map((pr: any) => [pr.id, { company_name: pr.company_name, country: pr.country }])
        );
      }
      
      // Adjuntar manufacturer básico (opcional)
      const normalized = products.map((p: any) => ({
        ...p,
        manufacturer: p.manufacturer_id ? profilesMap[p.manufacturer_id] || null : null,
      }));
      
      // Debug
      if (normalized && normalized.length > 0) {
        console.log("Products data sample:", normalized[0]);
      }
      
      return normalized;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    gcTime: 1000 * 60 * 10, // Mantener en cache por 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

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
          model,
          brand,
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

      // Cargar info adicional del fabricante desde manufacturers (registered_brand, brand_logo_url)
      let manufacturersMap: Record<string, { registered_brand: string; brand_logo_url: string | null }> = {};
      if (manufacturerIds.length > 0) {
        const { data: manufacturersData } = await supabase
          .from("manufacturers")
          .select("user_id, registered_brand, brand_logo_url")
          .in("user_id", manufacturerIds as string[]);
        manufacturersMap = Object.fromEntries(
          (manufacturersData || []).map((m: any) => [m.user_id, {
            registered_brand: m.registered_brand,
            brand_logo_url: m.brand_logo_url
          }])
        );
      }

      // Adjuntar manufacturer básico (prioriza registered_brand sobre company_name)
      const normalized = products.map((p: any) => ({
        ...p,
        manufacturer: p.manufacturer_id ? {
          registered_brand: manufacturersMap[p.manufacturer_id]?.registered_brand || profilesMap[p.manufacturer_id]?.company_name,
          company_name: profilesMap[p.manufacturer_id]?.company_name,
          country: profilesMap[p.manufacturer_id]?.country,
          brand_logo_url: manufacturersMap[p.manufacturer_id]?.brand_logo_url
        } : null,
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

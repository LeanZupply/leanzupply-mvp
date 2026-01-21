import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Building2, MapPin, Package, Truck } from "lucide-react";
import { memo } from "react";
import { optimizeImageURL } from "@/hooks/useOptimizedImage";
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price_unit: number;
    moq?: number;
    model?: string | null;
    brand?: string | null;
    lead_time_production_days?: number | null;
    lead_time_logistics_days?: number | null;
    images?: any;
    manufacturer?: {
      registered_brand?: string;
      company_name?: string;
      country?: string;
      brand_logo_url?: string;
    } | null;
    category?: string;
    views_count?: number;
    material?: string | null;
    weight?: string | null;
    dimensions?: string | null;
    color?: string | null;
    sku?: string | null;
    length_cm?: number | null;
    width_cm?: number | null;
    height_cm?: number | null;
    weight_net_kg?: number | null;
    weight_gross_kg?: number | null;
  };
  onClick: () => void;
  showCategory?: boolean;
}
const ProductCardComponent = ({
  product,
  onClick,
  showCategory = false
}: ProductCardProps) => {
  // Debug: verificar datos del manufacturer
  console.log("Product manufacturer:", product.name, product.manufacturer);
  const getImageUrl = () => {
    if (!product.images) return "/placeholder.svg";
    try {
      const imagesArray = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
      const url = imagesArray?.[0]?.url || "/placeholder.svg";
      return optimizeImageURL(url, {
        width: 800,
        quality: 75
      });
    } catch {
      return "/placeholder.svg";
    }
  };
  const getManufacturerLogo = () => {
    const manufacturer = product.manufacturer as any;
    return manufacturer?.brand_logo_url || null;
  };
  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return "Sin descripción disponible";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };
  return <Card className="bg-card rounded-lg shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-border group hover:border-primary/30 relative" onClick={onClick}>
      <div className="relative h-48 overflow-hidden bg-muted flex items-center justify-center">
        <img src={getImageUrl()} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        {showCategory && product.category && <Badge variant="secondary" className="absolute top-3 right-3 backdrop-blur-sm shadow-sm">
            {product.category}
          </Badge>}
        
        {/* Delivery Time Badge - Prominent on image */}
        {product.lead_time_production_days !== null || product.lead_time_logistics_days}
        
        {/* Views Counter */}
        {product.views_count !== undefined && product.views_count > 0 && <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {product.views_count} vistas
          </div>}
      </div>
      
      {/* Hover Overlay - Fixed positioning */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 pointer-events-none" style={{
      zIndex: 5
    }}>
        <p className="text-white text-sm mb-3 line-clamp-3">
          {truncateText(product.description, 120)}
        </p>
        
        {/* Manufacturer info in hover */}
        <div className="flex items-center gap-2 text-white/90 text-xs mb-3">
          {getManufacturerLogo() ? <img src={getManufacturerLogo()!} alt={product.manufacturer?.registered_brand || product.manufacturer?.company_name || "Fabricante"} className="h-5 w-5 rounded object-contain bg-white/90 p-0.5" /> : <Building2 className="h-4 w-4" />}
          <span className="font-medium">{product.manufacturer?.registered_brand || product.manufacturer?.company_name || "Fabricante"}</span>
          {product.manufacturer?.country && <>
              <MapPin className="h-3 w-3 ml-1" />
              <span>{product.manufacturer.country}</span>
            </>}
        </div>

        <Button className="w-full bg-white text-primary hover:bg-white/90 pointer-events-auto shadow-lg" onClick={e => {
        e.stopPropagation();
        onClick();
      }}>
          Ver más detalles
        </Button>
      </div>
      
      <CardContent className="p-5 space-y-3">
        {/* Product Name - Small & Truncated */}
        <h3 className="text-sm font-medium text-foreground truncate">
          {product.name}
        </h3>

        {/* Model and Manufacturer Brand */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {product.model && (
            <span><span className="font-medium text-foreground">Modelo:</span> {product.model}</span>
          )}
          {product.manufacturer?.registered_brand && (
            <span><span className="font-medium text-foreground">Marca:</span> {product.manufacturer.registered_brand}</span>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
          {truncateText(product.description, 120)}
        </p>

        {/* Technical Specifications Grid */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Especificaciones Técnicas
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {/* SKU - Oculto temporalmente */}
            {/* {product.sku && (
              <div className="flex flex-col gap-0.5 bg-muted/50 p-2 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase">SKU</span>
                <span className="text-xs font-medium truncate">{product.sku}</span>
              </div>
             )} */}
            {product.length_cm && product.width_cm && product.height_cm && <div className="flex flex-col gap-0.5 bg-muted/50 p-2 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase">Dimensiones (L×W×H)</span>
                <span className="text-xs font-medium truncate">
                  {product.length_cm} × {product.width_cm} × {product.height_cm} cm
                </span>
              </div>}
            {product.weight_net_kg && <div className="flex flex-col gap-0.5 bg-muted/50 p-2 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase">Peso Neto</span>
                <span className="text-xs font-medium truncate">{product.weight_net_kg} kg</span>
              </div>}
            {product.weight_gross_kg && <div className="flex flex-col gap-0.5 bg-muted/50 p-2 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase">Peso Bruto</span>
                <span className="text-xs font-medium truncate">{product.weight_gross_kg} kg</span>
              </div>}
            {product.material && <div className="flex flex-col gap-0.5 bg-muted/50 p-2 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase">Material</span>
                <span className="text-xs font-medium truncate">{product.material}</span>
              </div>}
            {product.color && <div className="flex flex-col gap-0.5 bg-muted/50 p-2 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase">Color</span>
                <span className="text-xs font-medium truncate">{product.color}</span>
              </div>}
          </div>
        </div>

        {/* Price and MOQ */}
        <div className="flex justify-between items-end pt-3">
          <div>
            <span className="text-2xl font-bold text-primary">
              €{product.price_unit.toLocaleString("es-ES")} <span className="text-sm font-semibold">FOB</span>
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              EUR por unidad
            </span>
          </div>

          {product.moq && <Badge variant="outline" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>MOQ: {product.moq}</span>
            </Badge>}
        </div>

        <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all group-hover:shadow-lg" onClick={e => {
        e.stopPropagation();
        onClick();
      }}>
          Ver Detalle Completo
        </Button>
      </CardContent>
    </Card>;
};
export const ProductCard = memo(ProductCardComponent);
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, ShoppingCart, Package as PackageIcon } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { handleError } from "@/lib/errorHandler";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/buyer/CategoryFilter";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { useProductsQuery } from "@/hooks/useProductsQuery";
import { usePerformanceTracking } from "@/hooks/usePerformanceTracking";
import { calculateOrderTotal } from "@/lib/priceCalculations";
import { formatNumber } from "@/lib/formatters";
interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  price_unit: number;
  moq: number;
  stock: number;
  model?: string | null;
  brand?: string | null;
  images: any;
  lead_time_production_days: number | null;
  discount_3u?: number | null;
  discount_5u?: number | null;
  discount_8u?: number | null;
  discount_10u?: number | null;
  manufacturer?: {
    registered_brand: string;
    country?: string;
    brand_logo_url?: string;
  } | null;
}
const BuyerCatalog = () => {
  usePerformanceTracking("buyer_catalog");
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState({
    quantity: "",
    incoterm: "FOB",
    notes: ""
  });

  // Usar React Query para cachear productos
  const {
    data: products = [],
    isLoading
  } = useProductsQuery({
    status: "active"
  });

  // Memoizar el filtrado de productos
  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || p.manufacturer?.company_name?.toLowerCase().includes(query));
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    return filtered;
  }, [products, searchQuery, categoryFilter]);
  const uniqueCategories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);
  const handleProductClick = (product: any) => {
    navigate(`/product/${product.id}`);
    trackEvent("product_viewed", {
      product_id: product.id,
      buyer_id: user?.id
    });
  };
  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user) return;

    const quantity = Number(orderForm.quantity);
    if (quantity < selectedProduct.moq) {
      toast.error(`La cantidad mínima es ${selectedProduct.moq} unidades`);
      return;
    }
    setSubmitting(true);
    try {
      const totalPrice = calculateOrderTotal(selectedProduct.price_unit, quantity, {
        discount_3u: selectedProduct.discount_3u,
        discount_5u: selectedProduct.discount_5u,
        discount_8u: selectedProduct.discount_8u,
        discount_10u: selectedProduct.discount_10u
      });

      // Obtener el manufacturer_id del producto completo
      const {
        data: productData
      } = await supabase.from("products").select("manufacturer_id").eq("id", selectedProduct.id).single();
      const {
        error
      } = await supabase.from("orders").insert({
        buyer_id: user.id,
        manufacturer_id: productData?.manufacturer_id,
        product_id: selectedProduct.id,
        quantity,
        total_price: totalPrice,
        status: "pending_confirmation",
        payment_status: "awaiting_agreement",
        incoterm: orderForm.incoterm,
        tracking_stage: "created",
        buyer_notes: orderForm.notes || null
      });
      if (error) throw error;
      await trackEvent("simulation_created", {
        buyer_id: user.id,
        product_id: selectedProduct.id,
        total: totalPrice
      });
      toast.success("¡Pedido enviado exitosamente! El fabricante revisará tu solicitud y te contactará pronto. Te notificaremos su respuesta.", {
        duration: 6000
      });
      setOrderDialogOpen(false);
      navigate("/buyer/orders");
    } catch (error) {
      const message = handleError("Order creation", error);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };
  if (isLoading) {
    return <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>;
  }
  return <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Catálogo de Productos</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Explora productos de fabricantes certificados    
        </p>
      </div>

      {/* Search Bar */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar productos, categorías o fabricantes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <CategoryFilter categories={uniqueCategories} selectedCategory={categoryFilter} onCategoryChange={setCategoryFilter} />

      {/* Results Count */}
      {filteredProducts.length > 0 && <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </p>
          {(searchQuery || categoryFilter !== "all") && <Button variant="ghost" size="sm" onClick={() => {
        setSearchQuery("");
        setCategoryFilter("all");
      }}>
              Limpiar filtros
            </Button>}
        </div>}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map(product => <ProductCard key={product.id} product={product} onClick={() => handleProductClick(product)} showCategory={categoryFilter === "all"} />)}
        </div> : <Card className="border-border">
          <CardContent className="py-16 text-center">
            <PackageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchQuery || categoryFilter !== "all" ? "No se encontraron productos con estos filtros" : "No hay productos disponibles"}
            </p>
          </CardContent>
        </Card>}

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Pedido</DialogTitle>
          </DialogHeader>
          {selectedProduct && <form onSubmit={submitOrder} className="space-y-6">
              {/* Product Info */}
              <Card className="bg-surface border-border">
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Producto</Label>
                    <p className="font-semibold text-lg text-foreground">{selectedProduct.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fabricante</Label>
                    <p className="font-medium">{selectedProduct.manufacturer?.registered_brand}</p>
                  </div>
                    <div>
                      <Label className="text-muted-foreground">País</Label>
                      <p className="font-medium">{selectedProduct.manufacturer?.country}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                    <div>
                      <Label className="text-muted-foreground">Precio/Unidad</Label>
                      <p className="font-bold text-xl text-primary">€{formatNumber(selectedProduct.price_unit)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Cantidad Mínima</Label>
                      <p className="font-bold text-xl">{selectedProduct.moq}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Cantidad (unidades) *</Label>
                  <Input id="quantity" type="number" required min={selectedProduct.moq} value={orderForm.quantity} onChange={e => setOrderForm({
                ...orderForm,
                quantity: e.target.value
              })} placeholder={`Mínimo ${selectedProduct.moq}`} />
                </div>

                <div>
                  <Label htmlFor="incoterm">Incoterm *</Label>
                  <Select value={orderForm.incoterm} onValueChange={value => setOrderForm({
                ...orderForm,
                incoterm: value
              })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB (Free On Board)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea id="notes" value={orderForm.notes} onChange={e => setOrderForm({
                ...orderForm,
                notes: e.target.value
              })} placeholder="Requisitos especiales, preferencias de envío, etc..." rows={3} />
                </div>
              </div>

              {/* Total */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-foreground">Precio Total Estimado:</span>
                    <span className="text-3xl font-bold text-primary">
                      €{formatNumber(Number(orderForm.quantity || 0) * selectedProduct.price_unit)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * No incluye costos de logística, seguro ni aduanas
                  </p>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setOrderDialogOpen(false)} className="flex-1" disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Creando..." : "Confirmar Pedido"}
                </Button>
              </div>
            </form>}
        </DialogContent>
      </Dialog>
    </div>;
};
export default BuyerCatalog;

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ArrowRight, Factory, ShoppingCart, Search, X, Globe, Shield, Zap, TrendingUp, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { trackContactClick } from "@/lib/gtmEvents";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
interface Product {
  id: string;
  name: string;
  description: string | null;
  price_unit: number;
  lead_time_production_days: number | null;
  moq?: number | null;
  sku?: string | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  weight_net_kg?: number | null;
  weight_gross_kg?: number | null;
  material?: string | null;
  color?: string | null;
  images: any;
  category: string;
  manufacturer: {
    registered_brand: string;
    country?: string | null;
    brand_logo_url?: string | null;
  } | null;
}
// Feature flags for landing page sections
const SHOW_WHAT_WE_SOLVE_SECTION = false; // Set to true to restore this section
const SHOW_SEO_SECTION = false; // Set to true to restore this section

const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    profile
  } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    manufacturer: "",
    leadTime: ""
  });
  useEffect(() => {
    if (user && profile) {
      const dashboardMap = {
        superadmin: "/superadmin",
        manufacturer: "/manufacturer",
        buyer: "/buyer"
      };
      navigate(dashboardMap[profile.role]);
    } else {
      fetchPublicProducts();
      trackEvent("landing_viewed");
    }
  }, [user, profile, navigate]);
  const fetchPublicProducts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("products").select(`
          id,
          name,
          description,
          price_unit,
          lead_time_production_days,
          moq,
          sku,
          length_cm,
          width_cm,
          height_cm,
          weight_net_kg,
          weight_gross_kg,
          material,
          color,
          images,
          category,
          manufacturer_id
        `).eq("status", "active").order("created_at", {
        ascending: false
      }).limit(9);
      if (error) throw error;
      const products = data || [];

      // Cargar info básica del fabricante desde profiles
      const manufacturerIds = Array.from(new Set(products.map((p: any) => p.manufacturer_id).filter(Boolean)));
      let profilesMap: Record<string, {
        company_name: string;
        country: string;
      }> = {};
      if (manufacturerIds.length > 0) {
        const {
          data: profilesData
        } = await supabase.from("profiles").select("id, company_name, country").in("id", manufacturerIds as string[]);
        profilesMap = Object.fromEntries((profilesData || []).map((pr: any) => [pr.id, {
          company_name: pr.company_name,
          country: pr.country
        }]));
      }

      // Adjuntar manufacturer básico compatible con ProductCard
      const normalized = products.map((p: any) => ({
        ...p,
        manufacturer: p.manufacturer_id ? {
          registered_brand: profilesMap[p.manufacturer_id]?.company_name || undefined,
          company_name: profilesMap[p.manufacturer_id]?.company_name,
          country: profilesMap[p.manufacturer_id]?.country,
          brand_logo_url: undefined
        } : null
      }));

      // Debug
      if (normalized && normalized.length > 0) {
        console.log("Public products sample:", normalized[0]);
      }
      setProducts(normalized);
      setFilteredProducts(normalized);
    } catch (error) {
      const message = handleError("Public products fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    applyFilters();
  }, [filters, products]);
  const applyFilters = () => {
    let filtered = products;
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    if (filters.manufacturer) {
      filtered = filtered.filter(p => p.manufacturer?.registered_brand === filters.manufacturer);
    }
    if (filters.leadTime) {
      const maxDays = Number(filters.leadTime);
      filtered = filtered.filter(p => (p.lead_time_production_days || 999) <= maxDays);
    }
    setFilteredProducts(filtered);
  };
  const clearFilters = () => {
    setFilters({
      category: "",
      manufacturer: "",
      leadTime: ""
    });
  };
  const hasActiveFilters = filters.category || filters.manufacturer || filters.leadTime;
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const uniqueManufacturers = Array.from(new Set(products.map(p => p.manufacturer?.registered_brand).filter(Boolean)));
  const handleCTAClick = (type: "join" | "explore") => {
    // Track in Supabase analytics
    trackEvent("cta_clicked", {
      cta_type: type
    });
    // Track in GTM/GA4
    trackContactClick("cta", type === "join" ? "manufacturer_signup" : "buyer_signup");

    if (type === "join") {
      navigate("/auth/signup?role=manufacturer");
    } else {
      navigate("/auth/signup?role=buyer");
    }
  };
  const handleProductView = (productId: string) => {
    trackEvent("product_viewed_public", {
      product_id: productId
    });
    navigate(`/products/${productId}`);
  };
  if (user && profile) {
    return null;
  }
  return <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LeanZupply</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Plataforma D2B </p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-3">
            <Button variant="ghost" size="lg" onClick={() => navigate("/auth/login")}>
              Iniciar Sesión
            </Button>
            <Button size="lg" onClick={() => navigate("/auth/signup")} className="shadow-sm">
              Comenzar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />

        <div className="container mx-auto relative">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            {/* Title */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              Negocios reales. Fabricantes reales.{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Comercio global sin intermediarios.
              </span>
            </h2>

            {/* Subtitle - tight coupling to title */}
            <p className="mt-6 text-xl md:text-2xl font-medium text-foreground/70 max-w-2xl mx-auto">
              Comprar maquinaria internacionalmente nunca fue tan simple.
            </p>

            {/* Description - more separation, quieter */}
            <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              LeanZupply es una plataforma D2B que une empresas profesionales europeas con fábricas verificadas en Asia y en Europa.
            </p>
          </div>
        </div>
      </section>

      {/* What We Solve Section */}
      {SHOW_WHAT_WE_SOLVE_SECTION && (
        <section className="border-t border-border bg-muted/30 px-4 py-20">
          <div className="container mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h3 className="text-4xl md:text-5xl font-bold">
                Importa y exporta maquinaria profesional con{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  transparencia, velocidad y control total
                </span>
              </h3>
            </div>

            <div className="max-w-5xl mx-auto">
              <h4 className="text-2xl font-bold mb-8 text-center">¿Qué resolvemos?</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h5 className="font-semibold text-lg mb-1">Fabricantes auditados</h5>
                        <p className="text-muted-foreground text-sm">Sin intermediarios falsos.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h5 className="font-semibold text-lg mb-1">Operaciones integradas</h5>
                        <p className="text-muted-foreground text-sm">Cotiza, paga y recibe.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h5 className="font-semibold text-lg mb-1">Logística global</h5>
                        <p className="text-muted-foreground text-sm">Control de punta a punta.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h5 className="font-semibold text-lg mb-1">Precios directos FOB</h5>
                        <p className="text-muted-foreground text-sm">Sin márgenes ocultos.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                <Button
                  size="lg"
                  className="gap-2 shadow-lg text-sm sm:text-base h-12 sm:h-14 px-4 sm:px-10 whitespace-normal sm:whitespace-nowrap"
                  onClick={() => handleCTAClick("join")}
                >
                  <Factory className="h-5 w-5 shrink-0" />
                  <span className="text-left sm:text-center">
                    <span className="hidden sm:inline">SOY FABRICANTE → publicar mis productos sin coste</span>
                    <span className="sm:hidden">FABRICANTE → publicar mis productos</span>
                  </span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-sm sm:text-base h-12 sm:h-14 px-4 sm:px-10 border-2 whitespace-normal sm:whitespace-nowrap"
                  onClick={() => handleCTAClick("explore")}
                >
                  <ShoppingCart className="h-5 w-5 shrink-0" />
                  <span className="text-left sm:text-center">
                    <span className="hidden sm:inline">SOY COMPRADOR → explorar maquinaria validada</span>
                    <span className="sm:hidden">COMPRADOR → explorar maquinaria</span>
                  </span>
                </Button>
              </div>

              <p className="text-center text-xl font-semibold mt-12 text-muted-foreground">
                Optimiza tus relaciones comerciales D2B
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Public Catalog */}
      <section className="border-t border-border px-4 py-20 bg-background">
        <div className="container mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-bold">Catálogo Curado de Productos</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubre productos de fabricantes verificados con información detallada
            </p>
          </div>

          {/* Filters */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select value={filters.category} onValueChange={v => setFilters({
                  ...filters,
                  category: v
                })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Todas las categorías</SelectItem>
                      {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filters.manufacturer} onValueChange={v => setFilters({
                  ...filters,
                  manufacturer: v
                })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todos los fabricantes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Todos los fabricantes</SelectItem>
                      {uniqueManufacturers.map(mfg => <SelectItem key={mfg} value={mfg!}>{mfg}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filters.leadTime} onValueChange={v => setFilters({
                  ...filters,
                  leadTime: v
                })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Tiempo de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Cualquier plazo</SelectItem>
                      <SelectItem value="15">&lt; 15 días</SelectItem>
                      <SelectItem value="30">15-30 días</SelectItem>
                      <SelectItem value="60">&gt; 30 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filtros activos:</span>
                    {filters.category && <Badge variant="secondary" className="gap-1">
                        {filters.category}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({
                    ...filters,
                    category: ""
                  })} />
                      </Badge>}
                    {filters.manufacturer && <Badge variant="secondary" className="gap-1">
                        {filters.manufacturer}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({
                    ...filters,
                    manufacturer: ""
                  })} />
                      </Badge>}
                    {filters.leadTime && <Badge variant="secondary" className="gap-1">
                        {filters.leadTime === "15" ? "<15 días" : filters.leadTime === "30" ? "15-30 días" : ">30 días"}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({
                    ...filters,
                    leadTime: ""
                  })} />
                      </Badge>}
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Limpiar todo
                    </Button>
                  </div>}
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)}
            </div> : filteredProducts.length > 0 ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map(product => <ProductCard key={product.id} product={product} onClick={() => handleProductView(product.id)} showCategory={true} />)}
            </div> : <Card className="border-border">
              <CardContent className="py-16 text-center">
                <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  No se encontraron productos con estos filtros
                </p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Limpiar filtros
                </Button>
              </CardContent>
            </Card>}
        </div>
      </section>


      {/* For Manufacturers & Buyers Section */}
      <section className="border-t border-border px-4 py-20 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-4xl font-bold">
              LeanZupply no es un marketplace, es una{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                plataforma profesional
              </span>{" "}
              que transforma el comercio internacional en una experiencia eficiente, transparente y segura.
            </h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* For Manufacturers */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="space-y-3">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Factory className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-2xl font-bold">PARA FABRICANTES</h4>
                  <p className="text-xl font-semibold">Vende globalmente, sin riesgo.</p>
                  <p className="text-muted-foreground">
                    Accede a empresas verificadas, recibe pagos seguros y gestiona todo desde un panel único.
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Comisión solo por venta concretada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Publicita tus productos sin fricciones</span>
                  </li>
                  
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Alcance internacional real</span>
                  </li>
                </ul>

                <Button size="lg" className="w-full gap-2" onClick={() => handleCTAClick("join")}>
                  Solicitar adhesión
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* For Buyers */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="space-y-3">
                  <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-accent" />
                  </div>
                  <h4 className="text-2xl font-bold">PARA COMPRADORES</h4>
                  <p className="text-xl font-semibold">Compra directo de fábrica.</p>
                  <p className="text-muted-foreground">
                    Obtén acceso a maquinaria certificada con precios FOB y tiempos de entrega definidos.
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Fabricantes verificados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Catálogo curado</span>
                  </li>
                  
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Seguimiento en tiempo real</span>
                  </li>
                </ul>

                <Button size="lg" variant="outline" className="w-full gap-2 border-2" onClick={() => handleCTAClick("explore")}>
                  Explorar catálogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Platform Description */}
          <div className="mt-16 text-center space-y-4 max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed">
              <strong className="text-foreground">LeanZupply</strong> – La plataforma D2B que conecta fabricantes certificados con empresas de todo el mundo.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Badge variant="outline" className="text-sm py-1.5 px-4">
                <Shield className="h-4 w-4 mr-2" />
                FABRICANTES VALIDADOS
              </Badge>
              <Badge variant="outline" className="text-sm py-1.5 px-4">
                <Package className="h-4 w-4 mr-2" />
                CATÁLOGO CURADO
              </Badge>
              <Badge variant="outline" className="text-sm py-1.5 px-4">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                PAGOS SEGUROS
              </Badge>
              <Badge variant="outline" className="text-sm py-1.5 px-4">
                <Globe className="h-4 w-4 mr-2" />
                LOGÍSTICA INTEGRADA
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Section */}
      {SHOW_SEO_SECTION && (
        <section className="border-t border-border px-4 py-16 bg-background">
          <div className="container mx-auto max-w-4xl space-y-6 text-center">
            <h3 className="text-3xl font-bold">Optimiza tus relaciones comerciales D2B</h3>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                En <strong>LeanZupply</strong> conectamos fábricas certificadas con empresas que buscan equipamiento profesional de calidad.
                Nuestra plataforma D2B facilita la gestión de pedidos, contratos y logística internacional en un solo lugar.
              </p>
              <p>
                Los fabricantes pueden exhibir sus productos a compradores verificados, mientras las empresas acceden a <strong>precios FOB competitivos</strong> y
                tiempos de entrega claros. LeanZupply es la nueva forma de optimizar las relaciones comerciales entre industrias,
                con transparencia, eficiencia y tecnología.
              </p>
              <p className="text-base">
                Nuestra plataforma soporta el <strong>Incoterm FOB</strong> (Free On Board) y facilita todo el proceso de
                importación y exportación, desde la cotización inicial hasta la entrega final.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer onCTAClick={handleCTAClick} />
    </div>;
};
export default Index;
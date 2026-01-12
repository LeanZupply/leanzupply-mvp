import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ArrowRight, Search } from "lucide-react";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import {
  getCategoryBySlug,
  getCategoryIcon,
  PRODUCT_CATEGORIES,
  CATEGORY_SLUGS
} from "@/lib/categories";

interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  price_unit: number;
  lead_time_production_days: number | null;
  moq?: number | null;
  images: any;
  category: string;
  manufacturer: {
    registered_brand: string;
    country?: string | null;
    brand_logo_url?: string | null;
  } | null;
}

// SEO descriptions for each category
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Cocina y Restauración": "Equipamiento profesional para cocinas industriales y restaurantes. Encuentra hornos, freidoras, planchas y más de fabricantes certificados.",
  "Panaderías y Pastelerías": "Maquinaria especializada para panaderías y pastelerías. Amasadoras, hornos de convección, fermentadoras y equipos de pastelería profesional.",
  "Carnicerías y Chacinados": "Equipos industriales para procesamiento de carnes. Cortadoras, picadoras, embutidoras y sistemas de refrigeración para carnicerías.",
  "Heladerías y Pastelería Fría": "Máquinas para heladerías y pastelería fría. Mantecadoras, vitrinas refrigeradas, congeladores y equipos de producción de helados.",
  "Refrigeración Comercial e Industrial": "Sistemas de refrigeración comercial e industrial. Cámaras frigoríficas, vitrinas, congeladores y equipos de frío para hostelería.",
  "Packaging y Envasado": "Maquinaria de envasado y packaging industrial. Envasadoras al vacío, etiquetadoras, termoselladoras y líneas de empaque.",
  "Mobiliario y Equipamiento para Hoteles": "Mobiliario y equipamiento hotelero profesional. Camas, armarios, textiles y equipamiento para habitaciones de hotel.",
  "Equipamiento Audiovisual y para Eventos": "Equipos audiovisuales para eventos y conferencias. Pantallas LED, sistemas de sonido, iluminación y equipos de proyección.",
  "Movilidad y Logística Interna (Intralogística)": "Equipos de intralogística y movilidad industrial. Transpaletas, carretillas elevadoras, estanterías y sistemas de almacenaje.",
  "Ferretería y Construcción": "Herramientas y maquinaria para construcción. Equipos de soldadura, compresores, herramientas eléctricas y materiales de construcción.",
  "Vending & Automatización Comercial": "Máquinas expendedoras y sistemas de automatización comercial. Vending de bebidas, snacks, café y soluciones de pago automatizado.",
  "Centros de Entrenamiento y Gimnasios Profesionales": "Equipamiento para gimnasios profesionales. Máquinas de musculación, cardio, equipos funcionales y accesorios de fitness.",
};

const CategoryPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Get category name from slug
  const categoryName = slug ? getCategoryBySlug(slug) : undefined;
  const CategoryIcon = categoryName ? getCategoryIcon(categoryName) : Package;

  useEffect(() => {
    if (categoryName) {
      fetchCategoryProducts();
    } else if (slug) {
      // Invalid slug - redirect to home
      navigate("/", { replace: true });
    }
  }, [categoryName, slug, navigate]);

  const fetchCategoryProducts = async () => {
    if (!categoryName) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          description,
          price_unit,
          lead_time_production_days,
          moq,
          images,
          category,
          manufacturer_id
        `)
        .eq("status", "active")
        .eq("category", categoryName)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const productsData = data || [];

      // Load manufacturer info from profiles
      const manufacturerIds = Array.from(
        new Set(productsData.map((p: any) => p.manufacturer_id).filter(Boolean))
      );

      let profilesMap: Record<string, { company_name: string; country: string }> = {};

      if (manufacturerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, company_name, country")
          .in("id", manufacturerIds as string[]);

        profilesMap = Object.fromEntries(
          (profilesData || []).map((pr: any) => [
            pr.id,
            { company_name: pr.company_name, country: pr.country }
          ])
        );
      }

      // Attach manufacturer info
      const normalized = productsData.map((p: any) => ({
        ...p,
        manufacturer: p.manufacturer_id
          ? {
              registered_brand: profilesMap[p.manufacturer_id]?.company_name || undefined,
              company_name: profilesMap[p.manufacturer_id]?.company_name,
              country: profilesMap[p.manufacturer_id]?.country,
              brand_logo_url: undefined
            }
          : null
      }));

      setProducts(normalized);
    } catch (error) {
      const message = handleError("Category products fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductView = (product: Product) => {
    // Use slug if available, otherwise fall back to id
    const productPath = product.slug
      ? `/producto/${product.slug}`
      : `/products/${product.id}`;
    navigate(productPath);
  };

  const handleCTAClick = (type: "join" | "explore") => {
    if (type === "join") {
      navigate("/auth/signup?role=manufacturer");
    } else {
      navigate("/auth/signup?role=buyer");
    }
  };

  // If no valid category, don't render (will redirect)
  if (!categoryName) {
    return null;
  }

  const seoDescription = CATEGORY_DESCRIPTIONS[categoryName] ||
    `Encuentra ${categoryName} de fabricantes certificados en LeanZupply. Equipamiento profesional con precios FOB directos de fábrica.`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={`${categoryName} - Equipamiento Profesional`}
        description={seoDescription}
        canonical={`https://leanzupply.com/categoria/${slug}`}
        type="website"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LeanZupply</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Plataforma D2B</p>
            </div>
          </Link>
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

      {/* Breadcrumb */}
      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/" },
          { label: categoryName || "" }
        ]}
      />

      {/* Category Header */}
      <section className="px-4 py-12 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <CategoryIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{categoryName}</h1>
              <p className="text-muted-foreground mt-1">
                {products.length} producto{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {seoDescription}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-4 py-12 flex-1">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-96 w-full rounded-2xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductView(product)}
                  showCategory={false}
                />
              ))}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="py-16 text-center">
                <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  No hay productos disponibles en esta categoría
                </p>
                <Button variant="link" onClick={() => navigate("/")} className="mt-2">
                  Volver al catálogo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Other Categories */}
      <section className="border-t border-border px-4 py-12 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Otras categorías</h2>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.filter((cat) => cat !== categoryName).map((cat) => {
              const catSlug = CATEGORY_SLUGS[cat];
              const CatIcon = getCategoryIcon(cat);
              return (
                <Link
                  key={cat}
                  to={`/categoria/${catSlug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                >
                  <CatIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{cat}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer onCTAClick={handleCTAClick} />
    </div>
  );
};

export default CategoryPage;

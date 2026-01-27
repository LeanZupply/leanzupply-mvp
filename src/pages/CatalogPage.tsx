import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Package, Search } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { CategoryFilter } from "@/components/buyer/CategoryFilter";
import { ProductCard } from "@/components/ProductCard";
import { useProductsQuery } from "@/hooks/useProductsQuery";

type Product = ComponentProps<typeof ProductCard>["product"] & {
  slug?: string | null;
  category: string;
  description?: string | null;
  manufacturer?: {
    registered_brand?: string;
    company_name?: string;
  } | null;
};

export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: products = [], isLoading } = useProductsQuery({ status: "active" });

  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateQueryParam = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    let filtered = products as Product[];
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((product) => {
        const manufacturerName = product.manufacturer?.registered_brand || product.manufacturer?.company_name || "";
        return (
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          manufacturerName.toLowerCase().includes(query)
        );
      });
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }
    return filtered;
  }, [products, searchQuery, categoryFilter]);

  const uniqueCategories = useMemo(
    () =>
      Array.from(new Set((products as Product[]).map((product) => product.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    [products]
  );

  const handleProductClick = (product: Product) => {
    const slugOrId = product.slug || product.id;
    navigate(`/producto/${slugOrId}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateQueryParam(value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    updateQueryParam("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Catálogo de productos"
        description="Explora productos de fabricantes certificados en LeanZupply con precios transparentes y fichas completas."
        canonical="https://leanzupply.com/catalogo"
        type="website"
      />

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

      <BreadcrumbNav
        items={[
          { label: "Inicio", href: "/" },
          { label: "Catálogo" },
        ]}
      />

      <section className="px-4 py-10 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Catálogo de Productos</h2>
              <p className="text-muted-foreground mt-1">
                Encuentra equipos industriales por categoría, marca o descripción.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 flex-1">
        <div className="container mx-auto space-y-6">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos, categorías o fabricantes..."
                  value={searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <CategoryFilter
            categories={uniqueCategories}
            selectedCategory={categoryFilter}
            onCategoryChange={setCategoryFilter}
          />

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <>
              {filteredProducts.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "producto encontrado" : "productos encontrados"}
                  </p>
                  {(searchQuery || categoryFilter !== "all") && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              )}

              {filteredProducts.length > 0 ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => handleProductClick(product)}
                      showCategory={categoryFilter === "all"}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-border">
                  <CardContent className="py-16 text-center">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">
                      {searchQuery || categoryFilter !== "all"
                        ? "No se encontraron productos con estos filtros"
                        : "No hay productos disponibles"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

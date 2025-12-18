import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { downloadFile, normalizeProductDocPath } from "@/lib/storage";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  Clock,
  Truck,
  Shield,
  Eye,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  Download,
  File,
  Globe,
  Plus,
  Minus,
} from "lucide-react";
import { handleError } from "@/lib/errorHandler";
import { ProductCard } from "@/components/ProductCard";
import { CostBreakdown } from "@/components/CostBreakdown";
import { calculateOrderTotal } from "@/lib/priceCalculations";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price_unit: number;
  moq: number;
  stock: number;
  sku: string | null;
  status: string;
  images: any;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  weight_net_kg: number | null;
  weight_gross_kg: number | null;
  packaging_type: string | null;
  lead_time_production_days: number | null;
  lead_time_logistics_days: number | null;
  warranty_terms: string | null;
  certifications: any;
  technical_docs: any;
  manufacturer_id: string;
  volume_m3: number | null;
  freight_cost_per_m3: number | null;
  origin_expenses: number | null;
  marine_insurance_percentage: number | null;
  destination_expenses: number | null;
  local_delivery_cost: number | null;
  tariff_percentage: number | null;
  vat_percentage: number | null;
  shipping_cost_total: number | null;
  cif_value: number | null;
  marine_insurance_cost: number | null;
  taxable_base: number | null;
  tariff_cost: number | null;
  vat_cost: number | null;
  total_cost_with_taxes: number | null;
  discount_3u?: number | null;
  discount_5u?: number | null;
  discount_8u?: number | null;
  discount_10u?: number | null;
  delivery_port?: string | null;
}

interface Manufacturer {
  registered_brand: string;
  country?: string;
  brand_logo_url?: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [manufacturer, setManufacturer] = useState<Manufacturer | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [costQuantity, setCostQuantity] = useState(1);
  const [deliveryTimeline, setDeliveryTimeline] = useState<any>(null);

  const [sessionId] = useState(() => {
    let sid = sessionStorage.getItem('session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('session_id', sid);
    }
    return sid;
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
      trackProductView();
    }
  }, [id]);

  // Inicializar costQuantity con el MOQ del producto
  useEffect(() => {
    if (product?.moq && costQuantity < product.moq) {
      setCostQuantity(product.moq);
    }
  }, [product?.moq]);

  const trackProductView = async () => {
    if (!id) return;

    try {
      // Incrementa views y registra 'viewed' internamente
      await supabase.rpc("track_product_view", { p_product_id: id });
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const trackOrderClick = async () => {
    if (!id) return;
    
    try {
      await supabase.rpc('track_order_step', {
        p_user_id: user?.id || null,
        p_product_id: id,
        p_order_id: null,
        p_step: 'requested',
        p_session_id: sessionId
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  };

  const handleDownload = async (fileUrl: string, fileName?: string) => {
    if (!fileUrl) return;
    const filePath = normalizeProductDocPath(fileUrl);
    if (!filePath) {
      toast.error("Ruta de archivo inválida");
      return;
    }
    const success = await downloadFile(filePath, fileName || "documento.pdf");
    if (!success) {
      toast.error("No se pudo descargar el documento");
    } else {
      toast.success("Descarga iniciada");
    }
  };

  const handleMakeOrder = () => {
    trackOrderClick();
    
    if (!user) {
      // Redirect to signup with return path
      navigate(`/auth/signup?redirect_to=/checkout/${id}`);
    } else {
      // Go directly to checkout
      navigate(`/checkout/${id}`);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      // Fetch product primero, sin joins (no hay FK explícitas)
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();

      if (productError) throw productError;
      
      if (!productData) {
        setProduct(null);
        setLoading(false);
        return;
      }
      
      setProduct(productData);
      
      // Cargar info de fabricante desde profiles y manufacturers (vía user_id)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_name,country")
        .eq("id", productData.manufacturer_id)
        .maybeSingle();
      
      const { data: detailsData } = await supabase
        .from("manufacturers")
        .select("registered_brand,brand_logo_url")
        .eq("user_id", productData.manufacturer_id)
        .maybeSingle();
      
      const combinedManufacturer: Manufacturer = {
        registered_brand: detailsData?.registered_brand || profileData?.company_name || "",
        country: profileData?.country,
        brand_logo_url: detailsData?.brand_logo_url,
      };
      
      setManufacturer(combinedManufacturer);

      // Fetch related products (sin joins)
      const { data: relatedData } = await supabase
        .from("products")
        .select("*")
        .eq("category", productData.category)
        .eq("status", "active")
        .neq("id", id)
        .limit(4);

      setRelatedProducts(relatedData || []);
    } catch (error: any) {
      const message = handleError("Product fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };


  const parseImages = (images: any): { url: string; alt: string }[] => {
    if (typeof images === "string") {
      try {
        return JSON.parse(images);
      } catch {
        return [];
      }
    }
    return images || [];
  };

  const handleNextImage = () => {
    const images = parseImages(product?.images);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    const images = parseImages(product?.images);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error("Debes registrarte para hacer un pedido");
      navigate("/auth/signup?role=buyer");
      return;
    }

    if (orderQuantity < product.moq) {
      toast.error(`La cantidad mínima es ${product.moq} unidades`);
      return;
    }

    try {
      const totalPrice = calculateOrderTotal(product.price_unit, orderQuantity, {
        discount_3u: product.discount_3u,
        discount_5u: product.discount_5u,
        discount_8u: product.discount_8u,
        discount_10u: product.discount_10u,
      });

      const { error } = await supabase.from("orders").insert({
        buyer_id: user.id,
        manufacturer_id: product.manufacturer_id,
        product_id: product.id,
        quantity: orderQuantity,
        total_price: totalPrice,
        status: "pending",
        payment_status: "pending",
        incoterm: "FOB",
        tracking_stage: "created",
      });

      if (error) throw error;

      toast.success(
        "¡Pedido enviado exitosamente! El fabricante revisará tu solicitud y te contactará pronto.",
        { duration: 6000 }
      );
      setOrderOpen(false);
      
      // Navegar a pedidos si está autenticado como comprador
      if (user) {
        navigate("/buyer/orders");
      }
    } catch (error) {
      const message = handleError("Order creation", error);
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Producto no encontrado</h2>
          <Button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/buyer/catalog'); }}>Volver</Button>
        </div>
      </div>
    );
  }

  const images = parseImages(product.images);
  const currentImage = images[currentImageIndex] || { url: "/placeholder.svg", alt: product.name };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate("/")} className="hover:text-foreground">Inicio</button>
            <span>/</span>
            <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/buyer/catalog'); }} className="hover:text-foreground">{product.category}</button>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Botón Volver */}
        <Button
          variant="ghost"
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/buyer/catalog'); }}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Hero Section - Imagen y Detalles Principales */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Left Column: Gallery + Tabs */}
          <div className="space-y-6">
            {/* Galería de Imágenes - Fixed at top */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-lg">
                {currentImage.url.includes('.mp4') || currentImage.url.includes('.webm') ? (
                  <video
                    src={currentImage.url}
                    className="w-full h-full object-contain animate-fade-in"
                    controls
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={currentImage.url}
                    alt={currentImage.alt}
                    className="w-full h-full object-contain animate-fade-in"
                  />
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentImageIndex ? "w-8 bg-primary" : "w-2 bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Miniaturas */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex ? "border-primary shadow-md" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {img.url.includes('.mp4') || img.url.includes('.webm') ? (
                        <video src={img.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs: Description & Documents - Below gallery */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Descripción</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>

              {/* Description Tab */}
              <TabsContent value="description" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Descripción Detallada</h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {product.description || "Sin descripción disponible"}
                      </p>
                    </div>
                    
                    {/* Additional specs */}
                    {(product.warranty_terms || product.packaging_type) && (
                      <div className="mt-6 pt-6 border-t border-border space-y-3">
                        {product.warranty_terms && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Términos de Garantía</h4>
                            <p className="text-sm text-muted-foreground">{product.warranty_terms}</p>
                          </div>
                        )}
                        {product.packaging_type && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Tipo de Empaque</h4>
                            <p className="text-sm text-muted-foreground">{product.packaging_type}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Documentos Técnicos</h3>
                    
                    {/* Technical Docs */}
                     {product.technical_docs && Array.isArray(product.technical_docs) && product.technical_docs.length > 0 ? (
                      <div className="space-y-2">
                        {product.technical_docs.map((doc: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                {doc.name || `Documento ${idx + 1}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PDF • Click para ver
                              </p>
                            </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc.file_url, doc.name)}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Descargar
                              </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <File className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No hay documentos técnicos disponibles</p>
                      </div>
                    )}

                    {product.certifications && Array.isArray(product.certifications) && product.certifications.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <h4 className="font-semibold mb-3">Certificaciones</h4>
                        <div className="space-y-2">
                          {product.certifications.map((cert: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all group"
                            >
                              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                                <Shield className="h-5 w-5 text-green-600 dark:text-green-500" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                  {cert.name || `Certificación ${idx + 1}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PDF • Click para ver
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(cert.file_url, cert.name)}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Descargar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Información Principal */}
          <div className="space-y-6">
            {/* Fabricante Info - Top */}
            {manufacturer && (
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Fabricante</p>
                  <p className="font-semibold text-lg">{manufacturer.registered_brand}</p>
                </div>
              </div>
            )}
            
            <div>
              <Badge variant="secondary" className="mb-3">{product.category}</Badge>
              <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Precio y MOQ */}
            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-4xl font-bold text-primary">
                      €{product.price_unit.toLocaleString("es-ES")}
                    </span>
                    <span className="text-muted-foreground ml-2">EUR/unidad</span>
                  </div>
                  {product.stock > 0 && (
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      En Stock
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>MOQ: <strong>{product.moq} unidades</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">
                      {deliveryTimeline ? (
                        <>
                          Entrega total: <strong className="text-primary">
                            {deliveryTimeline.total_min_days} - {deliveryTimeline.total_max_days} días
                          </strong>
                        </>
                      ) : (
                        product.lead_time_production_days ? (
                          <>Preparación fábrica: <strong>{product.lead_time_production_days} días</strong></>
                        ) : (
                          <>Calculando tiempo...</>
                        )
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Desglose del timeline cuando está disponible */}
                {deliveryTimeline && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Tiempo de entrega completo a España:
                    </p>
                    {deliveryTimeline.route_info && (
                      <div className="mb-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded text-xs">
                        <span className="text-blue-700 dark:text-blue-300">
                          Ruta: <strong>{deliveryTimeline.route_info}</strong>
                        </span>
                      </div>
                    )}
                    <div className="space-y-1.5 text-xs text-blue-800 dark:text-blue-200">
                      {deliveryTimeline.production_days > 0 ? (
                        <div className="flex justify-between">
                          <span>• Producción en fábrica</span>
                          <strong>{deliveryTimeline.production_days} días</strong>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            • Producto en stock <CheckCircle className="h-3 w-3 text-green-600" />
                          </span>
                          <strong>0 días</strong>
                        </div>
                      )}
                      {deliveryTimeline.logistics_to_port_days > 0 && (
                        <div className="flex justify-between">
                          <span>• Logística hasta puerto</span>
                          <strong>{deliveryTimeline.logistics_to_port_days} días</strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>• Tránsito marítimo</span>
                        <strong>{deliveryTimeline.maritime_transit_min_days} - {deliveryTimeline.maritime_transit_max_days} días</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>• Aduana + entrega local</span>
                        <strong>{deliveryTimeline.customs_clearance_min_days} - {deliveryTimeline.customs_clearance_max_days} días</strong>
                      </div>
                      <div className="flex justify-between pt-1.5 mt-1.5 border-t border-blue-300 dark:border-blue-700 font-bold text-sm">
                        <span>TOTAL ESTIMADO</span>
                        <span className="text-primary">{deliveryTimeline.total_min_days} - {deliveryTimeline.total_max_days} días</span>
                      </div>
                      {/* Clarifications */}
                      <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700 space-y-1">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>MOQ:</strong> Cantidad de Unidades Mínimas Requeridas para realizar un Pedido
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Producto en stock:</strong> Producto en stock en fábrica
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Alerta si NO hay timeline aún */}
                {!deliveryTimeline && product.lead_time_production_days && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">⚠</span>
                      <span>
                        Estos tiempos <strong>no incluyen</strong> transporte marítimo, aduana ni entrega local a España. Los costos y plazos completos se muestran más adelante.
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quantity Selector */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Cantidad de Unidades</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCostQuantity(Math.max(product.moq, costQuantity - 1))}
                      disabled={costQuantity <= product.moq}
                      className="h-12 w-12"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      type="number"
                      min={product.moq}
                      value={costQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || product.moq;
                        setCostQuantity(Math.max(product.moq, val));
                      }}
                      onFocus={(e) => e.target.select()}
                      className="text-center text-2xl font-bold h-12"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCostQuantity(costQuantity + 1)}
                      className="h-12 w-12"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Mínimo: {product.moq} unidades
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown - Solo renderizar cuando el producto esté cargado */}
            {!loading && product && (
              <CostBreakdown
                productId={product.id}
                quantity={costQuantity}
                destinationCountry="spain"
                originPort={product.delivery_port || undefined}
                realTime={true}
                onCalculationComplete={(calc) => {
                  if (calc?.delivery_timeline && calc?.transit_info) {
                    // Include route info in timeline for display
                    const timelineWithRoute = {
                      ...calc.delivery_timeline,
                      route_info: calc.transit_info 
                        ? `${calc.transit_info.origin_port} → ${calc.transit_info.destination_port}`
                        : null
                    };
                    setDeliveryTimeline(timelineWithRoute);
                  } else if (calc?.delivery_timeline) {
                    setDeliveryTimeline(calc.delivery_timeline);
                  }
                }}
              />
            )}

            {/* Botón Hacer Pedido */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleMakeOrder}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {user ? "Hacer Pedido" : "Hacer Pedido (Registrarse)"}
            </Button>

            {/* Badges de Seguridad */}
            <div className="flex flex-wrap gap-2">
              {product.warranty_terms && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Shield className="h-3 w-3 mr-1" />
                  Con Garantía
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Descripción Técnica */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Especificaciones Técnicas</h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              {/* SKU - Oculto temporalmente */}
              {/* {product.sku && (
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-medium">{product.sku}</span>
                </div>
              )} */}
              {product.length_cm && (
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Dimensiones (L×W×H)</span>
                  <span className="font-medium">
                    {product.length_cm} × {product.width_cm} × {product.height_cm} cm
                  </span>
                </div>
              )}
              {product.weight_net_kg && (
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Peso Neto</span>
                  <span className="font-medium">{product.weight_net_kg} kg</span>
                </div>
              )}
              {product.weight_gross_kg && (
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Peso Bruto</span>
                  <span className="font-medium">{product.weight_gross_kg} kg</span>
                </div>
              )}
              {product.packaging_type && (
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Empaque</span>
                  <span className="font-medium">{product.packaging_type}</span>
                </div>
              )}
              {product.lead_time_logistics_days && (
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Tiempo Logística</span>
                  <span className="font-medium">{product.lead_time_logistics_days} días</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productos Destacados */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Productos Destacados</h2>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {relatedProducts.map((related) => (
                  <CarouselItem key={related.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                    <ProductCard
                      product={related}
                      onClick={() => navigate(`/products/${related.id}`)}
                      showCategory={false}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4" />
              <CarouselNext className="hidden sm:flex -right-4" />
            </Carousel>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 px-4 py-12">
        <div className="container mx-auto">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Leanzupply</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plataforma D2B que conecta fabricantes certificados con empresas de todo el mundo.
              </p>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-semibold">Plataforma</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => navigate("/auth/signup")} className="hover:text-foreground transition-colors">
                    Para Fabricantes
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/auth/signup")} className="hover:text-foreground transition-colors">
                    Para Compradores
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/auth/signup")} className="hover:text-foreground transition-colors">
                    Comenzar Gratis
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-semibold">Características</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Verificación de proveedores</li>
                <li>Gestión de pedidos</li>
                <li>Logística integrada</li>
                <li>Pagos seguros</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-semibold">Soporte</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Incoterm soportado</li>
                <li>FOB (Free On Board)</li>
                <li>Comercio internacional</li>
                <li>Documentación aduanera</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © 2025 Leanzupply. Plataforma D2B para equipamiento industrial.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Operamos globalmente
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Seguro y confiable
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Pedido */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="order-quantity">Cantidad (mínimo {product.moq})</Label>
              <Input
                id="order-quantity"
                type="number"
                min={product.moq}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(parseInt(e.target.value))}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Precio unitario:</span>
                <span className="font-medium">€{product.price_unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Cantidad:</span>
                <span className="font-medium">{orderQuantity}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span>Total:</span>
                <span className="text-primary">€{calculateOrderTotal(product.price_unit, orderQuantity, {
                  discount_3u: product.discount_3u,
                  discount_5u: product.discount_5u,
                  discount_8u: product.discount_8u,
                  discount_10u: product.discount_10u,
                }).toLocaleString()}</span>
              </div>
            </div>
            <Button onClick={handleOrder} className="w-full">Confirmar Solicitud</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
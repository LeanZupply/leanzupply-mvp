import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Package, Plus, Search, Trash2, Eye, Edit, AlertCircle, FileText } from "lucide-react";
import { handleError } from "@/lib/errorHandler";
import { downloadFile, normalizeProductDocPath } from "@/lib/storage";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  subcategory: string | null;
  description: string | null;
  price_unit: number;
  moq: number;
  stock: number;
  status: string;
  images: any;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  volume_m3: number | null;
  weight_net_kg: number | null;
  weight_gross_kg: number | null;
  packaging_type: string | null;
  lead_time_production_days: number | null;
  lead_time_logistics_days: number | null;
  warranty_terms: string | null;
  certifications: any;
  technical_docs: any;
  created_at: string;
}

const ManufacturerProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [hasCompleteProfile, setHasCompleteProfile] = useState<boolean>(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (user) {
      checkManufacturerProfile();
      fetchProducts();
    }
  }, [user]);

  const checkManufacturerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("manufacturers")
        .select("id, legal_name, tax_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      
      // Verificar que exista el perfil y tenga datos críticos
      setHasCompleteProfile(!!data && !!data.legal_name && !!data.tax_id);
    } catch (error) {
      console.error("Error checking profile:", error);
      setHasCompleteProfile(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("manufacturer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      const message = handleError("Products fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    setFilteredProducts(filtered);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Producto eliminado");
      fetchProducts();
    } catch (error: any) {
      toast.error("Error al eliminar producto");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      active: "default",
      rejected: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      active: "Activo",
      rejected: "Rechazado",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const viewDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
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

  const parseDocs = (docs: any): any[] => {
    if (typeof docs === "string") {
      try {
        return JSON.parse(docs);
      } catch {
        return [];
      }
    }
    return docs || [];
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

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Productos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestiona tu catálogo</p>
        </div>
        <Button 
          onClick={() => {
            if (!hasCompleteProfile) {
              toast.error("Debes completar tu perfil antes de cargar productos");
              navigate("/manufacturer/profile");
              return;
            }
            navigate("/manufacturer/products/create");
          }}
          disabled={checkingProfile}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Cargar Producto</span>
          <span className="sm:hidden">Nuevo Producto</span>
        </Button>
      </div>

      {/* Alerta de perfil incompleto */}
      {!checkingProfile && !hasCompleteProfile && (
        <Alert className="mb-6 border-amber-500/20 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            <strong>⚠️ No puedes cargar productos aún.</strong> Primero debes completar tu{" "}
            <button
              onClick={() => navigate("/manufacturer/profile")}
              className="underline font-semibold hover:text-amber-700"
            >
              perfil de fabricante
            </button>{" "}
            con toda la información y fotos requeridas.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")} className="flex-1 sm:flex-none">Todos</Button>
          <Button variant={statusFilter === "pending" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("pending")} className="flex-1 sm:flex-none">Pendiente</Button>
          <Button variant={statusFilter === "active" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("active")} className="flex-1 sm:flex-none">Activo</Button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
            {hasCompleteProfile ? (
              <Button onClick={() => navigate("/manufacturer/products/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Cargar Producto
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Completa tu perfil para empezar a cargar productos
                </p>
                <Button onClick={() => navigate("/manufacturer/profile")} variant="outline">
                  Ir a Mi Perfil
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] sm:w-[80px]">Imagen</TableHead>
                  <TableHead className="min-w-[150px]">Nombre</TableHead>
                  {/* SKU - Oculto temporalmente */}
                  {/* <TableHead className="hidden sm:table-cell">SKU</TableHead> */}
                  <TableHead className="hidden md:table-cell min-w-[120px]">Categoría</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right min-w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const images = parseImages(product.images);
                const firstImage = images[0]?.url;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {firstImage ? <img src={firstImage} alt={product.name} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded" /> : <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded flex items-center justify-center"><Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" /></div>}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{product.name}</TableCell>
                    {/* SKU - Oculto temporalmente */}
                    {/* <TableCell className="hidden sm:table-cell text-sm">{product.sku || "—"}</TableCell> */}
                    <TableCell className="hidden md:table-cell text-sm">{product.category}</TableCell>
                    <TableCell className="text-right text-sm">{product.moq}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">€{product.price_unit.toFixed(2)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-sm">{product.stock}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => viewDetails(product)}
                          title="Vista previa"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/manufacturer/products/edit/${product.id}`)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="medidas">Medidas</TabsTrigger>
                <TabsTrigger value="docs">Documentos</TabsTrigger>
                <TabsTrigger value="certs">Certificaciones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-6 mt-4">
                {/* Imágenes */}
                {parseImages(selectedProduct.images).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Imágenes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {parseImages(selectedProduct.images).map((img, i) => (
                        <img key={i} src={img.url} alt={img.alt} className="w-full h-40 object-cover rounded-lg border" />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Info básica */}
                <div className="grid grid-cols-2 gap-4">
                  {/* SKU - Oculto temporalmente */}
                  {/* <div>
                    <p className="text-sm font-medium text-muted-foreground">SKU</p>
                    <p className="text-base">{selectedProduct.sku || "—"}</p>
                  </div> */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                    <p className="text-base">{selectedProduct.category}</p>
                  </div>
                  {selectedProduct.subcategory && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subcategoría</p>
                      <p className="text-base">{selectedProduct.subcategory}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Precio Unitario</p>
                    <p className="text-base font-semibold">€{selectedProduct.price_unit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">MOQ</p>
                    <p className="text-base">{selectedProduct.moq} unidades</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stock Disponible</p>
                    <p className="text-base">{selectedProduct.stock} unidades</p>
                  </div>
                  {selectedProduct.packaging_type && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo de Empaque</p>
                      <p className="text-base">{selectedProduct.packaging_type}</p>
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {selectedProduct.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descripción</h3>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Lead times */}
                {(selectedProduct.lead_time_production_days || selectedProduct.lead_time_logistics_days) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.lead_time_production_days && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tiempo de Producción</p>
                        <p className="text-base">{selectedProduct.lead_time_production_days} días</p>
                      </div>
                    )}
                    {selectedProduct.lead_time_logistics_days && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tiempo de Logística</p>
                        <p className="text-base">{selectedProduct.lead_time_logistics_days} días</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Garantía */}
                {selectedProduct.warranty_terms && (
                  <div>
                    <h3 className="font-semibold mb-2">Términos de Garantía</h3>
                    <p className="text-muted-foreground">{selectedProduct.warranty_terms}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="medidas" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedProduct.length_cm && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Largo</p>
                      <p className="text-base">{selectedProduct.length_cm} cm</p>
                    </div>
                  )}
                  {selectedProduct.width_cm && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ancho</p>
                      <p className="text-base">{selectedProduct.width_cm} cm</p>
                    </div>
                  )}
                  {selectedProduct.height_cm && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Alto</p>
                      <p className="text-base">{selectedProduct.height_cm} cm</p>
                    </div>
                  )}
                  {selectedProduct.volume_m3 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Volumen</p>
                      <p className="text-base">{selectedProduct.volume_m3} m³</p>
                    </div>
                  )}
                  {selectedProduct.weight_net_kg && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Peso Neto</p>
                      <p className="text-base">{selectedProduct.weight_net_kg} kg</p>
                    </div>
                  )}
                  {selectedProduct.weight_gross_kg && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Peso Bruto</p>
                      <p className="text-base">{selectedProduct.weight_gross_kg} kg</p>
                    </div>
                  )}
                </div>
                {!selectedProduct.length_cm && !selectedProduct.width_cm && !selectedProduct.height_cm && 
                 !selectedProduct.volume_m3 && !selectedProduct.weight_net_kg && !selectedProduct.weight_gross_kg && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay medidas registradas</p>
                )}
              </TabsContent>
              
              <TabsContent value="docs" className="space-y-4 mt-4">
                {parseDocs(selectedProduct.technical_docs).length > 0 ? (
                  <div className="space-y-2">
                    {parseDocs(selectedProduct.technical_docs).map((doc, i) => (
                      <Card key={i} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{doc.name || doc.filename || 'Documento'}</p>
                            <p className="text-sm text-muted-foreground">Documento técnico</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(doc.file_url || doc.url || doc.path, doc.name || doc.filename)}>
                            Descargar documento
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay documentos técnicos</p>
                )}
              </TabsContent>
              
              <TabsContent value="certs" className="space-y-4 mt-4">
                {parseDocs(selectedProduct.certifications).length > 0 ? (
                  <div className="space-y-2">
                    {parseDocs(selectedProduct.certifications).map((cert, i) => (
                      <Card key={i} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{cert.name || cert.filename || 'Certificado'}</p>
                            <p className="text-sm text-muted-foreground">Certificación</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(cert.file_url || cert.url || cert.path, cert.name || cert.filename)}>
                            Descargar certificado
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay certificaciones</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManufacturerProducts;

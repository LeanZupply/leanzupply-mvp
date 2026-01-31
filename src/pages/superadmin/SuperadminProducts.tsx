import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Pause, Trash2, Play } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { handleError } from "@/lib/errorHandler";
import { logActivity } from "@/lib/activityLogger";
import { formatNumber } from "@/lib/formatters";

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  price_unit: number;
  moq: number;
  stock: number;
  packaging: string;
  hs_code: string;
  status: string;
  // Optional media fields
  images?: any;
  preview_url?: string | null;
  admin_notes?: string | null;
  manufacturer_id?: string | null;
  manufacturer?: {
    company_name: string;
    email: string;
  } | null;
}

const SuperadminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [statusFilter, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const productsData = data || [];
      const manufacturerIds = Array.from(
        new Set(
          productsData
            .map((p: any) => p.manufacturer_id)
            .filter((id: string | null | undefined): id is string => Boolean(id))
        )
      );

      let profileMap: Record<string, { company_name: string; email: string }> = {};
      if (manufacturerIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id, company_name, email")
          .in("id", manufacturerIds);
        if (profErr) throw profErr;
        profileMap = Object.fromEntries(
          (profiles || []).map((p: any) => [p.id, { company_name: p.company_name, email: p.email }])
        );
      }

      const normalized = productsData.map((p: any) => ({
        ...p,
        manufacturer: p.manufacturer_id ? profileMap[p.manufacturer_id] || null : null,
      }));
      
      setProducts(normalized);
      setFilteredProducts(normalized);
    } catch (error) {
      const message = handleError("Products fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (statusFilter === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.status === statusFilter));
    }
  };

  const updateProductStatus = async (productId: string, newStatus: string, notes?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (notes) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus, admin_notes: notes } : p))
      );

      // Log activity
      await logActivity({
        action: newStatus === "active" ? "Approved product" : "Rejected product",
        entity: "product",
        entity_id: productId,
        metadata: { status: newStatus, notes },
      });

      toast.success(`Producto ${newStatus === "active" ? "aprobado" : "rechazado"}`);
      setRejectDialogOpen(false);
      setAdminNotes("");
    } catch (error) {
      const message = handleError("Product update", error);
      toast.error(message);
    }
  };

  const handleReject = (product: Product) => {
    setSelectedProduct(product);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedProduct) {
      updateProductStatus(selectedProduct.id, "rejected", adminNotes);
    }
  };

  const handlePauseToggle = (product: Product) => {
    setSelectedProduct(product);
    setPauseDialogOpen(true);
  };

  const confirmPauseToggle = async () => {
    if (!selectedProduct) return;
    
    const newStatus = selectedProduct.status === "paused" ? "active" : "paused";
    try {
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, status: newStatus } : p))
      );

      await logActivity({
        action: newStatus === "paused" ? "Paused product" : "Resumed product",
        entity: "product",
        entity_id: selectedProduct.id,
        metadata: { status: newStatus },
      });

      toast.success(`Producto ${newStatus === "paused" ? "pausado" : "reactivado"}`);
      setPauseDialogOpen(false);
    } catch (error) {
      const message = handleError("Product status update", error);
      toast.error(message);
    }
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));

      await logActivity({
        action: "Deleted product",
        entity: "product",
        entity_id: selectedProduct.id,
        metadata: { name: selectedProduct.name },
      });

      toast.success("Producto eliminado correctamente");
      setDeleteDialogOpen(false);
    } catch (error) {
      const message = handleError("Product deletion", error);
      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/15 text-success border-success/20">✅ Activo</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/25">🟡 Pendiente</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/15 text-destructive border-destructive/20">❌ Rechazado</Badge>;
      case "paused":
        return <Badge className="bg-muted text-muted-foreground border-muted">⏸️ Pausado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProductImageUrl = (product: Product | null): string => {
    if (!product) return "/placeholder.svg";
    if (product.preview_url) return product.preview_url;
    const anyProduct = product as any;
    const images = anyProduct?.images;
    if (!images) return "/placeholder.svg";
    try {
      const arr = typeof images === "string" ? JSON.parse(images) : images;
      return arr?.[0]?.url || "/placeholder.svg";
    } catch {
      return "/placeholder.svg";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Validación de Productos</h1>
        <p className="text-muted-foreground mt-1">Revisa y aprueba productos de fabricantes</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Todos los Productos</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Producto</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[120px]">Fabricante</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="hidden lg:table-cell">Precio/Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="min-w-[140px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-sm">{product.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{product.manufacturer?.company_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{product.category}</TableCell>
                    <TableCell className="hidden lg:table-cell font-semibold text-sm">€{formatNumber(product.price_unit)}</TableCell>
                    <TableCell>
                      {getStatusBadge(product.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDialogOpen(true);
                          }}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {product.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateProductStatus(product.id, "active")}
                              title="Aprobar producto"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(product)}
                              title="Rechazar producto"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {(product.status === "active" || product.status === "paused") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => handlePauseToggle(product)}
                            title={product.status === "paused" ? "Reactivar producto" : "Pausar producto"}
                          >
                            {product.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(product)}
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No se encontraron productos</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription>Información completa del producto</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre del Producto</p>
                  <p className="font-medium">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fabricante</p>
                  <p className="font-medium">{selectedProduct.manufacturer?.company_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subcategoría</p>
                    <p className="font-medium">{selectedProduct.subcategory || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descripción</p>
                  <p className="font-medium">{selectedProduct.description || "—"}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Precio/Unidad</p>
                    <p className="font-medium">€{formatNumber(selectedProduct.price_unit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">MOQ</p>
                    <p className="font-medium">{selectedProduct.moq}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock</p>
                    <p className="font-medium">{selectedProduct.stock}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empaque</p>
                  <p className="font-medium">{selectedProduct.packaging || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código HS</p>
                  <p className="font-medium">{selectedProduct.hs_code || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedProduct.status)}
                </div>
              </div>
              <div className="md:col-span-1">
                <div className="aspect-square rounded-lg bg-muted border flex items-center justify-center overflow-hidden">
                  <img
                    alt={selectedProduct.name}
                    src={getProductImageUrl(selectedProduct)}
                    className="object-contain w-full h-full"
                    onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Previsualización</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog with Admin Notes */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Producto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Producto</p>
                <p className="font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <Label htmlFor="admin-notes">Notas para el fabricante (opcional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ej: El producto no cumple con los requisitos técnicos. Por favor revisar las especificaciones..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause/Resume Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProduct?.status === "paused" ? "Reactivar Producto" : "Pausar Producto"}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.status === "paused"
                ? "El producto volverá a estar visible en el catálogo público."
                : "El producto dejará de ser visible en el catálogo público temporalmente."}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Producto</p>
                <p className="font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fabricante</p>
                <p className="font-medium">{selectedProduct.manufacturer?.company_name}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmPauseToggle}>
              {selectedProduct?.status === "paused" ? "Reactivar" : "Pausar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm font-medium text-destructive">⚠️ Advertencia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Estás a punto de eliminar permanentemente el producto "{selectedProduct.name}".
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fabricante</p>
                <p className="font-medium">{selectedProduct.manufacturer?.company_name}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminProducts;

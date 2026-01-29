import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Eye, 
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  FileText,
  MapPin,
  History
} from "lucide-react";
import { OrderTimeline } from "@/components/buyer/OrderTimeline";
import { OrderTrackingTimeline } from "@/components/buyer/OrderTrackingTimeline";
import { trackEvent } from "@/lib/analytics";
import { handleError } from "@/lib/errorHandler";
import { formatNumber } from "@/lib/formatters";

const TIMELINE_STEPS = [
  { key: "created", label: "Pedido Creado" },
  { key: "pending", label: "Documentación Firmada" },
  { key: "confirmed", label: "Pago Confirmado" },
  { key: "in_production", label: "En Producción" },
  { key: "in_shipping", label: "En Tránsito" },
  { key: "customs", label: "En Aduana" },
  { key: "last_mile", label: "Última Milla" },
  { key: "delivered", label: "Entregado" },
];

interface Order {
  id: string;
  order_reference: string | null;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string;
  incoterm: string | null;
  tracking_stage: string | null;
  tracking_info: any;
  buyer_notes: string | null;
  manufacturer_notes: string | null;
  rejected_reason: string | null;
  response_date: string | null;
  created_at: string;
  updated_at: string;
  product: {
    name: string;
    category: string;
  } | null;
  manufacturer: {
    company_name: string;
    country: string;
  } | null;
}

const BuyerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          product:products(name, category),
          manufacturer:profiles!orders_manufacturer_id_fkey(company_name, country)
        `)
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      handleError("Orders fetch", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((o) => o.status === statusFilter));
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
    trackEvent("timeline_viewed", { order_id: order.id });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any; label: string }> = {
      pending_confirmation: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock, label: "Pendiente de confirmación" },
      confirmed: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2, label: "Confirmado" },
      rejected: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: "Rechazado" },
      delivered: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2, label: "Entregado" },
      in_shipping: { color: "bg-primary/10 text-primary border-primary/20", icon: Truck, label: "En tránsito" },
      in_production: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock, label: "En producción" },
      pending: { color: "bg-muted text-muted-foreground border-border", icon: Clock, label: "Pendiente" },
      cancelled: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: "Cancelado" },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Pedidos</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Gestiona y realiza seguimiento de tus pedidos</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Lista de Pedidos</span>
            <span className="sm:hidden">Lista</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4 sm:space-y-6">
          <Card className="border-border">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg text-foreground">Todos los Pedidos</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    <SelectItem value="pending_confirmation">Pendiente de confirmación</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                    <SelectItem value="in_production">En Producción</SelectItem>
                    <SelectItem value="in_shipping">En Tránsito</SelectItem>
                    <SelectItem value="delivered">Entregado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <Card 
                        key={order.id} 
                        className="border-border hover:shadow-md transition-shadow cursor-pointer rounded-lg"
                        onClick={() => handleViewDetails(order)}
                      >
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {order.order_reference && (
                                      <p className="text-xs font-mono text-primary mb-1">
                                        {order.order_reference}
                                      </p>
                                    )}
                                    <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
                                      {order.product?.name || "Producto"}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                                      {order.manufacturer?.company_name}
                                    </p>
                                  </div>
                                <Badge className={`${statusConfig.color} shrink-0`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  <span className="text-xs">{statusConfig.label}</span>
                                </Badge>
                              </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Cantidad</p>
                                    <p className="font-semibold text-sm text-foreground">{order.quantity} unidades</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="font-semibold text-sm text-primary">
                                      €{formatNumber(Number(order.total_price))}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Incoterm</p>
                                    <p className="font-semibold text-sm text-foreground">{order.incoterm || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Fecha</p>
                                    <p className="font-semibold text-sm text-foreground">
                                      {new Date(order.created_at).toLocaleDateString("es-ES")}
                                    </p>
                                  </div>
                                </div>

                              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                                <Eye className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                Ver Detalles y Timeline
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {statusFilter === "all"
                      ? "No tienes pedidos aún"
                      : "No hay pedidos con este estado"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-4 sm:space-y-6">
          {filteredOrders.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card 
                    key={order.id} 
                    className="border-border hover:shadow-lg transition-shadow cursor-pointer rounded-lg"
                    onClick={() => handleViewDetails(order)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {order.order_reference && (
                            <p className="text-xs font-mono text-primary mb-1">
                              {order.order_reference}
                            </p>
                          )}
                          <CardTitle className="text-lg text-foreground">{order.product?.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.manufacturer?.company_name}
                          </p>
                        </div>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-border">
                        <div>
                          <p className="text-muted-foreground">Cantidad</p>
                          <p className="font-semibold text-foreground">{order.quantity} unidades</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold text-primary">
                            €{formatNumber(Number(order.total_price))}
                          </p>
                        </div>
                      </div>

                      <div className="bg-surface rounded-lg p-4 border border-border">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Progreso del Pedido</p>
                        <OrderTimeline 
                          currentStatus={order.tracking_stage || order.status} 
                          steps={TIMELINE_STEPS} 
                        />
                      </div>

                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles Completos
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="py-16 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No hay pedidos para mostrar</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles del Pedido
              {selectedOrder?.order_reference && (
                <span className="ml-2 text-primary font-mono">
                  {selectedOrder.order_reference}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="bg-surface border-border">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {selectedOrder.order_reference && (
                        <div>
                          <Label className="text-muted-foreground">Referencia</Label>
                          <p className="font-mono font-bold text-lg text-primary">{selectedOrder.order_reference}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-muted-foreground">Producto</Label>
                        <p className="font-semibold text-lg text-foreground">{selectedOrder.product?.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Categoría</Label>
                        <p className="font-medium text-foreground">{selectedOrder.product?.category}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Fabricante
                        </Label>
                        <p className="font-medium text-foreground">{selectedOrder.manufacturer?.company_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.manufacturer?.country}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Cantidad</Label>
                          <p className="font-semibold text-xl text-foreground">{selectedOrder.quantity}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Incoterm</Label>
                          <p className="font-semibold text-xl text-foreground">{selectedOrder.incoterm || "—"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Total</Label>
                        <p className="font-bold text-3xl text-primary">
                          €{formatNumber(Number(selectedOrder.total_price))}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Estado de Pago</Label>
                        <Badge variant={selectedOrder.payment_status === "paid" ? "default" : "secondary"}>
                          {selectedOrder.payment_status === "paid" ? "Pagado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.buyer_notes && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <Label className="text-muted-foreground">Notas del Pedido</Label>
                      <p className="text-sm mt-2 text-foreground">{selectedOrder.buyer_notes}</p>
                    </div>
                  )}

                  {/* Manufacturer Response */}
                  {(selectedOrder.manufacturer_notes || selectedOrder.rejected_reason) && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <Label className="text-muted-foreground">Respuesta del Fabricante</Label>
                      {selectedOrder.manufacturer_notes && (
                        <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <p className="text-sm font-medium text-foreground mb-1">Notas del fabricante</p>
                          <p className="text-sm text-foreground/80">{selectedOrder.manufacturer_notes}</p>
                        </div>
                      )}
                      {selectedOrder.rejected_reason && (
                        <div className="mt-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                          <p className="text-sm font-medium text-destructive mb-1">Motivo de rechazo</p>
                          <p className="text-sm text-destructive/90">{selectedOrder.rejected_reason}</p>
                        </div>
                      )}
                      {selectedOrder.response_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Respondido el {new Date(selectedOrder.response_date).toLocaleString("es-ES")}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Timeline del Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline 
                    currentStatus={selectedOrder.tracking_stage || selectedOrder.status} 
                    steps={TIMELINE_STEPS} 
                  />
                </CardContent>
              </Card>

              {/* Tracking History */}
              <OrderTrackingTimeline 
                orderId={selectedOrder.id}
                productId={selectedOrder.product_id}
                userId={user!.id}
              />

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Card className="border-border rounded-lg">
                  <CardContent className="pt-6">
                    <Label className="text-muted-foreground">Fecha de Creación</Label>
                    <p className="font-medium mt-1 text-foreground">
                      {new Date(selectedOrder.created_at).toLocaleString("es-ES")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border rounded-lg">
                  <CardContent className="pt-6">
                    <Label className="text-muted-foreground">Última Actualización</Label>
                    <p className="font-medium mt-1 text-foreground">
                      {new Date(selectedOrder.updated_at).toLocaleString("es-ES")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm font-medium ${className || ""}`}>{children}</p>
);

export default BuyerOrders;

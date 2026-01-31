import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Eye, Package, Mail, Phone, MessageSquare, Clock, MapPin, FileText,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { formatNumber } from "@/lib/formatters";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderProgressTimeline } from "@/components/orders/OrderProgressTimeline";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { OrderDocumentSection } from "@/components/orders/OrderDocumentSection";
import { TransportMessageCard } from "@/components/orders/TransportMessageCard";
import { OrderFilters, extractAvailableMonths, filterByMonth } from "@/components/orders/OrderFilters";
import { useOrderActions } from "@/hooks/useOrderActions";

interface Order {
  id: string;
  order_reference: string | null;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string;
  incoterm: string;
  transport_message: string | null;
  buyer_notes: string | null;
  created_at: string;
  calculation_snapshot: any | null;
  buyer: {
    company_name: string;
    country: string;
    full_name: string;
    email: string;
  } | null;
  product: {
    id: string;
    name: string;
    category: string;
    images: any;
  } | null;
}

interface QuoteRequest {
  id: string;
  product_id: string;
  email: string;
  mobile_phone: string;
  tax_id: string;
  postal_code: string;
  status: string;
  is_authenticated: boolean;
  created_at: string;
  quantity: number | null;
  notes: string | null;
  destination_port: string | null;
  calculation_snapshot: {
    breakdown?: {
      total?: number;
      total_volume_m3?: number;
      price_unit?: number;
    };
  } | null;
  product: {
    id: string;
    name: string;
    category: string;
    images: any;
  } | null;
}

const ManufacturerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const { updateTransportMessage } = useOrderActions();

  // Quote requests state
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [selectedQuoteRequest, setSelectedQuoteRequest] = useState<QuoteRequest | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchQuoteRequests();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(company_name, country, full_name, email),
          product:products(id, name, category, images)
        `)
        .eq("manufacturer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      const message = handleError("Orders fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("quote_requests")
        .select(`
          id, product_id, email, mobile_phone, tax_id, postal_code,
          status, is_authenticated, created_at,
          quantity, notes, destination_port, calculation_snapshot,
          product:products(id, name, category, images)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuoteRequests(data || []);
    } catch (error) {
      const message = handleError("Quote requests fetch", error);
      toast.error(message);
    }
  };

  const availableMonths = useMemo(
    () => extractAvailableMonths(orders.map((o) => o.created_at)),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    result = filterByMonth(result, monthFilter);
    return result;
  }, [orders, statusFilter, monthFilter]);

  const getQuoteStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-warning/10 text-warning border-warning/20", label: "Pendiente" },
      contacted: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Contactado" },
      completed: { color: "bg-success/10 text-success border-success/20", label: "Completado" },
      cancelled: { color: "bg-muted text-muted-foreground border-muted", label: "Cancelado" },
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
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Mis Ventas</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Gestiona ventas y solicitudes de información de clientes
        </p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ventas ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Solicitudes ({quoteRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <div className="mb-4">
            <OrderFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              monthFilter={monthFilter}
              onMonthChange={setMonthFilter}
              availableMonths={availableMonths}
            />
          </div>

          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {order.order_reference && (
                            <p className="text-xs font-mono text-primary mb-1">
                              {order.order_reference}
                            </p>
                          )}
                          <h3 className="font-semibold text-lg text-foreground">
                            {order.product?.name || "Producto"}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.buyer?.company_name || "Comprador"}
                          </p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      <OrderProgressTimeline currentStatus={order.status} />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-2">
                        <div>
                          <p className="text-muted-foreground text-xs">Cantidad</p>
                          <p className="font-semibold text-foreground">{order.quantity} uds</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Total</p>
                          <p className="font-semibold text-primary">€{formatNumber(order.total_price)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Incoterm</p>
                          <p className="font-semibold text-foreground">{order.incoterm || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Fecha</p>
                          <p className="font-semibold text-foreground">
                            {new Date(order.created_at).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDialogOpen(true);
                        }}
                        className="flex-1 md:flex-initial"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredOrders.length === 0 && (
              <Card className="border-border">
                <CardContent className="py-16 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No hay ventas aún</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <div className="grid gap-4">
            {quoteRequests.map((quote) => {
              const statusConfig = getQuoteStatusConfig(quote.status);
              return (
                <Card key={quote.id} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-foreground">
                              {quote.product?.name || "Producto"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {quote.email}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {quote.mobile_phone}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`${statusConfig.color} border shrink-0`}>
                              {statusConfig.label}
                            </Badge>
                            {quote.is_authenticated && (
                              <Badge variant="outline" className="text-xs">
                                Usuario registrado
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pt-3">
                          <div>
                            <p className="text-muted-foreground text-xs">NIF/CIF/VAT-ID</p>
                            <p className="font-semibold text-foreground">{quote.tax_id}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Código Postal</p>
                            <p className="font-semibold text-foreground">{quote.postal_code}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Fecha</p>
                            <p className="font-semibold text-foreground">
                              {new Date(quote.created_at).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedQuoteRequest(quote);
                            setQuoteDialogOpen(true);
                          }}
                          className="flex-1 md:flex-initial"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {quoteRequests.length === 0 && (
              <Card className="border-border">
                <CardContent className="py-16 text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No hay solicitudes de información aún</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={
          selectedOrder
            ? {
                id: selectedOrder.id,
                order_reference: selectedOrder.order_reference,
                status: selectedOrder.status,
                quantity: selectedOrder.quantity,
                total_price: selectedOrder.total_price,
                incoterm: selectedOrder.incoterm,
                created_at: selectedOrder.created_at,
                product_name: selectedOrder.product?.name ?? null,
                manufacturer_name: null,
                buyer_name: selectedOrder.buyer?.company_name ?? null,
              }
            : null
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* awaiting_payment: Informational */}
            {selectedOrder.status === "awaiting_payment" && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-foreground">Esperando pago del comprador</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El comprador debe realizar el pago. Serás notificado cuando el pago sea confirmado.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* payment_confirmed: Upload invoice */}
            {selectedOrder.status === "payment_confirmed" && (
              <OrderDocumentSection
                orderId={selectedOrder.id}
                documentType="invoice"
                canUpload={true}
                canDelete={false}
                maxFiles={3}
              />
            )}

            {/* in_transit: Edit transport message + upload transport docs */}
            {selectedOrder.status === "in_transit" && (
              <>
                <TransportMessageCard
                  orderId={selectedOrder.id}
                  message={selectedOrder.transport_message}
                  canEdit={true}
                  onUpdate={updateTransportMessage}
                />
                <OrderDocumentSection
                  orderId={selectedOrder.id}
                  documentType="transport_doc"
                  canUpload={true}
                  canDelete={false}
                  maxFiles={10}
                />
              </>
            )}

            {/* delivered: Read-only */}
            {selectedOrder.status === "delivered" && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    Orden entregada y cerrada
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Buyer notes */}
            {selectedOrder.buyer_notes && (
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Notas del Comprador</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {selectedOrder.buyer_notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </OrderDetailDialog>

      {/* Quote Request Details Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Solicitud de Información
            </DialogTitle>
          </DialogHeader>

          {selectedQuoteRequest && (
            <div className="space-y-4">
              <Card className="bg-surface border-border">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {selectedQuoteRequest.product?.images && Array.isArray(selectedQuoteRequest.product.images) && selectedQuoteRequest.product.images.length > 0 && (
                      <img
                        src={selectedQuoteRequest.product.images[0]}
                        alt={selectedQuoteRequest.product.name}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs">Producto</p>
                      <p className="font-semibold text-lg text-foreground">
                        {selectedQuoteRequest.product?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedQuoteRequest.product?.category}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(selectedQuoteRequest.quantity || selectedQuoteRequest.calculation_snapshot) && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-foreground mb-4">Detalles de la Solicitud</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Cantidad</p>
                        <p className="text-xl font-bold text-foreground">{selectedQuoteRequest.quantity || "—"}</p>
                        <p className="text-xs text-muted-foreground">unidades</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total EUR</p>
                        <p className="text-xl font-bold text-primary">
                          {selectedQuoteRequest.calculation_snapshot?.breakdown?.total
                            ? `€${formatNumber(selectedQuoteRequest.calculation_snapshot.breakdown.total)}`
                            : "—"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Volumen</p>
                        <p className="text-xl font-bold text-foreground">
                          {selectedQuoteRequest.calculation_snapshot?.breakdown?.total_volume_m3
                            ? `${formatNumber(selectedQuoteRequest.calculation_snapshot.breakdown.total_volume_m3)}`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">m³</p>
                      </div>
                    </div>
                    {selectedQuoteRequest.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Notas del cliente</p>
                        <p className="text-sm text-foreground">{selectedQuoteRequest.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-surface border-border">
                <CardContent className="pt-6 space-y-4">
                  <h4 className="font-semibold text-foreground">Datos de Contacto</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Email</p>
                        <p className="font-medium text-foreground">{selectedQuoteRequest.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Teléfono con WhatsApp</p>
                        <p className="font-medium text-foreground">{selectedQuoteRequest.mobile_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">NIF / CIF / VAT-ID</p>
                        <p className="font-medium text-foreground">{selectedQuoteRequest.tax_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Código Postal</p>
                        <p className="font-medium text-foreground">{selectedQuoteRequest.postal_code}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedQuoteRequest.email}?subject=Información sobre ${selectedQuoteRequest.product?.name || 'producto'}`, '_blank')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const phone = selectedQuoteRequest.mobile_phone.replace(/[^0-9+]/g, '');
                    const message = encodeURIComponent(`Hola, he recibido tu solicitud de información sobre ${selectedQuoteRequest.product?.name || 'nuestro producto'}. Estoy disponible para darte más detalles.`);
                    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                  }}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManufacturerOrders;

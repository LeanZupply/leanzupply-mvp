import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, CheckCircle, XCircle, Clock, Package, Mail, Inbox, Ship, DollarSign, Phone, FileText, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/errorHandler";
import { CostBreakdown } from "@/components/CostBreakdown";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string;
  incoterm: string;
  buyer_email: string | null;
  buyer_company: string | null;
  buyer_notes: string | null;
  manufacturer_notes: string | null;
  rejected_reason: string | null;
  agreement_notes: string | null;
  created_at: string;
  calculation_snapshot: any | null;
  delivery_estimate: string | null;
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
    hs_code: string | null;
    moq: number;
    volume_m3: number;
    weight_gross_kg: number | null;
    length_cm: number | null;
    width_cm: number | null;
    height_cm: number | null;
    lead_time_production_days: number | null;
    lead_time_logistics_days: number | null;
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
  const [manufacturerNotes, setManufacturerNotes] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");
  const [processing, setProcessing] = useState(false);

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
          product:products(
            id, name, category, hs_code, moq, volume_m3, weight_gross_kg, 
            length_cm, width_cm, height_cm, lead_time_production_days, 
            lead_time_logistics_days, images
          )
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

  const handleViewQuoteDetails = (quote: QuoteRequest) => {
    setSelectedQuoteRequest(quote);
    setQuoteDialogOpen(true);
  };

  const getQuoteStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-warning/10 text-warning border-warning/20", label: "Pendiente" },
      contacted: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Contactado" },
      completed: { color: "bg-success/10 text-success border-success/20", label: "Completado" },
      cancelled: { color: "bg-muted text-muted-foreground border-muted", label: "Cancelado" },
    };
    return configs[status] || configs.pending;
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setManufacturerNotes(order.manufacturer_notes || "");
    setRejectedReason(order.rejected_reason || "");
    setDialogOpen(true);
  };

  const handleAcknowledgeReceipt = async () => {
    if (!selectedOrder) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "pending",
          manufacturer_notes: "Solicitud recibida - En revisión",
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Has confirmado la recepción del pedido. El comprador será notificado.");
      setDialogOpen(false);
      fetchOrders();
    } catch (error) {
      const message = handleError("Receipt acknowledgment", error);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          payment_status: "pending",
          manufacturer_notes: manufacturerNotes || null,
          response_date: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Pedido confirmado correctamente. El comprador será notificado.");
      setDialogOpen(false);
      fetchOrders();
    } catch (error) {
      const message = handleError("Order confirmation", error);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    if (!rejectedReason.trim()) {
      toast.error("Por favor indica el motivo del rechazo");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "rejected",
          payment_status: "cancelled",
          manufacturer_notes: manufacturerNotes || null,
          rejected_reason: rejectedReason,
          response_date: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Pedido rechazado. El comprador será notificado.");
      setDialogOpen(false);
      fetchOrders();
    } catch (error) {
      const message = handleError("Order rejection", error);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any; label: string }> = {
      pending_confirmation: { color: "bg-warning/10 text-warning border-warning/20", icon: Clock, label: "Pendiente de confirmación" },
      pending: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Inbox, label: "Recibido - En revisión" },
      confirmed: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle, label: "Confirmado" },
      rejected: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: "Rechazado" },
      in_production: { color: "bg-primary/10 text-primary border-primary/20", icon: Package, label: "En producción" },
      in_shipping: { color: "bg-primary/10 text-primary border-primary/20", icon: Ship, label: "En tránsito" },
      delivered: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle, label: "Entregado" },
    };
    return configs[status] || configs.pending_confirmation;
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
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Pedidos y Solicitudes</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Gestiona pedidos y solicitudes de informacion de clientes potenciales
        </p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pedidos ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Solicitudes ({quoteRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <div className="grid gap-4">
            {orders.map((order) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={order.id} className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">
                          {order.product?.name || "Producto"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.buyer_company || order.buyer?.company_name || "Comprador desconocido"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" />
                          {order.buyer_email || order.buyer?.email || "—"}
                        </p>
                      </div>
                      <Badge className={`${statusConfig.color} border shrink-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-3">
                      <div>
                        <p className="text-muted-foreground text-xs">Cantidad</p>
                        <p className="font-semibold text-foreground">{order.quantity} unidades</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total</p>
                        <p className="font-semibold text-primary">€{order.total_price.toLocaleString()}</p>
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
                      onClick={() => handleViewDetails(order)}
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

            {orders.length === 0 && (
              <Card className="border-border">
                <CardContent className="py-16 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No hay pedidos aun</p>
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
                            <p className="text-muted-foreground text-xs">Codigo Postal</p>
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
                          onClick={() => handleViewQuoteDetails(quote)}
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
                  <p className="text-muted-foreground text-lg">No hay solicitudes de informacion aun</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Pedido</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Summary */}
              <Card className="bg-surface border-border">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-4">
                    {selectedOrder.product?.images && Array.isArray(selectedOrder.product.images) && selectedOrder.product.images.length > 0 && (
                      <img 
                        src={selectedOrder.product.images[0]} 
                        alt={selectedOrder.product.name}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <div>
                        <Label className="text-muted-foreground">Producto</Label>
                        <p className="font-semibold text-lg text-foreground">
                          {selectedOrder.product?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrder.product?.category} {selectedOrder.product?.hs_code && `• HS: ${selectedOrder.product.hs_code}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Cantidad</Label>
                      <p className="font-semibold text-lg text-foreground">{selectedOrder.quantity} unidades</p>
                      {selectedOrder.product && selectedOrder.quantity < selectedOrder.product.moq && (
                        <p className="text-xs text-destructive">⚠️ Menor a MOQ ({selectedOrder.product.moq})</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Total Pedido</Label>
                      <p className="font-semibold text-xl text-primary">
                        €{selectedOrder.total_price.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Volumen Total</Label>
                      <p className="font-semibold text-foreground">
                        {selectedOrder.product?.volume_m3 
                          ? `${(selectedOrder.product.volume_m3 * selectedOrder.quantity).toFixed(2)} m³`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Peso Total</Label>
                      <p className="font-semibold text-foreground">
                        {selectedOrder.product?.weight_gross_kg 
                          ? `${(selectedOrder.product.weight_gross_kg * selectedOrder.quantity).toFixed(0)} kg`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">Incoterm</Label>
                      <p className="font-medium text-foreground">{selectedOrder.incoterm || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Fecha del Pedido</Label>
                      <p className="font-medium text-foreground">
                        {new Date(selectedOrder.created_at).toLocaleString("es-ES")}
                      </p>
                    </div>
                  </div>

                  {/* Dimensiones del producto */}
                  {selectedOrder.product && (selectedOrder.product.length_cm || selectedOrder.product.width_cm || selectedOrder.product.height_cm) && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground text-xs">Dimensiones (unitarias)</Label>
                        <p className="text-sm font-medium text-foreground">
                          {selectedOrder.product.length_cm}cm × {selectedOrder.product.width_cm}cm × {selectedOrder.product.height_cm}cm
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Buyer Info */}
              <Card className="bg-surface border-border">
                <CardContent className="pt-6 space-y-3">
                  <h4 className="font-semibold text-foreground">Información del Comprador</h4>
                  <div>
                    <Label className="text-muted-foreground">Empresa</Label>
                    <p className="font-medium text-foreground">
                      {selectedOrder.buyer_company || selectedOrder.buyer?.company_name || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contacto</Label>
                    <p className="font-medium text-foreground">
                      {selectedOrder.buyer?.full_name || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium text-foreground">
                      {selectedOrder.buyer_email || selectedOrder.buyer?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">País</Label>
                    <p className="font-medium text-foreground">{selectedOrder.buyer?.country || "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              {selectedOrder.calculation_snapshot && (
                <Card className="bg-surface border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="h-5 w-5" />
                      Desglose de Costos Completo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CostBreakdown
                      priceUnit={selectedOrder.calculation_snapshot.breakdown?.price_unit || 0}
                      quantity={selectedOrder.quantity}
                      volumeM3={selectedOrder.product?.volume_m3}
                      freightCostPerM3={selectedOrder.calculation_snapshot.parameters?.freight_cost_per_m3}
                      originExpenses={selectedOrder.calculation_snapshot.parameters?.origin_expenses}
                      marineInsurancePercentage={selectedOrder.calculation_snapshot.parameters?.marine_insurance_percentage}
                      destinationExpenses={selectedOrder.calculation_snapshot.breakdown?.destination_expenses}
                      tariffPercentage={selectedOrder.calculation_snapshot.parameters?.tariff_percentage}
                      vatPercentage={selectedOrder.calculation_snapshot.parameters?.vat_percentage}
                      cifValue={selectedOrder.calculation_snapshot.breakdown?.cif}
                      marineInsuranceCost={selectedOrder.calculation_snapshot.breakdown?.insurance}
                      taxableBase={selectedOrder.calculation_snapshot.breakdown?.taxable_base}
                      tariffCost={selectedOrder.calculation_snapshot.breakdown?.tariff}
                      vatCost={selectedOrder.calculation_snapshot.breakdown?.vat}
                      totalCostWithTaxes={selectedOrder.calculation_snapshot.breakdown?.total}
                      className="border-none shadow-none"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Buyer Notes */}
              {selectedOrder.buyer_notes && (
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="pt-6">
                    <Label className="text-muted-foreground font-semibold">💬 Notas del Comprador</Label>
                    <p className="text-sm mt-2 text-foreground whitespace-pre-wrap">{selectedOrder.buyer_notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Acknowledge Receipt - Only for pending_confirmation */}
              {selectedOrder.status === "pending_confirmation" && (
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Inbox className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">Nueva solicitud de pedido</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Confirma que has recibido esta solicitud para que el comprador sepa que la estás revisando.
                        </p>
                        <Button
                          onClick={handleAcknowledgeReceipt}
                          disabled={processing}
                          variant="outline"
                          className="mt-3 border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Inbox className="mr-2 h-4 w-4" />
                          {processing ? "Confirmando..." : "Confirmar Recepción"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Response Section - Only show if pending (after receipt) */}
              {selectedOrder.status === "pending" && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="notes">Notas para el Comprador (opcional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Ej: Condiciones de pago, tiempo estimado de entrega, requisitos adicionales..."
                        value={manufacturerNotes}
                        onChange={(e) => setManufacturerNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="reject-reason">Motivo de Rechazo (solo si rechazas)</Label>
                      <Textarea
                        id="reject-reason"
                        placeholder="Ej: No contamos con stock suficiente, el MOQ no se cumple, etc..."
                        value={rejectedReason}
                        onChange={(e) => setRejectedReason(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      onClick={handleConfirmOrder}
                      disabled={processing}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {processing ? "Confirmando..." : "Confirmar Pedido"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectOrder}
                      disabled={processing || !rejectedReason.trim()}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {processing ? "Rechazando..." : "Rechazar"}
                    </Button>
                  </div>
                </>
              )}

              {/* Show response if already processed */}
              {(selectedOrder.status === "confirmed" || selectedOrder.status === "rejected") && (
                <Card className={`border-2 ${
                  selectedOrder.status === "confirmed" 
                    ? "border-success/20 bg-success/5" 
                    : "border-destructive/20 bg-destructive/5"
                }`}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground">Respuesta</Label>
                        <Badge className={getStatusConfig(selectedOrder.status).color}>
                          {getStatusConfig(selectedOrder.status).label}
                        </Badge>
                      </div>

                      {selectedOrder.manufacturer_notes && (
                        <div>
                          <Label className="text-muted-foreground">Notas enviadas</Label>
                          <p className="text-sm mt-1 text-foreground">{selectedOrder.manufacturer_notes}</p>
                        </div>
                      )}

                      {selectedOrder.rejected_reason && (
                        <div>
                          <Label className="text-muted-foreground">Motivo de rechazo</Label>
                          <p className="text-sm mt-1 text-foreground">{selectedOrder.rejected_reason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quote Request Details Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Solicitud de Informacion
            </DialogTitle>
          </DialogHeader>

          {selectedQuoteRequest && (
            <div className="space-y-4">
              {/* Product Info */}
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
                      <Label className="text-muted-foreground text-xs">Producto</Label>
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

              {/* Quote Details: Quantity, Total, Volume */}
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
                            ? `€${selectedQuoteRequest.calculation_snapshot.breakdown.total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Volumen</p>
                        <p className="text-xl font-bold text-foreground">
                          {selectedQuoteRequest.calculation_snapshot?.breakdown?.total_volume_m3
                            ? `${selectedQuoteRequest.calculation_snapshot.breakdown.total_volume_m3.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

              {/* Contact Info */}
              <Card className="bg-surface border-border">
                <CardContent className="pt-6 space-y-4">
                  <h4 className="font-semibold text-foreground">Datos de Contacto</h4>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Email</Label>
                        <p className="font-medium text-foreground">{selectedQuoteRequest.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Telefono con WhatsApp</Label>
                        <p className="font-medium text-foreground">{selectedQuoteRequest.mobile_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">NIF / CIF / NIE / DNI / VAT-ID</Label>
                        <p className="font-medium text-foreground">{selectedQuoteRequest.tax_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Codigo Postal</Label>
                        <p className="font-medium text-foreground">{selectedQuoteRequest.postal_code}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Info */}
              <Card className="bg-surface border-border">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-muted-foreground text-xs">Fecha de solicitud</Label>
                      <p className="font-medium text-foreground">
                        {new Date(selectedQuoteRequest.created_at).toLocaleString("es-ES")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Label className="text-muted-foreground text-xs">Estado</Label>
                      <Badge className={`${getQuoteStatusConfig(selectedQuoteRequest.status).color} border mt-1`}>
                        {getQuoteStatusConfig(selectedQuoteRequest.status).label}
                      </Badge>
                    </div>
                  </div>
                  {selectedQuoteRequest.is_authenticated && (
                    <Badge variant="outline" className="text-xs">
                      Usuario registrado en plataforma
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedQuoteRequest.email}?subject=Informacion sobre ${selectedQuoteRequest.product?.name || 'producto'}`, '_blank')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const phone = selectedQuoteRequest.mobile_phone.replace(/[^0-9+]/g, '');
                    const message = encodeURIComponent(`Hola, he recibido tu solicitud de informacion sobre ${selectedQuoteRequest.product?.name || 'nuestro producto'}. Estoy disponible para darte mas detalles.`);
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
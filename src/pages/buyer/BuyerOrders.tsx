import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Eye } from "lucide-react";
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
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string;
  incoterm: string | null;
  transport_message: string | null;
  delivery_confirmed_at: string | null;
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { confirmDelivery, updateTransportMessage } = useOrderActions();

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

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
    } catch (error) {
      handleError("Orders fetch", error);
    } finally {
      setLoading(false);
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

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    const success = await confirmDelivery(selectedOrder.id);
    if (success) {
      setDialogOpen(false);
      fetchOrders();
    }
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Pedidos</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Gestiona y realiza seguimiento de tus pedidos
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg text-foreground">
              Todos los Pedidos
            </CardTitle>
            <OrderFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              monthFilter={monthFilter}
              onMonthChange={setMonthFilter}
              availableMonths={availableMonths}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
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
                          <OrderStatusBadge status={order.status} />
                        </div>

                        {/* Compact progress bar */}
                        <OrderProgressTimeline currentStatus={order.status} />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Cantidad</p>
                            <p className="font-semibold text-sm text-foreground">
                              {order.quantity} uds
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-semibold text-sm text-primary">
                              €{formatNumber(Number(order.total_price))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Incoterm</p>
                            <p className="font-semibold text-sm text-foreground">
                              {order.incoterm || "—"}
                            </p>
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
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                {statusFilter === "all" && monthFilter === "all"
                  ? "No tienes pedidos aún"
                  : "No hay pedidos con estos filtros"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
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
                manufacturer_name: selectedOrder.manufacturer?.company_name ?? null,
                buyer_name: null,
              }
            : null
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* awaiting_payment: Upload payment receipt */}
            {selectedOrder.status === "awaiting_payment" && (
              <OrderDocumentSection
                orderId={selectedOrder.id}
                documentType="payment_receipt"
                canUpload={true}
                canDelete={false}
                maxFiles={3}
              />
            )}

            {/* payment_confirmed: Download invoice */}
            {selectedOrder.status === "payment_confirmed" && (
              <OrderDocumentSection
                orderId={selectedOrder.id}
                documentType="invoice"
                canUpload={false}
                canDelete={false}
              />
            )}

            {/* in_transit: View transport message + download transport docs */}
            {selectedOrder.status === "in_transit" && (
              <>
                <TransportMessageCard
                  orderId={selectedOrder.id}
                  message={selectedOrder.transport_message}
                  canEdit={false}
                  onUpdate={updateTransportMessage}
                />
                <OrderDocumentSection
                  orderId={selectedOrder.id}
                  documentType="transport_doc"
                  canUpload={false}
                  canDelete={false}
                />
              </>
            )}

            {/* delivered: Confirm receipt */}
            {selectedOrder.status === "delivered" && !selectedOrder.delivery_confirmed_at && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-foreground mb-3">
                    Tu pedido ha sido entregado. Confirma la recepción para cerrar la orden.
                  </p>
                  <Button onClick={handleConfirmDelivery}>
                    Confirmar Recepción
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedOrder.status === "delivered" && selectedOrder.delivery_confirmed_at && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    Recepción confirmada el{" "}
                    {new Date(selectedOrder.delivery_confirmed_at).toLocaleDateString("es-ES")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </OrderDetailDialog>
    </div>
  );
};

export default BuyerOrders;

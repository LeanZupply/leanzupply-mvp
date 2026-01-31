import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { formatNumber } from "@/lib/formatters";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { OrderDocumentSection } from "@/components/orders/OrderDocumentSection";
import { TransportMessageCard } from "@/components/orders/TransportMessageCard";
import { OrderFilters, extractAvailableMonths, filterByMonth } from "@/components/orders/OrderFilters";
import { useOrderActions } from "@/hooks/useOrderActions";
import { ORDER_STATUS_CONFIG, type OrderStatus } from "@/lib/orderConstants";

interface Order {
  id: string;
  order_reference: string | null;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string;
  incoterm: string;
  transport_message: string | null;
  tracking_info: any;
  created_at: string;
  buyer: {
    company_name: string;
    full_name: string;
  };
  manufacturer: {
    company_name: string;
    full_name: string;
  };
  product: {
    name: string;
  };
}

const SuperadminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { confirmPayment, updateOrderStatus, updateTransportMessage } = useOrderActions();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(company_name, full_name),
          manufacturer:profiles!orders_manufacturer_id_fkey(company_name, full_name),
          product:products(name)
        `)
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus as OrderStatus);
    if (success) fetchOrders();
  };

  const handleConfirmPayment = async (orderId: string) => {
    const success = await confirmPayment(orderId);
    if (success) fetchOrders();
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
        <h1 className="text-3xl font-semibold text-foreground">Gestión de Órdenes</h1>
        <p className="text-muted-foreground mt-1">Administra y supervisa todas las órdenes de la plataforma</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-foreground">Todas las Órdenes</CardTitle>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Fabricante</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm text-primary">
                      {order.order_reference || order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{order.buyer?.company_name}</TableCell>
                    <TableCell>{order.manufacturer?.company_name}</TableCell>
                    <TableCell>{order.product?.name}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>€{formatNumber(order.total_price)}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-44">
                          <OrderStatusBadge status={order.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>
                              {ORDER_STATUS_CONFIG[s].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {order.status === "awaiting_payment" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmPayment(order.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Confirmar Pago
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No se encontraron órdenes
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
                buyer_name: selectedOrder.buyer?.company_name ?? null,
              }
            : null
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Confirm payment action */}
            {selectedOrder.status === "awaiting_payment" && (
              <Button
                className="w-full"
                onClick={() => {
                  handleConfirmPayment(selectedOrder.id);
                  setDialogOpen(false);
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmar Pago
              </Button>
            )}

            {/* All document sections for superadmin */}
            <OrderDocumentSection
              orderId={selectedOrder.id}
              documentType="payment_receipt"
              canUpload={true}
              canDelete={true}
              maxFiles={5}
            />
            <OrderDocumentSection
              orderId={selectedOrder.id}
              documentType="invoice"
              canUpload={true}
              canDelete={true}
              maxFiles={5}
            />
            <OrderDocumentSection
              orderId={selectedOrder.id}
              documentType="transport_doc"
              canUpload={true}
              canDelete={true}
              maxFiles={10}
            />

            {/* Transport message - editable by superadmin */}
            <TransportMessageCard
              orderId={selectedOrder.id}
              message={selectedOrder.transport_message}
              canEdit={true}
              onUpdate={updateTransportMessage}
            />
          </div>
        )}
      </OrderDetailDialog>
    </div>
  );
};

export default SuperadminOrders;

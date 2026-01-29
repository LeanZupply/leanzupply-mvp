import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { formatNumber } from "@/lib/formatters";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string;
  incoterm: string;
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
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, orders]);

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
      setFilteredOrders(data || []);
    } catch (error) {
      const message = handleError("Orders fetch", error);
      toast.error(message);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      toast.success("Order status updated");
    } catch (error) {
      const message = handleError("Order update", error);
      toast.error(message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "in_shipping":
      case "in_production":
        return "secondary";
      case "confirmed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentBadgeVariant = (status: string) => {
    return status === "paid" ? "default" : "secondary";
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
        <h1 className="text-3xl font-semibold text-text">Orders Overview</h1>
        <p className="text-muted mt-1">Monitor and manage all platform orders</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-text">All Orders</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="in_shipping">In Shipping</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{order.buyer?.company_name}</TableCell>
                  <TableCell>{order.manufacturer?.company_name}</TableCell>
                  <TableCell>{order.product?.name}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>€{formatNumber(order.total_price)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-36">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status.replace("_", " ")}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_production">In Production</SelectItem>
                        <SelectItem value="in_shipping">In Shipping</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentBadgeVariant(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredOrders.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No orders found</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground/70 mb-1">Order ID</p>
                <p className="font-mono text-sm">{selectedOrder.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Buyer</p>
                  <p className="font-medium">{selectedOrder.buyer?.company_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Manufacturer</p>
                  <p className="font-medium">{selectedOrder.manufacturer?.company_name}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/70 mb-1">Product</p>
                <p className="font-medium">{selectedOrder.product?.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Quantity</p>
                  <p className="font-medium">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Total Price</p>
                  <p className="font-medium">€{formatNumber(selectedOrder.total_price)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Incoterm</p>
                  <p className="font-medium">{selectedOrder.incoterm || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Order Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                    {selectedOrder.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Payment Status</p>
                  <Badge variant={getPaymentBadgeVariant(selectedOrder.payment_status)}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/70 mb-1">Created At</p>
                <p className="font-medium">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              {selectedOrder.tracking_info && (
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-2">Tracking Information</p>
                  <pre className="rounded bg-surface p-3 text-xs overflow-auto">
                    {JSON.stringify(selectedOrder.tracking_info, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminOrders;

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderProgressTimeline } from "./OrderProgressTimeline";
import { OrderActivityLog } from "./OrderActivityLog";
import { formatNumber } from "@/lib/formatters";
import type { ReactNode } from "react";

interface OrderSummary {
  id: string;
  order_reference: string | null;
  status: string;
  quantity: number;
  total_price: number;
  incoterm: string | null;
  created_at: string;
  product_name: string | null;
  manufacturer_name: string | null;
  buyer_name: string | null;
}

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderSummary | null;
  children?: ReactNode;
}

export const OrderDetailDialog = ({
  open,
  onOpenChange,
  order,
  children,
}: OrderDetailDialogProps) => {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>Detalle de Orden</span>
            {order.order_reference && (
              <span className="text-primary font-mono text-base">
                {order.order_reference}
              </span>
            )}
            <OrderStatusBadge status={order.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Timeline */}
          <OrderProgressTimeline currentStatus={order.status} />

          {/* Summary */}
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Producto</p>
                  <p className="font-medium text-foreground">{order.product_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cantidad</p>
                  <p className="font-semibold text-foreground">{order.quantity} uds</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold text-primary">€{formatNumber(order.total_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium text-foreground">
                    {new Date(order.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>

              {(order.manufacturer_name || order.buyer_name) && (
                <>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {order.manufacturer_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">Fabricante</p>
                        <p className="font-medium text-foreground">{order.manufacturer_name}</p>
                      </div>
                    )}
                    {order.buyer_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">Comprador</p>
                        <p className="font-medium text-foreground">{order.buyer_name}</p>
                      </div>
                    )}
                    {order.incoterm && (
                      <div>
                        <p className="text-xs text-muted-foreground">Incoterm</p>
                        <p className="font-medium text-foreground">{order.incoterm}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Role-specific actions injected as children */}
          {children}

          {/* Activity Log */}
          <OrderActivityLog orderId={order.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

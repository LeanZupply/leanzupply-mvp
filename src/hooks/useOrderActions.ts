import { supabase } from "@/integrations/supabase/client";
import { logOrderActivity } from "@/lib/orderActivityLogger";
import { notifyOrderEvent } from "@/lib/orderNotifications";
import { toast } from "sonner";
import type { OrderStatus } from "@/lib/orderConstants";

async function getOrderParties(orderId: string) {
  const { data } = await supabase
    .from("orders")
    .select("buyer_id, manufacturer_id, status, order_reference")
    .eq("id", orderId)
    .single();
  return data;
}

export function useOrderActions() {
  const confirmPayment = async (orderId: string): Promise<boolean> => {
    try {
      const order = await getOrderParties(orderId);
      if (!order) throw new Error("Orden no encontrada");

      const { error } = await supabase
        .from("orders")
        .update({
          status: "payment_confirmed",
          payment_status: "paid",
          payment_confirmed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await logOrderActivity({
        orderId,
        action: "payment_confirmed",
        oldState: order.status,
        newState: "payment_confirmed",
        message: "Pago confirmado por administrador",
      });

      await notifyOrderEvent({
        orderId,
        targetUserId: order.manufacturer_id,
        title: "Pago confirmado",
        message: `El pago de la orden ${order.order_reference || orderId.slice(0, 8)} ha sido confirmado. Puedes subir la factura.`,
      });

      await notifyOrderEvent({
        orderId,
        targetUserId: order.buyer_id,
        title: "Pago acreditado",
        message: `Tu pago para la orden ${order.order_reference || orderId.slice(0, 8)} ha sido acreditado.`,
      });

      toast.success("Pago confirmado correctamente");
      return true;
    } catch (error) {
      console.error("[useOrderActions] confirmPayment error:", error);
      toast.error("Error al confirmar el pago");
      return false;
    }
  };

  const updateTransportMessage = async (
    orderId: string,
    message: string
  ): Promise<boolean> => {
    try {
      const order = await getOrderParties(orderId);
      if (!order) throw new Error("Orden no encontrada");

      const { error } = await supabase
        .from("orders")
        .update({ transport_message: message })
        .eq("id", orderId);

      if (error) throw error;

      await logOrderActivity({
        orderId,
        action: "transport_message_updated",
        message: "Mensaje de transporte actualizado",
        metadata: { transport_message: message },
      });

      toast.success("Mensaje de transporte actualizado");
      return true;
    } catch (error) {
      console.error("[useOrderActions] updateTransportMessage error:", error);
      toast.error("Error al actualizar el mensaje de transporte");
      return false;
    }
  };

  const confirmDelivery = async (orderId: string): Promise<boolean> => {
    try {
      const order = await getOrderParties(orderId);
      if (!order) throw new Error("Orden no encontrada");

      const { error } = await supabase
        .from("orders")
        .update({
          delivery_confirmed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await logOrderActivity({
        orderId,
        action: "delivery_confirmed",
        message: "Recepción confirmada por el comprador",
      });

      toast.success("Recepción confirmada");
      return true;
    } catch (error) {
      console.error("[useOrderActions] confirmDelivery error:", error);
      toast.error("Error al confirmar la recepción");
      return false;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ): Promise<boolean> => {
    try {
      const order = await getOrderParties(orderId);
      if (!order) throw new Error("Orden no encontrada");

      const oldStatus = order.status;

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      await logOrderActivity({
        orderId,
        action: "status_changed",
        oldState: oldStatus,
        newState: newStatus,
        message: `Estado cambiado de ${oldStatus} a ${newStatus}`,
      });

      await notifyOrderEvent({
        orderId,
        targetUserId: order.buyer_id,
        title: "Estado de orden actualizado",
        message: `Tu orden ${order.order_reference || orderId.slice(0, 8)} ha sido actualizada.`,
      });

      toast.success("Estado actualizado correctamente");
      return true;
    } catch (error) {
      console.error("[useOrderActions] updateOrderStatus error:", error);
      toast.error("Error al actualizar el estado");
      return false;
    }
  };

  return {
    confirmPayment,
    updateTransportMessage,
    confirmDelivery,
    updateOrderStatus,
  };
}

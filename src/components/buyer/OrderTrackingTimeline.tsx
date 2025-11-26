import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  FileCheck,
  ShoppingCart,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TrackingEvent {
  id: string;
  step: string;
  metadata: any;
  created_at: string;
}

interface OrderTrackingTimelineProps {
  orderId: string;
  productId: string;
  userId: string;
}

const STEP_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  viewed: { icon: Eye, label: "Producto visto", color: "text-muted-foreground" },
  added_to_pallet: { icon: ShoppingCart, label: "Añadido al pallet", color: "text-blue-500" },
  requested: { icon: Package, label: "Pedido solicitado", color: "text-orange-500" },
  pending_confirmation: { icon: Clock, label: "Pendiente de confirmación", color: "text-yellow-500" },
  confirmed: { icon: CheckCircle2, label: "Pedido confirmado", color: "text-green-500" },
  paid: { icon: FileCheck, label: "Pago confirmado", color: "text-green-600" },
  shipped: { icon: Truck, label: "En tránsito", color: "text-blue-600" },
  delivered: { icon: CheckCircle2, label: "Entregado", color: "text-green-700" },
};

export const OrderTrackingTimeline = ({ orderId, productId, userId }: OrderTrackingTimelineProps) => {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackingEvents();
  }, [orderId, productId]);

  const fetchTrackingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("order_tracking")
        .select("*")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching tracking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando historial...</div>;
  }

  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground">No hay eventos registrados</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Línea vertical */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          {events.map((event, index) => {
            const config = STEP_CONFIG[event.step] || STEP_CONFIG.viewed;
            const Icon = config.icon;
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="relative flex gap-4 items-start">
                {/* Icono */}
                <div className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background ${
                  isLast ? "bg-muted" : "bg-background"
                }`}>
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>

                {/* Contenido */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{config.label}</p>
                    <Badge variant="outline" className="text-xs">
                      {formatDistanceToNow(new Date(event.created_at), { 
                        addSuffix: true,
                        locale: es 
                      })}
                    </Badge>
                  </div>
                  
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {event.metadata.quantity && (
                        <p>Cantidad: {event.metadata.quantity}</p>
                      )}
                      {event.metadata.notes && (
                        <p className="mt-1 italic">"{event.metadata.notes}"</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

import { useOrderActivityLog } from "@/hooks/useOrderActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getStatusConfig } from "@/lib/orderConstants";

interface OrderActivityLogProps {
  orderId: string;
}

const ACTION_LABELS: Record<string, string> = {
  status_changed: "Cambio de estado",
  status_migrated: "Migración de estado",
  payment_confirmed: "Pago confirmado",
  delivery_confirmed: "Recepción confirmada",
  transport_message_updated: "Mensaje de transporte",
  document_uploaded: "Documento subido",
  document_deleted: "Documento eliminado",
  order_created: "Orden creada",
};

export const OrderActivityLog = ({ orderId }: OrderActivityLogProps) => {
  const { entries, loading } = useOrderActivityLog(orderId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Cargando actividad...
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No hay actividad registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Registro de Actividad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          {entries.map((entry) => (
            <div key={entry.id} className="relative flex gap-3 items-start">
              <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted shrink-0">
                <History className="h-3 w-3 text-muted-foreground" />
              </div>

              <div className="flex-1 pb-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {ACTION_LABELS[entry.action] || entry.action}
                    </p>
                    {entry.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">
                        {entry.message}
                      </p>
                    )}
                    {entry.old_state && entry.new_state && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {getStatusConfig(entry.old_state).shortLabel}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {getStatusConfig(entry.new_state).shortLabel}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {formatDistanceToNow(new Date(entry.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

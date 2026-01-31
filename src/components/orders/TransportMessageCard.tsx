import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Edit3, Save } from "lucide-react";

interface TransportMessageCardProps {
  orderId: string;
  message: string | null;
  canEdit: boolean;
  onUpdate: (orderId: string, message: string) => Promise<boolean>;
}

export const TransportMessageCard = ({
  orderId,
  message,
  canEdit,
  onUpdate,
}: TransportMessageCardProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await onUpdate(orderId, draft);
    if (success) {
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Mensaje de Transporte
          </CardTitle>
          {canEdit && !editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(message || "");
                setEditing(true);
              }}
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Información sobre el transporte, número de tracking, notas..."
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-3 w-3 mr-1" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        ) : message ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            No hay mensaje de transporte
          </p>
        )}
      </CardContent>
    </Card>
  );
};

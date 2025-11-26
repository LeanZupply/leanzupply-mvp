import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VolumeSurcharge {
  id: string;
  min_volume: number;
  max_volume: number | null;
  surcharge_amount: number;
  requires_quote: boolean;
  description: string | null;
  active: boolean;
  display_order: number;
  updated_at: string;
}

export default function SuperadminVolumeSurcharges() {
  const [surcharges, setSurcharges] = useState<VolumeSurcharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSurcharge, setEditingSurcharge] = useState<VolumeSurcharge | null>(null);
  const [formData, setFormData] = useState({
    min_volume: "",
    max_volume: "",
    surcharge_amount: "",
    requires_quote: false,
    description: "",
    active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchSurcharges();
  }, []);

  const fetchSurcharges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("volume_surcharges")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSurcharges(data || []);
    } catch (error: any) {
      console.error("Error fetching surcharges:", error);
      toast.error("Error al cargar recargos de volumen");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const minVol = parseFloat(formData.min_volume);
      const maxVol = formData.max_volume ? parseFloat(formData.max_volume) : null;
      const surchargeAmt = parseFloat(formData.surcharge_amount);

      if (isNaN(minVol) || minVol < 0) {
        toast.error("Volumen mínimo inválido");
        return;
      }

      if (maxVol !== null && maxVol <= minVol) {
        toast.error("Volumen máximo debe ser mayor que el mínimo");
        return;
      }

      if (isNaN(surchargeAmt) || surchargeAmt < 0) {
        toast.error("Monto de recargo inválido");
        return;
      }

      const surchargeData = {
        min_volume: minVol,
        max_volume: maxVol,
        surcharge_amount: surchargeAmt,
        requires_quote: formData.requires_quote,
        description: formData.description || null,
        active: formData.active,
        display_order: formData.display_order,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingSurcharge) {
        const { error } = await supabase
          .from("volume_surcharges")
          .update(surchargeData)
          .eq("id", editingSurcharge.id);

        if (error) throw error;
        toast.success("Recargo actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("volume_surcharges")
          .insert({
            ...surchargeData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
        toast.success("Recargo creado correctamente");
      }

      setDialogOpen(false);
      resetForm();
      fetchSurcharges();
    } catch (error: any) {
      console.error("Error saving surcharge:", error);
      toast.error(error.message || "Error al guardar recargo");
    }
  };

  const handleEdit = (surcharge: VolumeSurcharge) => {
    setEditingSurcharge(surcharge);
    setFormData({
      min_volume: surcharge.min_volume.toString(),
      max_volume: surcharge.max_volume?.toString() || "",
      surcharge_amount: surcharge.surcharge_amount.toString(),
      requires_quote: surcharge.requires_quote,
      description: surcharge.description || "",
      active: surcharge.active,
      display_order: surcharge.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este recargo?")) return;

    try {
      const { error } = await supabase
        .from("volume_surcharges")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Recargo eliminado");
      fetchSurcharges();
    } catch (error: any) {
      console.error("Error deleting surcharge:", error);
      toast.error("Error al eliminar recargo");
    }
  };

  const toggleActive = async (surcharge: VolumeSurcharge) => {
    try {
      const { error } = await supabase
        .from("volume_surcharges")
        .update({ active: !surcharge.active })
        .eq("id", surcharge.id);

      if (error) throw error;
      toast.success(surcharge.active ? "Recargo desactivado" : "Recargo activado");
      fetchSurcharges();
    } catch (error: any) {
      console.error("Error toggling surcharge:", error);
      toast.error("Error al cambiar estado");
    }
  };

  const resetForm = () => {
    setFormData({
      min_volume: "",
      max_volume: "",
      surcharge_amount: "",
      requires_quote: false,
      description: "",
      active: true,
      display_order: surcharges.length,
    });
    setEditingSurcharge(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Recargos por Volumen</h2>
          <p className="text-muted-foreground">Configura recargos según el volumen total del envío</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Recargo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingSurcharge ? "Editar Recargo" : "Nuevo Recargo de Volumen"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Volumen Mínimo (m³)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.min_volume}
                    onChange={(e) => setFormData({ ...formData, min_volume: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Volumen Máximo (m³)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.max_volume}
                    onChange={(e) => setFormData({ ...formData, max_volume: e.target.value })}
                    placeholder="Dejar vacío para sin límite"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Vacío = sin límite superior
                  </p>
                </div>
              </div>

              <div>
                <Label>Monto del Recargo (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.surcharge_amount}
                  onChange={(e) => setFormData({ ...formData, surcharge_amount: e.target.value })}
                  placeholder="40.00"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del recargo"
                  rows={2}
                />
              </div>

              <div>
                <Label>Orden de Visualización</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label>Requiere Cotización Manual</Label>
                  <p className="text-xs text-muted-foreground">
                    Si está activo, el sistema solicitará contacto comercial
                  </p>
                </div>
                <Switch
                  checked={formData.requires_quote}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_quote: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Recargo Activo</Label>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingSurcharge ? "Actualizar" : "Crear"} Recargo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Los recargos se aplican según el volumen total del carrito (suma de volúmenes × cantidades). El primer tramo coincidente será aplicado.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recargos Configurados ({surcharges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Rango de Volumen (m³)</TableHead>
                <TableHead>Recargo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Requiere Cotización</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surcharges.map((surcharge) => (
                <TableRow key={surcharge.id}>
                  <TableCell className="font-mono">{surcharge.display_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {surcharge.min_volume.toFixed(2)} - {surcharge.max_volume ? surcharge.max_volume.toFixed(2) : "∞"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    €{surcharge.surcharge_amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {surcharge.description || "—"}
                  </TableCell>
                  <TableCell>
                    {surcharge.requires_quote && (
                      <Badge variant="secondary">
                        <FileText className="mr-1 h-3 w-3" />
                        Cotización
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={surcharge.active ? "default" : "secondary"}>
                      {surcharge.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(surcharge)}
                    >
                      <Switch checked={surcharge.active} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(surcharge)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(surcharge.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

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
import { Plus, Edit, Trash2, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PostalCodeRange {
  start: string;
  end: string;
  label: string;
  is_fallback?: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  postal_code_ranges: PostalCodeRange[];
  active: boolean;
  display_order: number;
  updated_at: string;
}

export default function SuperadminLocalShippingZones() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    postal_code_ranges: "",
    active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("local_shipping_zones")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setZones(data as any || []);
    } catch (error: any) {
      console.error("Error fetching zones:", error);
      toast.error("Error al cargar zonas de envío");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Parse and validate postal code ranges
      let parsedRanges: PostalCodeRange[];
      try {
        parsedRanges = JSON.parse(formData.postal_code_ranges);
        if (!Array.isArray(parsedRanges)) throw new Error("Debe ser un array");
      } catch (e) {
        toast.error("Formato JSON inválido en rangos de CP");
        return;
      }

      const zoneData = {
        name: formData.name,
        description: formData.description || null,
        base_price: parseFloat(formData.base_price),
        postal_code_ranges: parsedRanges as any,
        active: formData.active,
        display_order: formData.display_order,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingZone) {
        const { error } = await supabase
          .from("local_shipping_zones")
          .update(zoneData)
          .eq("id", editingZone.id);

        if (error) throw error;
        toast.success("Zona actualizada correctamente");
      } else {
        const { error } = await supabase
          .from("local_shipping_zones")
          .insert({
            ...zoneData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          } as any);

        if (error) throw error;
        toast.success("Zona creada correctamente");
      }

      setDialogOpen(false);
      resetForm();
      fetchZones();
    } catch (error: any) {
      console.error("Error saving zone:", error);
      toast.error(error.message || "Error al guardar zona");
    }
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description || "",
      base_price: zone.base_price.toString(),
      postal_code_ranges: JSON.stringify(zone.postal_code_ranges, null, 2),
      active: zone.active,
      display_order: zone.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta zona? Esto puede afectar pedidos activos.")) return;

    try {
      const { error } = await supabase
        .from("local_shipping_zones")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Zona eliminada");
      fetchZones();
    } catch (error: any) {
      console.error("Error deleting zone:", error);
      toast.error("Error al eliminar zona");
    }
  };

  const toggleActive = async (zone: ShippingZone) => {
    try {
      const { error } = await supabase
        .from("local_shipping_zones")
        .update({ active: !zone.active })
        .eq("id", zone.id);

      if (error) throw error;
      toast.success(zone.active ? "Zona desactivada" : "Zona activada");
      fetchZones();
    } catch (error: any) {
      console.error("Error toggling zone:", error);
      toast.error("Error al cambiar estado");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      base_price: "",
      postal_code_ranges: JSON.stringify([{ start: "", end: "", label: "" }], null, 2),
      active: true,
      display_order: zones.length,
    });
    setEditingZone(null);
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
          <h2 className="text-3xl font-bold">Zonas de Envío Local</h2>
          <p className="text-muted-foreground">Configura zonas y tarifas para envíos dentro de España</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Zona
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingZone ? "Editar Zona" : "Nueva Zona de Envío"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre de la Zona</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Zona 1 - Barcelona y Valencia"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional de la zona"
                  rows={2}
                />
              </div>

              <div>
                <Label>Tarifa Base (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="120.00"
                />
              </div>

              <div>
                <Label>Rangos de Código Postal (JSON)</Label>
                <Textarea
                  value={formData.postal_code_ranges}
                  onChange={(e) => setFormData({ ...formData, postal_code_ranges: e.target.value })}
                  placeholder='[{"start": "08000", "end": "08999", "label": "Barcelona"}]'
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: Array de objetos con start, end, label. Opcional: is_fallback: true
                </p>
              </div>

              <div>
                <Label>Orden de Visualización</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Zona Activa</Label>
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
                  {editingZone ? "Actualizar" : "Crear"} Zona
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Las zonas se evalúan en orden. La primera coincidencia de CP será la utilizada. La Zona 4 con "is_fallback" captura todos los CP no asignados.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Zonas Configuradas ({zones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Tarifa Base</TableHead>
                <TableHead>Rangos CP</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-mono">{zone.display_order}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      {zone.description && (
                        <p className="text-xs text-muted-foreground">{zone.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">€{zone.base_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(zone.postal_code_ranges as unknown as PostalCodeRange[]).map((range, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {range.is_fallback ? "Fallback" : `${range.start}-${range.end}`}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={zone.active ? "default" : "secondary"}>
                      {zone.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(zone.updated_at).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(zone)}
                    >
                      <Switch checked={zone.active} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(zone)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(zone.id)}
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

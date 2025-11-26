import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Ship, Plus, Edit, AlertTriangle, Calendar } from "lucide-react";
import { handleError } from "@/lib/errorHandler";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShippingRoute {
  id: string;
  origin_port: string;
  destination_country: string;
  destination_port: string | null;
  min_days: number;
  max_days: number;
  freight_cost_override: number | null;
  last_updated: string;
  notes: string | null;
  active: boolean;
}

export default function SuperadminShippingRoutes() {
  const [routes, setRoutes] = useState<ShippingRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<ShippingRoute | null>(null);
  
  const [formData, setFormData] = useState({
    origin_port: "",
    destination_country: "spain",
    destination_port: "",
    min_days: "",
    max_days: "",
    freight_cost_override: "",
    notes: "",
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from("shipping_routes")
        .select("*")
        .order("origin_port", { ascending: true });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      const message = handleError("Routes fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isOutdated = (lastUpdated: string) => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return new Date(lastUpdated) < ninetyDaysAgo;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.origin_port || !formData.min_days || !formData.max_days) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        origin_port: formData.origin_port.trim(),
        destination_country: formData.destination_country.toLowerCase(),
        destination_port: formData.destination_port.trim() || null,
        min_days: parseInt(formData.min_days),
        max_days: parseInt(formData.max_days),
        freight_cost_override: formData.freight_cost_override ? parseFloat(formData.freight_cost_override) : null,
        notes: formData.notes.trim() || null,
        last_updated: new Date().toISOString(),
      };

      if (editingRoute) {
        const { error } = await supabase
          .from("shipping_routes")
          .update(payload)
          .eq("id", editingRoute.id);
        
        if (error) throw error;
        toast.success("Ruta actualizada correctamente");
      } else {
        const { error } = await supabase
          .from("shipping_routes")
          .insert(payload);
        
        if (error) throw error;
        toast.success("Ruta creada correctamente");
      }

      setDialogOpen(false);
      resetForm();
      fetchRoutes();
    } catch (error: any) {
      const message = handleError("Route save", error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (route: ShippingRoute) => {
    setEditingRoute(route);
    setFormData({
      origin_port: route.origin_port,
      destination_country: route.destination_country,
      destination_port: route.destination_port || "",
      min_days: route.min_days.toString(),
      max_days: route.max_days.toString(),
      freight_cost_override: route.freight_cost_override?.toString() || "",
      notes: route.notes || "",
    });
    setDialogOpen(true);
  };

  const handleUpdateTimestamp = async (routeId: string) => {
    try {
      const { error } = await supabase
        .from("shipping_routes")
        .update({ last_updated: new Date().toISOString() })
        .eq("id", routeId);

      if (error) throw error;
      toast.success("Fecha actualizada");
      fetchRoutes();
    } catch (error) {
      const message = handleError("Timestamp update", error);
      toast.error(message);
    }
  };

  const resetForm = () => {
    setEditingRoute(null);
    setFormData({
      origin_port: "",
      destination_country: "spain",
      destination_port: "",
      min_days: "",
      max_days: "",
      freight_cost_override: "",
      notes: "",
    });
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

  const outdatedRoutes = routes.filter(r => isOutdated(r.last_updated));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Rutas de Envío</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tiempos de tránsito y costos por ruta puerto-origen/destino
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ruta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRoute ? "Editar Ruta" : "Nueva Ruta de Envío"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="origin_port">Puerto Origen *</Label>
                  <Input
                    id="origin_port"
                    value={formData.origin_port}
                    onChange={(e) => setFormData({ ...formData, origin_port: e.target.value })}
                    placeholder="Shanghai, Ningbo, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="destination_country">País Destino *</Label>
                  <Input
                    id="destination_country"
                    value={formData.destination_country}
                    onChange={(e) => setFormData({ ...formData, destination_country: e.target.value })}
                    placeholder="spain"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="destination_port">Puerto Destino</Label>
                  <Input
                    id="destination_port"
                    value={formData.destination_port}
                    onChange={(e) => setFormData({ ...formData, destination_port: e.target.value })}
                    placeholder="Barcelona, Valencia, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="freight_override">Costo Flete Override (€/m³)</Label>
                  <Input
                    id="freight_override"
                    type="number"
                    step="0.01"
                    value={formData.freight_cost_override}
                    onChange={(e) => setFormData({ ...formData, freight_cost_override: e.target.value })}
                    placeholder="Dejar vacío para usar default"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si se define, sobreescribe el costo de flete del país
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="min_days">Días Mínimos *</Label>
                  <Input
                    id="min_days"
                    type="number"
                    value={formData.min_days}
                    onChange={(e) => setFormData({ ...formData, min_days: e.target.value })}
                    required
                    placeholder="27"
                  />
                </div>
                <div>
                  <Label htmlFor="max_days">Días Máximos *</Label>
                  <Input
                    id="max_days"
                    type="number"
                    value={formData.max_days}
                    onChange={(e) => setFormData({ ...formData, max_days: e.target.value })}
                    required
                    placeholder="31"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ruta principal, temporada alta, etc."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : editingRoute ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {outdatedRoutes.length > 0 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="ml-2">
            <strong>{outdatedRoutes.length} rutas</strong> tienen más de 90 días sin actualizar. 
            Se recomienda revisar los tiempos de tránsito.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Rutas Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay rutas configuradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Días Tránsito</TableHead>
                  <TableHead>Flete Override</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.origin_port}</TableCell>
                    <TableCell>
                      {route.destination_port || route.destination_country.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {route.min_days} - {route.max_days} días
                    </TableCell>
                    <TableCell>
                      {route.freight_cost_override 
                        ? `€${route.freight_cost_override}/m³`
                        : <span className="text-muted-foreground">Default</span>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {new Date(route.last_updated).toLocaleDateString('es-ES')}
                        {isOutdated(route.last_updated) && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            +90 días
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={route.active ? "default" : "secondary"}>
                        {route.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateTimestamp(route.id)}
                          title="Actualizar fecha"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(route)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

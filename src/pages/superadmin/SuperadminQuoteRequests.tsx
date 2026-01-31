import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, MessageSquare, Users, UserCheck, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { formatCurrency, formatVolume } from "@/lib/formatters";

interface QuoteRequest {
  id: string;
  product_id: string;
  user_id: string | null;
  email: string;
  mobile_phone: string;
  tax_id: string;
  postal_code: string;
  status: string;
  admin_notes: string | null;
  is_authenticated: boolean;
  created_at: string;
  updated_at: string;
  quantity: number | null;
  notes: string | null;
  destination_port: string | null;
  calculation_snapshot: {
    breakdown?: {
      total?: number;
      total_volume_m3?: number;
      price_unit?: number;
    };
  } | null;
  product: {
    name: string;
    category: string;
  } | null;
  profile: {
    company_name: string | null;
    full_name: string | null;
  } | null;
}

const SuperadminQuoteRequests = () => {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<QuoteRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [authFilter, setAuthFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    completed: 0,
    abandoned: 0,
    authenticated: 0,
    anonymous: 0,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
    calculateStats();
  }, [statusFilter, authFilter, requests]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("quote_requests")
        .select(`
          *,
          product:products(name, category),
          profile:profiles(company_name, full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      setFilteredRequests(data || []);
    } catch (error) {
      const message = handleError("Quote requests fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (authFilter !== "all") {
      const isAuth = authFilter === "authenticated";
      filtered = filtered.filter((r) => r.is_authenticated === isAuth);
    }

    setFilteredRequests(filtered);
  };

  const calculateStats = () => {
    setStats({
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      contacted: requests.filter((r) => r.status === "contacted").length,
      completed: requests.filter((r) => r.status === "completed").length,
      abandoned: requests.filter((r) => r.status === "abandoned").length,
      authenticated: requests.filter((r) => r.is_authenticated).length,
      anonymous: requests.filter((r) => !r.is_authenticated).length,
    });
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("quote_requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );

      toast.success("Estado actualizado correctamente");
    } catch (error) {
      const message = handleError("Quote request update", error);
      toast.error(message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "contacted":
        return "secondary";
      case "pending":
        return "outline";
      case "abandoned":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "contacted":
        return "Contactado";
      case "completed":
        return "Completado";
      case "abandoned":
        return "Abandonó el proceso";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
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
        <h1 className="text-3xl font-semibold text-text">Solicitudes de Información</h1>
        <p className="text-muted mt-1">Gestiona las solicitudes de cotización de productos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.abandoned}</p>
                <p className="text-sm text-muted-foreground">Abandonados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.authenticated}</p>
                <p className="text-sm text-muted-foreground">Registrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.anonymous}</p>
                <p className="text-sm text-muted-foreground">Anónimos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-text">Todas las Solicitudes</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="abandoned">Abandonó el proceso</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={authFilter} onValueChange={setAuthFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tipo usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="authenticated">Registrados</SelectItem>
                  <SelectItem value="anonymous">Anónimos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right hidden md:table-cell">Total EUR</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Volumen</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="text-sm">
                    {new Date(request.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {request.product?.name || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{request.email}</TableCell>
                  <TableCell className="text-right text-sm">
                    {request.quantity || "—"}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell text-sm font-medium">
                    {request.calculation_snapshot?.breakdown?.total != null ? formatCurrency(request.calculation_snapshot.breakdown.total) : "—"}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-sm">
                    {formatVolume(request.calculation_snapshot?.breakdown?.total_volume_m3)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={request.is_authenticated ? "default" : "secondary"}>
                      {request.is_authenticated ? "Registrado" : "Anónimo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={request.status}
                      onValueChange={(value) => updateRequestStatus(request.id, value)}
                    >
                      <SelectTrigger className="w-36">
                        <Badge
                          variant={getStatusBadgeVariant(request.status)}
                          className={request.status === "abandoned" ? "border-amber-500 text-amber-700 bg-amber-50" : ""}
                        >
                          {getStatusLabel(request.status)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="abandoned">Abandonó el proceso</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
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

          {filteredRequests.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No se encontraron solicitudes
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground/70 mb-1">ID de Solicitud</p>
                <p className="font-mono text-sm">{selectedRequest.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Producto</p>
                  <p className="font-medium">{selectedRequest.product?.name || "—"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.product?.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Tipo de Usuario</p>
                  <Badge variant={selectedRequest.is_authenticated ? "default" : "secondary"}>
                    {selectedRequest.is_authenticated ? "Usuario Registrado" : "Usuario Anónimo"}
                  </Badge>
                </div>
              </div>

              {/* Quote Details: Quantity, Total, Volume */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Cantidad</p>
                  <p className="text-lg font-bold">{selectedRequest.quantity || "—"} uds</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Total EUR</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(selectedRequest.calculation_snapshot?.breakdown?.total)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Volumen</p>
                  <p className="text-lg font-bold">
                    {formatVolume(selectedRequest.calculation_snapshot?.breakdown?.total_volume_m3)}
                  </p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Notas del Cliente</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.is_authenticated && selectedRequest.profile && (
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Empresa/Nombre</p>
                  <p className="font-medium">
                    {selectedRequest.profile.company_name || selectedRequest.profile.full_name || "—"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Email</p>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Teléfono</p>
                  <p className="font-medium">{selectedRequest.mobile_phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">NIF/CIF/VAT-ID</p>
                  <p className="font-medium">{selectedRequest.tax_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Código Postal</p>
                  <p className="font-medium">{selectedRequest.postal_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Estado</p>
                  <Badge
                    variant={getStatusBadgeVariant(selectedRequest.status)}
                    className={selectedRequest.status === "abandoned" ? "border-amber-500 text-amber-700 bg-amber-50" : ""}
                  >
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Fecha de Solicitud</p>
                  <p className="font-medium">
                    {new Date(selectedRequest.created_at).toLocaleString("es-ES")}
                  </p>
                </div>
              </div>

              {selectedRequest.admin_notes && (
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">Notas del Admin</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.admin_notes}</p>
                </div>
              )}

              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedRequest.email}`, "_blank")}
                >
                  Enviar Email
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`https://wa.me/${selectedRequest.mobile_phone.replace(/[^0-9+]/g, "")}`, "_blank")}
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperadminQuoteRequests;

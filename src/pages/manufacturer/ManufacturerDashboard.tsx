import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Package, ShoppingCart, AlertCircle, FileText, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { handleError } from "@/lib/errorHandler";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  inProductionOrders: number;
  pendingProducts: number;
  activeProducts: number;
  missingDocs: number;
  delayedOrders: number;
}

interface RecentOrder {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  products: { name: string } | null;
  profiles: { full_name: string; company_name: string } | null;
}

const ManufacturerDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    inProductionOrders: 0,
    pendingProducts: 0,
    activeProducts: 0,
    missingDocs: 0,
    delayedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch orders stats
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*, products(name), profiles!orders_buyer_id_fkey(full_name, company_name)")
        .eq("manufacturer_id", user!.id);

      if (ordersError) throw ordersError;

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
      const confirmedOrders = orders?.filter((o) => o.status === "confirmed").length || 0;
      const inProductionOrders = orders?.filter((o) => o.status === "in_production").length || 0;

      // Check for delayed orders (status in_production for more than 30 days)
      const now = new Date();
      const delayedOrders =
        orders?.filter((o) => {
          if (o.status !== "in_production") return false;
          const updatedAt = new Date(o.updated_at);
          const daysDiff = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff > 30;
        }).length || 0;

      // Fetch products stats
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, status, certifications, technical_docs")
        .eq("manufacturer_id", user!.id);

      if (productsError) throw productsError;

      const pendingProducts = products?.filter((p) => p.status === "pending").length || 0;
      const activeProducts = products?.filter((p) => p.status === "active").length || 0;

      // Check for missing docs
      const missingDocs =
        products?.filter((p) => {
          const certs = p.certifications ? (typeof p.certifications === "string" ? JSON.parse(p.certifications) : p.certifications) : [];
          const docs = p.technical_docs ? (typeof p.technical_docs === "string" ? JSON.parse(p.technical_docs) : p.technical_docs) : [];
          return certs.length === 0 || docs.length === 0;
        }).length || 0;

      setStats({
        totalOrders,
        pendingOrders,
        confirmedOrders,
        inProductionOrders,
        pendingProducts,
        activeProducts,
        missingDocs,
        delayedOrders,
      });

      // Recent orders (last 5)
      setRecentOrders((orders || []).slice(0, 5) as RecentOrder[]);
    } catch (error: any) {
      const message = handleError("Dashboard data fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      confirmed: "default",
      in_production: "default",
      in_shipping: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      in_production: "En Producción",
      in_shipping: "Enviando",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard de Fabricante</h1>
          <p className="text-muted-foreground mt-1">
            Vista general de tu actividad y productos
          </p>
        </div>

        {/* Verification Status Alert */}
        {!profile?.is_verified && (
          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                Cuenta No Verificada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tu cuenta debe ser verificada por el administrador antes de poder cargar productos. 
                Asegúrate de completar tu perfil con toda la documentación requerida.
              </p>
              <Button onClick={() => navigate("/manufacturer/profile")} size="sm">
                Completar Perfil
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Recibidos</CardTitle>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.pendingOrders} pendientes, {stats.confirmedOrders} confirmados
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Productos</CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProducts}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.pendingProducts} en revisión
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Docs Pendientes</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.missingDocs}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Productos sin documentación completa
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delayedOrders}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Pedidos con retrasos (&gt;30 días)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Breakdown */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pedidos por Estado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pendientes</span>
                <Badge variant="secondary">{stats.pendingOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Confirmados</span>
                <Badge variant="default">{stats.confirmedOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">En Producción</span>
                <Badge variant="default">{stats.inProductionOrders}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentación Pendiente</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.missingDocs > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Tienes {stats.missingDocs} producto(s) sin certificaciones o documentos técnicos completos.
                  </p>
                  <Button onClick={() => navigate("/manufacturer/products")} variant="outline" size="sm">
                    Ver Productos
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  ✓ Todos tus productos tienen la documentación completa
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {order.profiles?.company_name || order.profiles?.full_name || "—"}
                      </TableCell>
                      <TableCell>{order.products?.name || "—"}</TableCell>
                      <TableCell className="text-right">{order.quantity}</TableCell>
                      <TableCell className="text-right">€{order.total_price.toFixed(2)}</TableCell>
                      <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay pedidos recientes
              </p>
            )}
            {recentOrders.length > 0 && (
              <div className="mt-4 text-center">
                <Button onClick={() => navigate("/manufacturer/orders")} variant="outline" size="sm">
                  Ver Todos los Pedidos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManufacturerDashboard;

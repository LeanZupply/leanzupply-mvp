import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  Clock,
  CheckCircle2
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { handleError } from "@/lib/errorHandler";

interface DashboardStats {
  totalOrders: number;
  pendingPayments: number;
  completedOrders: number;
  inProgressOrders: number;
  totalSpent: number;
}

interface RecentOrder {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  product: { name: string } | null;
}

const BuyerDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingPayments: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    totalSpent: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      trackEvent("dashboard_viewed", { role: "buyer" });
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          quantity,
          total_price,
          status,
          payment_status,
          created_at,
          product:products(name)
        `)
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const pendingPayments = orders?.filter((o) => o.payment_status === "pending").length || 0;
      const completedOrders = orders?.filter((o) => o.status === "delivered").length || 0;
      const inProgressOrders = orders?.filter(
        (o) => o.status !== "delivered" && o.status !== "cancelled"
      ).length || 0;
      const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

      setStats({
        totalOrders,
        pendingPayments,
        completedOrders,
        inProgressOrders,
        totalSpent,
      });

      setRecentOrders((orders?.slice(0, 5) || []) as RecentOrder[]);
    } catch (error) {
      handleError("Dashboard data fetch", error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats.totalOrders > 0
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: "bg-green-100 text-green-800 border-green-200",
      in_shipping: "bg-blue-100 text-blue-800 border-blue-200",
      in_production: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pending: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      delivered: "Entregado",
      in_shipping: "En tránsito",
      in_production: "En producción",
      pending: "Pendiente",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Resumen de tus operaciones y pedidos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.inProgressOrders} en progreso
            </p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Pendientes</CardTitle>
            <DollarSign className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-2">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
            <Package className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground mt-2">Entregados con éxito</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invertido</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              €{stats.totalSpent.toLocaleString("es-ES")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Histórico de compras</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm md:text-base text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
            Progreso de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-xs md:text-sm mb-3">
              <span className="text-muted-foreground">Tasa de Completación</span>
              <span className="font-semibold text-foreground">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-6 pt-4 border-t border-border">
            <div className="text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <p className="text-xs md:text-sm text-muted-foreground">Completados</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stats.completedOrders}</p>
            </div>
            <div className="text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 mb-2">
                <Clock className="h-4 w-4 text-warning" />
                <p className="text-xs md:text-sm text-muted-foreground">En Progreso</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stats.inProgressOrders}</p>
            </div>
            <div className="text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stats.totalOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Pedidos Recientes</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/buyer/orders")}
          >
            Ver todos <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate("/buyer/orders")}
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{order.product?.name || "Producto"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.quantity} unidades • €{Number(order.total_price).toLocaleString("es-ES")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} border`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No tienes pedidos aún. Explora el catálogo para comenzar.
              </p>
              <Button onClick={() => navigate("/buyer/catalog")}>
                Ver Catálogo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerDashboard;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, ShoppingCart, CheckCircle, MapPin, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/errorHandler";
import { formatNumber } from "@/lib/formatters";

interface Stats {
  totalUsers: number;
  verifiedManufacturers: number;
  activeProducts: number;
  activeOrders: number;
}

interface OrdersByMonth {
  month: string;
  count: number;
}

interface TopViewedProduct {
  product_id: string;
  product_name: string;
  manufacturer_name: string;
  views_count: number;
  category: string;
  price_unit: number;
}

interface UsersByCity {
  city: string;
  total_users: number;
  manufacturers: number;
  buyers: number;
}

const SuperadminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ordersChart, setOrdersChart] = useState<OrdersByMonth[]>([]);
  const [topProducts, setTopProducts] = useState<TopViewedProduct[]>([]);
  const [usersByCity, setUsersByCity] = useState<UsersByCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Verified manufacturers
      const { data: manufacturers } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("role", "manufacturer")
        .eq("is_verified", true);

      // Active products
      const { count: activeProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Active orders
      const { count: activeOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .neq("status", "cancelled");

      // Top viewed products
      const { data: topProductsData } = await supabase
        .rpc('get_top_viewed_products', { limit_count: 10 });

      // Users by city
      const { data: usersByCityData } = await supabase
        .rpc('get_users_by_city');

      setStats({
        totalUsers: totalUsers || 0,
        verifiedManufacturers: manufacturers?.length || 0,
        activeProducts: activeProducts || 0,
        activeOrders: activeOrders || 0,
      });

      setTopProducts(topProductsData || []);
      setUsersByCity((usersByCityData || []).slice(0, 15));

      // Orders by month (last 6 months)
      const { data: orders } = await supabase
        .from("orders")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (orders) {
        const monthCounts: { [key: string]: number } = {};
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        });

        last6Months.forEach((month) => (monthCounts[month] = 0));

        orders.forEach((order) => {
          const month = new Date(order.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          if (monthCounts[month] !== undefined) {
            monthCounts[month]++;
          }
        });

        setOrdersChart(
          last6Months.map((month) => ({
            month,
            count: monthCounts[month],
          }))
        );
      }
    } catch (error) {
      handleError("Dashboard data fetch", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Usuarios Totales",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Fabricantes Verificados",
      value: stats?.verifiedManufacturers || 0,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Productos Activos",
      value: stats?.activeProducts || 0,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Órdenes Activas",
      value: stats?.activeOrders || 0,
      icon: ShoppingCart,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Resumen General</h1>
        <p className="text-muted-foreground mt-1">Métricas y actividad de la plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Órdenes en el Tiempo</CardTitle>
          <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersChart}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-muted" />
              <YAxis className="text-muted" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Viewed Products */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Productos Más Visitados (Top 10)
          </CardTitle>
          <p className="text-sm text-muted-foreground">Los productos con más visualizaciones</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-muted-foreground w-8">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-foreground">{product.product_name}</p>
                      <p className="text-sm text-muted-foreground">{product.manufacturer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{product.category}</Badge>
                    <div className="text-right">
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {product.views_count} vistas
                      </p>
                      <p className="text-sm text-muted-foreground">€{formatNumber(product.price_unit)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay datos de productos visitados</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users by City */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Usuarios por Ciudad (Top 15)
          </CardTitle>
          <p className="text-sm text-muted-foreground">Distribución geográfica de usuarios</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={usersByCity}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="city" 
                angle={-45} 
                textAnchor="end" 
                height={120}
                className="text-muted text-xs"
              />
              <YAxis className="text-muted" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="total_users" fill="hsl(var(--primary))" name="Total Usuarios" radius={[8, 8, 0, 0]} />
              <Bar dataKey="manufacturers" fill="hsl(var(--accent))" name="Fabricantes" radius={[8, 8, 0, 0]} />
              <Bar dataKey="buyers" fill="hsl(var(--secondary))" name="Compradores" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperadminOverview;

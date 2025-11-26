import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  Award,
  RefreshCw,
  Activity,
  Tag,
  CalendarIcon,
} from "lucide-react";
import { 
  BarChart as RechartsBarChart, 
  ResponsiveContainer, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const COLORS = [
  "hsl(var(--primary))", 
  "hsl(var(--accent))", 
  "hsl(221, 83%, 53%)", 
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 87%, 65%)",
];

interface DashboardStats {
  users: {
    total_users: number;
    total_manufacturers: number;
    total_buyers: number;
    total_superadmins: number;
  };
  products: {
    total_products: number;
    active_products: number;
    pending_products: number;
    rejected_products: number;
  };
  orders: {
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    total_income: number;
    avg_order_value: number;
  };
  categories: {
    total_categories: number;
  };
  topProducts: Array<{ name: string; total_orders: number; total_revenue: number }>;
  productsByCategory: Array<{ category: string; count: number }>;
  topManufacturers: Array<{ name: string; total_products: number; total_sales: number; total_orders: number }>;
  ordersByCountry: Array<{ country: string; total_orders: number; total_amount: number }>;
  recentActivity: Array<{ action: string; entity: string; created_at: string; user_email: string }>;
}

export default function SuperadminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
    to: new Date(),
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]); // Re-fetch cuando cambie el rango de fechas

  const fetchAnalytics = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Preparar fechas para las queries
      const startDate = dateRange?.from ? dateRange.from.toISOString() : null;
      const endDate = dateRange?.to ? dateRange.to.toISOString() : null;

      // Fetch all statistics in parallel using RPC functions
      const [
        usersResult,
        productsResult,
        ordersResult,
        categoriesResult,
        topProductsResult,
        productsByCategoryResult,
        topManufacturersResult,
        ordersByCountryResult,
        recentActivityResult,
      ] = await Promise.all([
        supabase.rpc('get_users_stats'),
        supabase.rpc('get_products_stats'),
        supabase.rpc('get_orders_stats', { p_start_date: startDate, p_end_date: endDate }),
        supabase.rpc('get_categories_stats'),
        supabase.rpc('get_top_products', { limit_count: 5, p_start_date: startDate, p_end_date: endDate }),
        supabase.rpc('get_products_by_category'),
        supabase.rpc('get_top_manufacturers', { p_start_date: startDate, p_end_date: endDate }),
        supabase.rpc('get_orders_by_country', { p_start_date: startDate, p_end_date: endDate }),
        supabase.rpc('get_recent_activity'),
      ]);

      // Check for errors
      if (usersResult.error) throw usersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (topProductsResult.error) throw topProductsResult.error;
      if (productsByCategoryResult.error) throw productsByCategoryResult.error;
      if (topManufacturersResult.error) throw topManufacturersResult.error;
      if (ordersByCountryResult.error) throw ordersByCountryResult.error;
      if (recentActivityResult.error) throw recentActivityResult.error;

      setStats({
        users: usersResult.data[0],
        products: productsResult.data[0],
        orders: ordersResult.data[0],
        categories: categoriesResult.data[0],
        topProducts: topProductsResult.data || [],
        productsByCategory: productsByCategoryResult.data || [],
        topManufacturers: topManufacturersResult.data || [],
        ordersByCountry: ordersByCountryResult.data || [],
        recentActivity: recentActivityResult.data || [],
      });

      setLastUpdated(new Date());
      
      if (isAutoRefresh) {
        toast.success("Datos actualizados automáticamente");
      }
    } catch (err) {
      const message = handleError("Analytics fetch", err);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchAnalytics(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Análisis y Reportes</h1>
          <p className="text-muted-foreground mt-1">
            Métricas globales de la plataforma en tiempo real
          </p>
          {dateRange?.from && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                Período: {format(dateRange.from, "dd/MM/yyyy")} 
                {dateRange.to && ` - ${format(dateRange.to, "dd/MM/yyyy")}`}
              </span>
            </p>
          )}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Última actualización: {format(lastUpdated, "dd/MM/yyyy HH:mm:ss")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Seleccionar período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Overview Cards - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios Registrados
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.users.total_users}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.users.total_manufacturers} fabricantes · {stats.users.total_buyers} compradores
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.products.total_products}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.products.active_products} activos · {stats.products.pending_products} pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Órdenes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.orders.total_orders}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.orders.completed_orders} completadas · {stats.orders.pending_orders} pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorías
            </CardTitle>
            <Tag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.categories.total_categories}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Categorías de productos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              €{Number(stats.orders.total_income).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              De órdenes completadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Promedio por Orden
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              €{Number(stats.orders.avg_order_value).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Promedio de ticket
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Fabricantes
            </CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {stats.topManufacturers.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Fabricantes destacados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actividad Reciente
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {stats.recentActivity.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Acciones registradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top 5 Productos por Órdenes</CardTitle>
            <p className="text-sm text-muted-foreground">Productos más solicitados</p>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--surface))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'total_revenue') {
                        return [`€${Number(value).toLocaleString('es-ES')}`, 'Ingresos'];
                      }
                      return [value, name === 'total_orders' ? 'Órdenes' : name];
                    }}
                  />
                  <Bar dataKey="total_orders" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  No hay datos de productos aún
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Productos por Categoría</CardTitle>
            <p className="text-sm text-muted-foreground">Distribución de productos activos</p>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats.productsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.productsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) =>
                      `${category} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="hsl(var(--accent))"
                    dataKey="count"
                  >
                    {stats.productsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--surface))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  No hay productos activos aún
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top 5 Fabricantes por Ventas</CardTitle>
            <p className="text-sm text-muted-foreground">Fabricantes con mayores ingresos</p>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats.topManufacturers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats.topManufacturers}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="name" 
                    angle={-15} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    stroke="hsl(var(--primary))"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--accent))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--surface))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'total_sales') {
                        return [`€${Number(value).toLocaleString('es-ES')}`, 'Ventas'];
                      }
                      return [value, name === 'total_products' ? 'Productos' : name];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_products" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Productos" />
                  <Bar yAxisId="right" dataKey="total_sales" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} name="Ventas (€)" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  No hay fabricantes con productos activos
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Órdenes por País</CardTitle>
            <p className="text-sm text-muted-foreground">Distribución geográfica de órdenes</p>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats.ordersByCountry.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats.ordersByCountry}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--surface))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'total_amount') {
                        return [`€${Number(value).toLocaleString('es-ES')}`, 'Monto Total'];
                      }
                      return [value, name === 'total_orders' ? 'Órdenes' : name];
                    }}
                  />
                  <Bar dataKey="total_orders" fill="hsl(142, 71%, 45%)" radius={[8, 8, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  No hay órdenes registradas aún
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
          <p className="text-sm text-muted-foreground">Últimas 10 acciones en la plataforma</p>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.entity} · {activity.user_email}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {format(new Date(activity.created_at), "dd/MM HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay actividad reciente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TrendingUp, Eye, MousePointer, UserPlus, ShoppingCart, CreditCard, CheckCircle } from "lucide-react";

interface FunnelStep {
  step: string;
  count: number;
  conversion_rate: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  view_count: number;
}

export default function SuperadminFunnel() {
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch funnel analytics
      const { data: funnelResponse, error: funnelError } = await supabase
        .rpc('get_order_funnel_analytics');

      if (funnelError) throw funnelError;
      setFunnelData(funnelResponse || []);

      // Fetch top products
      const { data: productsResponse, error: productsError } = await supabase
        .rpc('get_most_viewed_products_tracking', { limit_count: 10 });

      if (productsError) throw productsError;
      setTopProducts(productsResponse || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Error al cargar analytics");
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'viewed':
        return <Eye className="h-5 w-5" />;
      case 'added_to_pallet':
        return <ShoppingCart className="h-5 w-5" />;
      case 'requested':
        return <MousePointer className="h-5 w-5" />;
      case 'pending_confirmation':
        return <UserPlus className="h-5 w-5" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'paid':
        return <CreditCard className="h-5 w-5" />;
      case 'shipped':
        return <TrendingUp className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getStepName = (step: string) => {
    const names: Record<string, string> = {
      viewed: 'Producto Visto',
      added_to_pallet: 'Agregado al Pallet',
      requested: 'Pedido Solicitado',
      pending_confirmation: 'Pendiente de Confirmación',
      confirmed: 'Pedido Confirmado',
      paid: 'Pagado',
      shipped: 'Enviado',
      delivered: 'Entregado',
    };
    return names[step] || step;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const totalViews = funnelData.find(f => f.step === 'viewed')?.count || 0;
  const totalOrders = funnelData.find(f => f.step === 'delivered')?.count || 0;
  const overallConversion = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(2) : '0.00';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Funnel de Conversión</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Conversión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{overallConversion}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topProducts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Embudo de Conversión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((step, index) => {
              const prevStep = index > 0 ? funnelData[index - 1] : null;
              const dropoffRate = prevStep 
                ? (((prevStep.count - step.count) / prevStep.count) * 100).toFixed(1)
                : '0';

              return (
                <div key={step.step} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {getStepIcon(step.step)}
                      </div>
                      <div>
                        <p className="font-semibold">{getStepName(step.step)}</p>
                        <p className="text-xs text-muted-foreground">
                          {step.count.toLocaleString()} usuarios • {step.conversion_rate}% del total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{step.count.toLocaleString()}</p>
                      {prevStep && (
                        <p className="text-xs text-red-600">
                          -{dropoffRate}% abandono
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${step.conversion_rate}%` }}
                    />
                  </div>

                  {index < funnelData.length - 1 && (
                    <div className="flex justify-center">
                      <div className="w-px h-4 bg-border" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Visitados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={product.product_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {product.product_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{product.view_count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">vistas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
  Package,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { BankTransferModal } from "@/components/buyer/BankTransferModal";

interface Order {
  id: string;
  order_reference: string;
  total_price: number;
  payment_status: string;
  status: string;
  created_at: string;
  buyer_id: string;
  buyer_info_snapshot?: {
    company_name?: string;
    full_name?: string;
  } | null;
}

export default function PaymentInstructions() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Check if we should show the modal automatically
  const showModalOnLoad = searchParams.get("showModal") === "true";

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    fetchOrder();
  }, [user, orderId]);

  useEffect(() => {
    if (order && showModalOnLoad && !confirmed) {
      setShowBankModal(true);
    }
  }, [order, showModalOnLoad, confirmed]);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_reference, total_price, payment_status, status, created_at, buyer_id, buyer_info_snapshot")
        .eq("id", orderId)
        .single();

      if (error) throw error;

      // Security check: ensure the order belongs to the current user
      if (data.buyer_id !== user?.id) {
        toast.error("No tienes permiso para ver este pedido");
        navigate("/buyer/orders");
        return;
      }

      setOrder(data);

      // Check if payment was already confirmed
      if (data.payment_status === "awaiting_transfer") {
        setConfirmed(true);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Error al cargar el pedido");
      navigate("/buyer/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!order) return;

    try {
      // Update order payment status
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "awaiting_transfer" })
        .eq("id", order.id);

      if (error) throw error;

      setConfirmed(true);
      setShowBankModal(false);
      toast.success("Gracias por confirmar. Esperamos tu comprobante de pago.");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error al confirmar. Por favor intenta de nuevo.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {confirmed
              ? "Gracias por tu compromiso de pago"
              : "Pedido creado correctamente"}
          </h1>
          <p className="text-muted-foreground">
            {confirmed
              ? "Aguardamos el comprobante de transferencia"
              : "Completa el pago para confirmar tu pedido"}
          </p>
        </div>

        {/* Order Reference Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Referencia</span>
              <span className="font-mono font-bold text-lg text-primary">
                {order.order_reference || order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Importe total</span>
              <span className="font-bold text-xl">
                EUR{" "}
                {order.total_price.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estado</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  confirmed
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                }`}
              >
                {confirmed ? "Pendiente de comprobante" : "Pendiente de pago"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Message or Next Steps */}
        {confirmed ? (
          <Card className="mb-6 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Importante: Sube tu comprobante de pago
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Tu pedido queda en estado pendiente de pago. Si no subes el comprobante de
                    transferencia en <strong>48 horas laborales</strong>, el pedido sera
                    cancelado automaticamente.
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Puedes subir el comprobante desde la seccion "Mis Pedidos".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-primary/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Siguiente paso: Realizar el pago</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el boton para ver las instrucciones de transferencia
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowBankModal(true)}
              >
                Ver instrucciones de pago
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* What happens next */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Que sucede despues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Realiza la transferencia</h4>
                  <p className="text-sm text-muted-foreground">
                    Usa los datos bancarios proporcionados e incluye la referencia del pedido
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Sube el comprobante</h4>
                  <p className="text-sm text-muted-foreground">
                    Ve a "Mis Pedidos" y sube el comprobante de la transferencia (PDF, JPG, PNG)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Confirmacion del pago</h4>
                  <p className="text-sm text-muted-foreground">
                    Verificaremos el pago y confirmaremos tu pedido en menos de 24 horas
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Seguimiento del pedido</h4>
                  <p className="text-sm text-muted-foreground">
                    Podras seguir el estado de tu pedido desde tu panel de comprador
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/buyer/orders")}>
            <FileText className="h-4 w-4 mr-2" />
            Ver mis pedidos
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/buyer/catalog")}>
            <Package className="h-4 w-4 mr-2" />
            Seguir comprando
          </Button>
        </div>
      </div>

      {/* Bank Transfer Modal */}
      <BankTransferModal
        open={showBankModal}
        onClose={() => setShowBankModal(false)}
        onConfirm={handleConfirmTransfer}
        orderReference={order.order_reference || order.id.slice(0, 8).toUpperCase()}
        totalAmount={order.total_price}
        clientName={order.buyer_info_snapshot?.company_name || order.buyer_info_snapshot?.full_name || ""}
      />
    </div>
  );
}

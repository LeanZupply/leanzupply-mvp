import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, Clock, MessageSquare } from "lucide-react";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Add confetti effect or animation here if desired
    document.title = "Pedido Confirmado - Leanzupply";
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">¡Pedido Recibido!</h1>
          <p className="text-xl text-muted-foreground">
            Gracias por tu confianza
          </p>
        </div>

        {/* Main Message Card */}
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">
                Tu pedido ha sido enviado correctamente y está siendo procesado.
              </p>
              {orderId && (
                <p className="text-sm text-muted-foreground">
                  ID de pedido: <span className="font-mono font-semibold">{orderId}</span>
                </p>
              )}
            </div>

            {/* What Happens Next */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h2 className="font-semibold text-lg mb-4">¿Qué sucede ahora?</h2>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Revisión del pedido</h3>
                    <p className="text-sm text-muted-foreground">
                      Nuestro equipo revisará tu solicitud y verificará la disponibilidad del producto en las próximas 24 horas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Te contactaremos</h3>
                    <p className="text-sm text-muted-foreground">
                      Un representante se pondrá en contacto contigo para confirmar los detalles, coordinar el pago y el envío.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Seguimiento en tiempo real</h3>
                    <p className="text-sm text-muted-foreground">
                      Podrás ver el estado de tu pedido y recibir notificaciones sobre cada etapa del proceso.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-center">
                Si tienes alguna pregunta, puedes contactarnos en{" "}
                <a href="mailto:soporte@leanzupply.com" className="font-semibold text-primary hover:underline">
                  soporte@leanzupply.com
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => navigate("/buyer/orders")}
                className="flex-1"
                size="lg"
              >
                <Package className="h-4 w-4 mr-2" />
                Ver Mis Pedidos
              </Button>
              <Button
                onClick={() => navigate("/buyer/catalog")}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Seguir Explorando
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Notification Notice */}
        <p className="text-center text-sm text-muted-foreground">
          También te hemos enviado un correo de confirmación con todos los detalles de tu pedido.
        </p>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Package } from "lucide-react";
import { trackContactClick } from "@/lib/gtmEvents";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    document.title = "Solicitud Recibida - LeanZupply";
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        {/* Warning Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <AlertTriangle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">¡Solicitud Recibida!</h1>
          <p className="text-xl text-muted-foreground">
            Gracias por el interés, estás en buenas manos.
          </p>
        </div>

        {/* Main Message Card */}
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">
                Hemos registrado tu solicitud y nuestro equipo verificará disponibilidad, condiciones de fabricación y costes logísticos con los proveedores correspondiente.
              </p>
              {orderId && (
                <p className="text-sm text-muted-foreground">
                  ID de solicitud: <span className="font-mono font-semibold">{orderId}</span>
                </p>
              )}
            </div>

            {/* IMPORTANTE Section */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 space-y-4">
              <h2 className="font-bold text-lg text-amber-900 dark:text-amber-100">IMPORTANTE:</h2>

              <p className="text-amber-800 dark:text-amber-200">
                Este registro <strong>no constituye una compraventa confirmada</strong>.
              </p>

              <div className="space-y-2">
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                  La operación se considerará formalizada una vez que:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-amber-800 dark:text-amber-200 ml-2">
                  <li>El fabricante valide precio, disponibilidad y plazo;</li>
                  <li>LeanZupply envíe una propuesta final;</li>
                  <li>De su parte debe aceptar esta propuesta y realizar el pago según instrucciones.</li>
                </ol>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-center">
                Si tienes alguna consulta, puedes contactarnos en{" "}
                <a
                  href="mailto:soporte@leanzupply.com"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => trackContactClick("email", "soporte@leanzupply.com")}
                >
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
      </div>
    </div>
  );
}

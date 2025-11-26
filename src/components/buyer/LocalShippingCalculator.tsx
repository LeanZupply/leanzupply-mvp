import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Package, TrendingUp, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { calculateLocalShipping, isSpanishPostalCode, LocalShippingCalculation } from "@/lib/localShippingCalculator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LocalShippingCalculatorProps {
  totalVolumeM3: number;
  onCalculationComplete?: (calculation: LocalShippingCalculation | null) => void;
  className?: string;
}

export function LocalShippingCalculator({
  totalVolumeM3,
  onCalculationComplete,
  className,
}: LocalShippingCalculatorProps) {
  const [postalCode, setPostalCode] = useState("");
  const [calculation, setCalculation] = useState<LocalShippingCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postalCode || postalCode.length < 4) {
      setCalculation(null);
      setError(null);
      if (onCalculationComplete) onCalculationComplete(null);
      return;
    }

    if (!isSpanishPostalCode(postalCode) && postalCode.length >= 5) {
      setError("Código postal no válido para España");
      setCalculation(null);
      if (onCalculationComplete) onCalculationComplete(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (postalCode.length >= 5) {
        await performCalculation();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [postalCode, totalVolumeM3]);

  const performCalculation = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await calculateLocalShipping(postalCode, totalVolumeM3);
      
      if (!result.zone) {
        setError("No se encontró una zona de envío para este código postal");
        setCalculation(null);
        if (onCalculationComplete) onCalculationComplete(null);
      } else {
        setCalculation(result);
        if (onCalculationComplete) onCalculationComplete(result);
      }
    } catch (err: any) {
      console.error("[LocalShippingCalculator] Error:", err);
      setError("Error al calcular envío local");
      setCalculation(null);
      if (onCalculationComplete) onCalculationComplete(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Envío Local (España)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Postal Code Input */}
          <div className="space-y-2">
            <Label htmlFor="postal-code">Código Postal de Entrega</Label>
            <Input
              id="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="28001"
              maxLength={5}
              className="font-mono"
            />
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Volume Info */}
          <div className="bg-muted/50 border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Volumen total del pedido:</span>
            </div>
            <span className="font-semibold">{totalVolumeM3.toFixed(3)} m³</span>
          </div>

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {calculation && !loading && (
            <>
              <Separator />

              {/* Zone Detection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <h4 className="font-semibold">Zona Detectada</h4>
                </div>
                <div className="pl-6 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{calculation.breakdown.zone_name}</span>
                    <Badge variant="default">{calculation.postal_code}</Badge>
                  </div>
                  {calculation.breakdown.zone_description && (
                    <p className="text-xs text-muted-foreground">{calculation.breakdown.zone_description}</p>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Tarifa base de zona:</span>
                    <span className="font-semibold">{formatCurrency(calculation.zone_price)}</span>
                  </div>
                </div>
              </div>

              {/* Volume Surcharge */}
              {calculation.volume_surcharge && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Recargo por Volumen</h4>
                    </div>
                    <div className="pl-6 space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Rango aplicable:</span>
                        <Badge variant="secondary">{calculation.breakdown.volume_range}</Badge>
                      </div>
                      {calculation.volume_surcharge.description && (
                        <p className="text-xs text-muted-foreground">{calculation.volume_surcharge.description}</p>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-medium">Recargo:</span>
                        <span className="font-semibold">{formatCurrency(calculation.surcharge_amount)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-primary/20" />

              {/* Total */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold">Total Envío Local:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(calculation.total_local_shipping)}
                </span>
              </div>

              {/* Important Notice */}
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <AlertDescription className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  <span className="font-bold block mb-1">⚠️ ATENCIÓN:</span>
                  No incluye ingreso en el local comercial, tienda, oficina o nave, sólo transporte desde el puerto español hasta descarga a pie de calle del domicilio.
                </AlertDescription>
              </Alert>

              {/* Quote Required Alert */}
              {calculation.requires_quote && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Cotización Manual Requerida:</strong> Debido al volumen del pedido, 
                    nuestro equipo comercial te contactará para confirmar el costo final del envío.
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Cálculo automático basado en zona y volumen • IVA incluido
              </p>
            </>
          )}

          {!calculation && !loading && postalCode.length >= 5 && !error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ingresa un código postal válido para calcular el costo de envío
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

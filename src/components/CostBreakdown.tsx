import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, Ship, DollarSign, Percent, Info, Clock, AlertTriangle, Package, Truck, Anchor, FileCheck, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";
interface CostBreakdownProps {
  // Modo legacy (valores precalculados)
  priceUnit?: number;
  quantity?: number;
  volumeM3?: number | null;
  freightCostPerM3?: number | null;
  originExpenses?: number | null;
  marineInsurancePercentage?: number | null;
  destinationExpenses?: number | null;
  localDeliveryCost?: number | null;
  tariffPercentage?: number | null;
  vatPercentage?: number | null;
  shippingCostTotal?: number | null;
  cifValue?: number | null;
  marineInsuranceCost?: number | null;
  taxableBase?: number | null;
  tariffCost?: number | null;
  vatCost?: number | null;
  totalCostWithTaxes?: number | null;
  className?: string;

  // Modo tiempo real (nueva funcionalidad)
  productId?: string;
  destinationCountry?: string;
  destinationPort?: string;
  originPort?: string;
  realTime?: boolean;
  onCalculationComplete?: (calculation: any) => void;
}
export const CostBreakdown = ({
  priceUnit = 0,
  quantity = 1,
  volumeM3 = null,
  freightCostPerM3 = null,
  originExpenses = null,
  marineInsurancePercentage = null,
  destinationExpenses = null,
  localDeliveryCost = null,
  tariffPercentage = null,
  vatPercentage = null,
  shippingCostTotal = null,
  cifValue = null,
  marineInsuranceCost = null,
  taxableBase = null,
  tariffCost = null,
  vatCost = null,
  totalCostWithTaxes = null,
  className,
  productId,
  destinationCountry = "spain",
  destinationPort,
  originPort,
  realTime = false,
  onCalculationComplete
}: CostBreakdownProps) => {
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  // Calcular en tiempo real si está habilitado
  useEffect(() => {
    if (!realTime || !productId || !quantity) return;
    const calculateCosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data,
          error: functionError
        } = await supabase.functions.invoke('calculate-logistics-costs', {
          body: {
            product_id: productId,
            quantity,
            destination_country: destinationCountry,
            destination_port: destinationPort,
            origin_port: originPort
          }
        });
        if (functionError) throw functionError;
        if (!data.success) throw new Error(data.error);
        setCalculation(data.calculation);
        if (onCalculationComplete) {
          onCalculationComplete(data.calculation);
        }
      } catch (err: any) {
        console.error('[CostBreakdown] Error calculating costs:', err);
        setError(err.message || 'Error al calcular costos');
      } finally {
        setLoading(false);
      }
    };

    // Debounce para evitar múltiples llamadas
    const timer = setTimeout(calculateCosts, 300);
    return () => clearTimeout(timer);
  }, [productId, quantity, destinationCountry, destinationPort, originPort, realTime]);

  // Usar valores del cálculo en tiempo real o valores legacy
  const displayValues = calculation ? {
    priceUnit: calculation.breakdown.price_unit,
    quantity: calculation.quantity,
    discountApplied: calculation.breakdown.discount_applied,
    fob: calculation.breakdown.fob,
    freightBase: calculation.breakdown.freight_base,
    volumeSurcharge: calculation.breakdown.volume_surcharge || 0,
    freightCost: calculation.breakdown.freight,
    freightCostPerM3: calculation.parameters.freight_cost_per_m3,
    totalVolumeM3: calculation.breakdown.total_volume_m3,
    originExpenses: calculation.breakdown.origin_expenses,
    cif: calculation.breakdown.cif,
    insuranceCost: calculation.breakdown.insurance,
    insurancePercentage: calculation.parameters.marine_insurance_percentage,
    subtotalMaritimeShipping: calculation.breakdown.subtotal_maritime_shipping,
    destinationVariableTotal: calculation.breakdown.destination_variable_total,
    destinationVariableCostPerM3: calculation.parameters.destination_variable_cost,
    destinationFixedCost: calculation.breakdown.destination_fixed_cost,
    duaCost: calculation.breakdown.dua_cost,
    destinationExpenses: calculation.breakdown.destination_expenses,
    taxableBase: calculation.breakdown.taxable_base,
    tariffCost: calculation.breakdown.tariff,
    tariffPercentage: calculation.parameters.tariff_percentage,
    vatCost: calculation.breakdown.vat,
    vatPercentage: calculation.parameters.vat_percentage,
    subtotalShippingTaxes: calculation.breakdown.subtotal_shipping_taxes,
    subtotalIntImp: calculation.breakdown.subtotal_int_imp,
    totalWithoutTaxes: calculation.breakdown.total_without_taxes,
    buyerFee: calculation.breakdown.buyer_fee,
    buyerFeePercentage: calculation.breakdown.buyer_fee_percentage,
    totalCostWithTaxes: calculation.breakdown.total,
    shippingCostTotal: calculation.breakdown.freight + calculation.breakdown.insurance
  } : (() => {
    // Calcular todos los valores paso a paso en modo legacy
    const calcFob = priceUnit * quantity;
    const calcFreightCost = volumeM3 && freightCostPerM3 ? volumeM3 * freightCostPerM3 * quantity : 0;
    const calcOriginExpenses = originExpenses || 0;
    const calcCif = cifValue ? cifValue * quantity : calcFob + calcFreightCost + calcOriginExpenses;
    const calcInsuranceCost = marineInsuranceCost ? marineInsuranceCost * quantity : calcCif * ((marineInsurancePercentage || 0) / 100);
    const calcDestinationExpenses = destinationExpenses ? destinationExpenses * quantity : 0;
    const calcTaxableBase = taxableBase ? taxableBase * quantity : calcCif + calcInsuranceCost + calcDestinationExpenses;
    const calcTariffCost = tariffCost ? tariffCost * quantity : calcTaxableBase * ((tariffPercentage || 0) / 100);
    const calcVatCost = vatCost ? vatCost * quantity : (calcTaxableBase + calcTariffCost) * ((vatPercentage || 0) / 100);
    const calcTotalCostWithTaxes = totalCostWithTaxes ? totalCostWithTaxes * quantity : calcTaxableBase + calcTariffCost + calcVatCost;
    return {
      priceUnit,
      quantity,
      discountApplied: 0,
      fob: calcFob,
      freightCost: calcFreightCost,
      originExpenses: calcOriginExpenses,
      cif: calcCif,
      insuranceCost: calcInsuranceCost,
      destinationExpenses: calcDestinationExpenses,
      taxableBase: calcTaxableBase,
      tariffCost: calcTariffCost,
      tariffPercentage: tariffPercentage || 0,
      vatCost: calcVatCost,
      vatPercentage: vatPercentage || 0,
      totalCostWithTaxes: calcTotalCostWithTaxes,
      shippingCostTotal: shippingCostTotal ? shippingCostTotal * quantity : calcFreightCost + calcInsuranceCost
    };
  })();
  if (loading) {
    return <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Calculando costos...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className={`${className} border-destructive`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <DollarSign className="h-5 w-5" />
            Error en cálculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>;
  }
  return <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Desglose de Costos
            {realTime && calculation && <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Calculado en tiempo real</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(calculation.calculated_at).toLocaleString()}
                  </p>
                </TooltipContent>
              </Tooltip>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quantity indicator */}
          {quantity > 1 && <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium text-primary">
                Cálculo para {displayValues.quantity} unidades
              </p>
            </div>}

          {/* Base Price */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Precio base fábrica
            </h4>
            <div className="space-y-1 pl-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Precio unitario:</span>
                <span className="font-medium">{formatCurrency(displayValues.priceUnit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cantidad:</span>
                <span className="font-medium">{displayValues.quantity} unidades</span>
              </div>
              {displayValues.discountApplied > 0 && <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento aplicado:</span>
                  <span>-{displayValues.discountApplied}%</span>
                </div>}
              <div className="flex justify-between text-sm font-medium pt-1 border-t">
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <span>FOB (Free On Board):</span>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Precio del producto en puerto de origen</p>
                  </TooltipContent>
                </Tooltip>
                <span>{formatCurrency(displayValues.fob)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Collapsible: Coste envío internacional + impuestos */}
          {calculation && 'subtotalShippingTaxes' in displayValues && displayValues.subtotalShippingTaxes !== undefined ? (
            <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center py-2 bg-yellow-50 dark:bg-yellow-950/20 px-3 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`h-4 w-4 text-yellow-600 transition-transform ${breakdownOpen ? 'rotate-180' : ''}`} />
                    <span className="font-semibold text-yellow-800 dark:text-yellow-200">Coste envío internacional + impuestos:</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                    {formatCurrency(displayValues.subtotalShippingTaxes)}
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 pt-4">
                  {/* Shipping Costs */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Ship className="h-4 w-4" />
                      Costos de Envío
                    </h4>
                    <div className="space-y-1 pl-6">
                      <div className="flex justify-between text-sm">
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1">
                            <span className="text-muted-foreground">Transporte marítimo base:</span>
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {calculation?.transit_info ? `Tarifa para ${calculation.transit_info.origin_port} → ${calculation.transit_info.destination_port}` : 'Costo de transporte marítimo por volumen'}
                            </p>
                            {'totalVolumeM3' in displayValues && 'freightCostPerM3' in displayValues && displayValues.totalVolumeM3 && displayValues.freightCostPerM3 && <p className="text-xs">{formatNumber(displayValues.totalVolumeM3, 3, 3)} m³ × €{formatNumber(displayValues.freightCostPerM3)}/m³ = €{formatNumber(displayValues.totalVolumeM3 * displayValues.freightCostPerM3)}</p>}
                          </TooltipContent>
                        </Tooltip>
                        <span className="font-medium">
                          {'freightBase' in displayValues ? formatCurrency(displayValues.freightBase) : formatCurrency(displayValues.freightCost)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1">
                            <span className="text-muted-foreground">Seguro marítimo ({formatPercent('insurancePercentage' in displayValues ? displayValues.insurancePercentage : null)}):</span>
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Seguro calculado sobre FOB + Flete</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="font-medium">{formatCurrency(displayValues.insuranceCost)}</span>
                      </div>

                      {/* Subtotal envío marítimo */}
                      {'subtotalMaritimeShipping' in displayValues && displayValues.subtotalMaritimeShipping !== undefined && (
                        <div className="flex justify-between text-sm font-medium pt-1 border-t">
                          <span>Subtotal envío marítimo:</span>
                          <span>{formatCurrency(displayValues.subtotalMaritimeShipping)}</span>
                        </div>
                      )}

                      {'destinationVariableTotal' in displayValues && displayValues.destinationVariableTotal !== undefined && <>
                          <div className="flex justify-between text-sm mt-2">
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <span className="text-muted-foreground">Gastos destino variable:</span>
                                <Info className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {'totalVolumeM3' in displayValues && 'destinationVariableCostPerM3' in displayValues && displayValues.totalVolumeM3 && displayValues.destinationVariableCostPerM3 && <p className="text-xs">{formatNumber(displayValues.totalVolumeM3, 3, 3)} m³ × €{formatNumber(displayValues.destinationVariableCostPerM3)}/m³</p>}
                              </TooltipContent>
                            </Tooltip>
                            <span className="font-medium">{formatCurrency(displayValues.destinationVariableTotal)}</span>
                          </div>
                          {'destinationFixedCost' in displayValues && displayValues.destinationFixedCost !== undefined && <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Gastos destino fijo:</span>
                              <span className="font-medium">{formatCurrency(displayValues.destinationFixedCost)}</span>
                            </div>}
                          {'duaCost' in displayValues && displayValues.duaCost !== undefined && <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">DUA:</span>
                              <span className="font-medium">{formatCurrency(displayValues.duaCost)}</span>
                            </div>}
                        </>}
                    </div>
                  </div>

                  <Separator />

                  {/* Taxes */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Impuestos
                    </h4>
                    <div className="space-y-1 pl-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Arancel ({formatPercent(displayValues.tariffPercentage)}):
                        </span>
                        <span className="font-medium">{formatCurrency(displayValues.tariffCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1">
                            <span className="text-muted-foreground">IVA importación (recuperable) ({formatPercent(displayValues.vatPercentage)}):</span>
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">El IVA es recuperable según situación fiscal del comprador.</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="font-medium">{formatCurrency(displayValues.vatCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            /* Legacy mode: show flat breakdown without collapsible */
            <>
              {/* Shipping Costs */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  Costos de Envío
                </h4>
                <div className="space-y-1 pl-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transporte marítimo:</span>
                    <span className="font-medium">{formatCurrency(displayValues.freightCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Seguro marítimo:</span>
                    <span className="font-medium">{formatCurrency(displayValues.insuranceCost)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Taxes */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Impuestos
                </h4>
                <div className="space-y-1 pl-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Arancel ({formatPercent(displayValues.tariffPercentage)}):
                    </span>
                    <span className="font-medium">{formatCurrency(displayValues.tariffCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA importación (recuperable) ({formatPercent(displayValues.vatPercentage)}):</span>
                    <span className="font-medium">{formatCurrency(displayValues.vatCost)}</span>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Fee al comprador */}
          {calculation && 'buyerFee' in displayValues && 'buyerFeePercentage' in displayValues && displayValues.buyerFee !== undefined && displayValues.buyerFeePercentage !== undefined && <div className="flex justify-between text-sm py-1">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <span className="text-muted-foreground">Fee al comprador ({displayValues.buyerFeePercentage}%):</span>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Comisión por servicio de facilitación</p>
                </TooltipContent>
              </Tooltip>
              <span className="font-medium">{formatCurrency(displayValues.buyerFee)}</span>
            </div>}

          <Separator className="bg-primary/20" />

          {/* Total final a pagar */}
          <div className="flex justify-between items-center pt-2 bg-green-50 dark:bg-green-950/20 px-3 py-3 rounded-lg">
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <span className="text-lg font-bold text-green-800 dark:text-green-200">Total final a pagar:</span>
                <Info className="h-4 w-4 text-green-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">El precio total incluye transporte internacional, despacho, aranceles e IVA de importación.</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(displayValues.totalCostWithTaxes)}
            </span>
          </div>

          {/* Precio por unidad */}
          <div className="flex justify-between items-center text-sm text-muted-foreground px-3">
            <span>Precio final por unidad:</span>
            <span className="font-semibold">
              {formatCurrency(displayValues.totalCostWithTaxes / quantity)}
            </span>
          </div>

          {/* Nota sobre envío local */}
          {calculation && <p className="text-xs text-muted-foreground text-center pt-2 italic">
              * No incluye envío local. Se calculará según código postal de destino.
            </p>}

          {realTime && calculation && <>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Calculado automáticamente para {calculation.destination_country.toUpperCase()}
              </p>

              {/* Timeline de entrega completo */}
              {calculation.delivery_timeline && <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Tiempos de Entrega Estimados</h4>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Producción */}
                      {calculation.delivery_timeline.production_days > 0 && <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-purple-600" />
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <span className="text-sm font-medium">Producción:</span>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Tiempo estimado de fabricación</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-sm font-bold">{calculation.delivery_timeline.production_days} días</span>
                        </div>}

                      {/* Logística hasta puerto */}
                      {calculation.delivery_timeline.logistics_to_port_days > 0 && <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-orange-600" />
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <span className="text-sm font-medium">Hasta puerto origen:</span>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Transporte desde fábrica hasta puerto de embarque</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-sm font-bold">{calculation.delivery_timeline.logistics_to_port_days} días</span>
                        </div>}

                      {/* Tránsito marítimo */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Anchor className="h-4 w-4 text-blue-600" />
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              <span className="text-sm font-medium">Tránsito marítimo:</span>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {calculation.transit_info ? `${calculation.transit_info.origin_port} → ${calculation.transit_info.destination_port}` : 'Tiempo estimado de navegación'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-bold">
                          {calculation.delivery_timeline.maritime_transit_min_days} - {calculation.delivery_timeline.maritime_transit_max_days} días
                        </span>
                      </div>

                      {/* Despacho aduanero */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-green-600" />
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              <span className="text-sm font-medium">Despacho aduanero:</span>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Gestión documentaria y liberación de mercancía</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-bold">
                          {calculation.delivery_timeline.customs_clearance_min_days} - {calculation.delivery_timeline.customs_clearance_max_days} días
                        </span>
                      </div>

                      <Separator className="bg-primary/30" />

                      {/* Total */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-base font-bold text-primary">TOTAL ESTIMADO:</span>
                        <span className="text-xl font-bold text-primary">
                          {calculation.delivery_timeline.total_min_days} - {calculation.delivery_timeline.total_max_days} días
                        </span>
                      </div>
                    </div>

                    {/* Advertencias */}
                    {!calculation.delivery_timeline.has_complete_data && <Alert className="mt-3 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="ml-2 text-xs text-amber-900 dark:text-amber-100">
                          Los plazos mostrados son estimaciones basadas en tiempos históricos promedio de producción, tránsito marítimo y despacho. Pueden variar según condiciones operativas del fabricante, del transporte internacional y de las autoridades aduaneras.
                        </AlertDescription>
                      </Alert>}

                    {calculation.transit_info?.is_outdated && <Alert className="mt-3 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="ml-2 text-xs text-amber-900 dark:text-amber-100">
                          Los tiempos marítimos tienen más de 90 días sin actualizar. Pueden no reflejar las condiciones actuales.
                        </AlertDescription>
                      </Alert>}

                    {calculation.delivery_timeline.production_days > 60 && <Alert className="mt-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="ml-2 text-xs text-blue-900 dark:text-blue-100">
                          <strong>Tiempo de producción extendido:</strong> Este producto requiere más de 2 meses de fabricación.
                          Planifica tu pedido con anticipación.
                        </AlertDescription>
                      </Alert>}
                  </div>
                </div>}
            </>}
        </CardContent>
      </Card>
    </TooltipProvider>;
};

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { trackFormSubmission, FORM_NAMES, trackQuoteRequest } from "@/lib/gtmEvents";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Package, CreditCard, CheckCircle, Anchor, Ship, MapPin, Clock, Truck, FileCheck, AlertTriangle } from "lucide-react";
import { CostBreakdown } from "@/components/CostBreakdown";
import { LocalShippingCalculator } from "@/components/buyer/LocalShippingCalculator";
import { ProfileCompletionModal } from "@/components/buyer/ProfileCompletionModal";
import { LocalShippingCalculation } from "@/lib/localShippingCalculator";
import { calculateOrderTotal } from "@/lib/priceCalculations";
interface Product {
  id: string;
  name: string;
  description: string | null;
  price_unit: number;
  moq: number;
  images: any;
  manufacturer_id: string;
  delivery_port: string | null;
  volume_m3: number | null;
  freight_cost_per_m3: number | null;
  origin_expenses: number | null;
  marine_insurance_percentage: number | null;
  destination_expenses: number | null;
  local_delivery_cost: number | null;
  tariff_percentage: number | null;
  vat_percentage: number | null;
  shipping_cost_total: number | null;
  cif_value: number | null;
  marine_insurance_cost: number | null;
  taxable_base: number | null;
  tariff_cost: number | null;
  vat_cost: number | null;
  total_cost_with_taxes: number | null;
  discount_3u?: number | null;
  discount_5u?: number | null;
  discount_8u?: number | null;
  discount_10u?: number | null;
}
export default function Checkout() {
  const {
    productId
  } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    user,
    profile
  } = useAuth();

  // Quote mode detection - when ?quote=true query param is present
  const isQuoteMode = searchParams.get('quote') === 'true';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [originPort, setOriginPort] = useState<string>("");
  const [selectedDestinationPort, setSelectedDestinationPort] = useState<string>("");
  const [totalCost, setTotalCost] = useState(0);
  const [calculationSnapshot, setCalculationSnapshot] = useState<any>(null);
  const [localShippingCalc, setLocalShippingCalc] = useState<LocalShippingCalculation | null>(null);
  const [internationalCost, setInternationalCost] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Guest form state (for non-authenticated users in quote mode)
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestTaxId, setGuestTaxId] = useState("");
  const [guestPostalCode, setGuestPostalCode] = useState("");
  const [guestAcceptedTerms, setGuestAcceptedTerms] = useState(false);
  const [sessionId] = useState(() => {
    let sid = sessionStorage.getItem('session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('session_id', sid);
    }
    return sid;
  });
  useEffect(() => {
    // For quote mode, allow guests (don't redirect)
    // For normal checkout, redirect if not logged in
    if (!user && !isQuoteMode) {
      navigate(`/auth/signup?redirect_to=/checkout/${productId}`);
      return;
    }
    fetchProduct();
    if (user) {
      trackStep('checkout_started');
    }
  }, [user, productId, isQuoteMode]);
  const fetchProduct = async () => {
    if (!productId) return;
    try {
      const {
        data,
        error
      } = await supabase.from("products").select("*").eq("id", productId).eq("status", "active").single();
      if (error) throw error;

      // Validar que el producto tenga fabricante
      if (!data.manufacturer_id) {
        toast.error("Este producto no está disponible para pedidos");
        navigate("/buyer/catalog");
        return;
      }
      setProduct(data);
      setQuantity(data.moq || 1);
      // Set default origin port from product
      if (data.delivery_port) {
        setOriginPort(data.delivery_port);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Error al cargar el producto");
      navigate("/buyer/catalog");
    } finally {
      setLoading(false);
    }
  };
  const trackStep = async (step: string) => {
    try {
      await supabase.rpc('track_order_step', {
        p_user_id: user?.id || null,
        p_product_id: productId,
        p_order_id: null,
        p_step: step,
        p_session_id: sessionId
      });
    } catch (error) {
      console.error("Error tracking step:", error);
    }
  };

  // Check if buyer profile has all required fields
  const isProfileComplete = () => {
    return !!(
      profile?.mobile_phone &&
      profile?.tax_id &&
      profile?.postal_code &&
      profile?.is_professional_business === true
    );
  };

  // Validate guest form
  const isGuestFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s\-]{9,20}$/;
    const postalCodeRegex = /^\d{4,10}$/;

    return (
      emailRegex.test(guestEmail.trim()) &&
      phoneRegex.test(guestPhone.trim()) &&
      guestTaxId.trim().length >= 5 &&
      postalCodeRegex.test(guestPostalCode.trim()) &&
      guestAcceptedTerms
    );
  };

  // Handle profile modal completion - retry order submission
  const handleProfileComplete = () => {
    setShowProfileModal(false);
    // Skip profile check since we just validated and saved the data in the modal
    handleConfirmOrder(true);
  };

  const handleConfirmOrder = async (skipProfileCheck = false) => {
    if (!product) return;

    // Quote mode handling
    if (isQuoteMode) {
      const isGuest = !user;

      // For guests, validate the guest form
      if (isGuest) {
        if (!isGuestFormValid()) {
          toast.error("Por favor completa todos los campos correctamente");
          return;
        }
      } else {
        // For authenticated users, check profile completion
        if (!skipProfileCheck && !isProfileComplete()) {
          setShowProfileModal(true);
          return;
        }
      }

      if (quantity < product.moq) {
        toast.error(`La cantidad mínima es ${product.moq} unidades`);
        return;
      }

      setSubmitting(true);
      try {
        // Create quote request
        const { data: quoteData, error: quoteError } = await supabase
          .from("quote_requests")
          .insert({
            product_id: productId,
            user_id: isGuest ? null : user!.id,
            email: isGuest ? guestEmail.trim() : (profile?.email || user!.email),
            mobile_phone: isGuest ? guestPhone.trim() : profile?.mobile_phone,
            tax_id: isGuest ? guestTaxId.trim().toUpperCase() : profile?.tax_id,
            postal_code: isGuest ? guestPostalCode.trim() : profile?.postal_code,
            is_authenticated: !isGuest,
            status: "pending",
            quantity: quantity,
            notes: notes || null,
            destination_port: selectedDestinationPort || null,
            calculation_snapshot: calculationSnapshot,
          })
          .select()
          .single();

        if (quoteError) {
          console.error("Quote request creation error:", quoteError);
          throw new Error(quoteError.message || "No se pudo crear la solicitud");
        }

        // Track GTM events
        trackFormSubmission(FORM_NAMES.QUOTE_REQUEST);
        trackQuoteRequest(productId!, !isGuest);

        toast.success("¡Solicitud enviada exitosamente!", {
          duration: 5000
        });
        navigate(`/order-confirmation?quoteId=${quoteData.id}`);
      } catch (error: any) {
        console.error("Error creating quote request:", error);
        toast.error(error.message || "Error al enviar la solicitud. Por favor intenta de nuevo.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Normal checkout flow (not quote mode) - requires authentication
    if (!user) return;

    // Check if profile is complete before proceeding (skip if just completed modal)
    if (!skipProfileCheck && !isProfileComplete()) {
      setShowProfileModal(true);
      return;
    }

    if (quantity < product.moq) {
      toast.error(`La cantidad mínima es ${product.moq} unidades`);
      return;
    }

    // Validar que el producto tenga fabricante asignado
    if (!product.manufacturer_id) {
      toast.error("Este producto no tiene un fabricante asignado. Por favor contacta soporte.");
      return;
    }

    // Validate with Zod schema
    try {
      const {
        orderSchema
      } = await import('@/lib/validationSchemas');
      orderSchema.parse({
        quantity,
        notes: notes || undefined
      });
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error("Error de validación en el pedido");
      }
      return;
    }
    setSubmitting(true);
    try {
      // Track payment initiated
      await trackStep('payment_initiated');

      // Create order
      const {
        data: orderData,
        error: orderError
      } = await supabase.from("orders").insert({
        buyer_id: user.id,
        manufacturer_id: product.manufacturer_id,
        product_id: product.id,
        quantity: quantity,
        total_price: totalCost > 0 ? totalCost : calculateOrderTotal(product.price_unit, quantity, {
          discount_3u: product.discount_3u,
          discount_5u: product.discount_5u,
          discount_8u: product.discount_8u,
          discount_10u: product.discount_10u
        }),
        status: "pending",
        payment_status: "pending",
        tracking_stage: "created",
        buyer_notes: notes,
        session_id: sessionId,
        calculation_snapshot: calculationSnapshot
      }).select().single();
      if (orderError) {
        console.error("Order creation error:", orderError);
        throw new Error(orderError.message || "No se pudo crear el pedido");
      }

      // Track order submission
      await trackStep('confirmed');
      toast.success("¡Pedido enviado exitosamente!", {
        duration: 5000
      });
      navigate(`/order-confirmation?orderId=${orderData.id}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Error al procesar el pedido. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>;
  }
  if (!product) {
    return null;
  }
  const totalPrice = product.total_cost_with_taxes ? product.total_cost_with_taxes * quantity : calculateOrderTotal(product.price_unit, quantity, {
    discount_3u: product.discount_3u,
    discount_5u: product.discount_5u,
    discount_8u: product.discount_8u,
    discount_10u: product.discount_10u
  });
  return <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Button variant="ghost" onClick={() => navigate(`/product/${productId}`)} className="mb-4 sm:mb-6" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
          {isQuoteMode ? "Solicitud de Propuesta Final" : "Confirmar Pedido"}
        </h1>

        <div className="space-y-6 sm:space-y-8">
          {/* Product Summary */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                Resumen del Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {product.images && <img src={(Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]'))?.[0]?.url || "/placeholder.svg"} alt={product.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mx-auto sm:mx-0" />}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-base sm:text-lg">{product.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                    {product.description}
                  </p>
                  <p className="text-base sm:text-lg font-bold text-primary mt-2">
                    €{product.price_unit.toLocaleString("es-ES")} <span className="text-xs sm:text-sm font-normal">EUR/unidad</span>
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="quantity">
                  Cantidad (mínimo {product.moq} unidades)
                </Label>
                <Input id="quantity" type="number" min={product.moq} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || product.moq)} onFocus={e => e.target.select()} className="mt-2" />
              </div>

              <Separator />

              {/* Ruta Logística Internacional */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-primary" />
                  <Label className="text-base font-semibold">Ruta Logística Internacional</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  China → Puerto España → Dirección de entrega
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Puerto Origen */}
                  <div>
                    <Label htmlFor="origin-port" className="text-sm">
                      Puerto de origen
                    </Label>
                    <Select value={originPort} onValueChange={setOriginPort} disabled={!!product.delivery_port}>
                      <SelectTrigger id="origin-port" className="mt-2">
                        <SelectValue placeholder="Selecciona puerto origen" />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="Shanghai">Shanghai</SelectItem>
                        <SelectItem value="Tianjin">Tianjin</SelectItem>
                        <SelectItem value="Qingdao">Qingdao</SelectItem>
                        <SelectItem value="Ningbo">Ningbo</SelectItem>
                        <SelectItem value="Xiamen">Xiamen</SelectItem>
                        <SelectItem value="Shenzhen">Shenzhen</SelectItem>
                        <SelectItem value="Guangzhou">Guangzhou</SelectItem>
                      </SelectContent>
                    </Select>
                    {product.delivery_port && <div className="mt-2 text-xs bg-muted/50 border border-border rounded-md p-2">
                        <p className="font-medium text-foreground">
                          🔒 Puerto de salida predefinido por el fabricante
                        </p>
                        <p className="text-muted-foreground mt-1">
                          Este producto solo se despacha desde {product.delivery_port}
                        </p>
                      </div>}
                  </div>

                  {/* Puerto Destino - Seleccionado automáticamente */}
                  <div>
                    <Label className="text-sm">
                      Puerto de destino en España
                    </Label>
                    <div className="mt-2 bg-muted/50 border border-border rounded-md p-3">
                      <p className="text-sm font-medium text-foreground">
                        {selectedDestinationPort ? <>🚢 {selectedDestinationPort}</> : <span className="text-muted-foreground">Calculando mejor ruta...</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seleccionado automáticamente según menor tiempo de tránsito
                      </p>
                    </div>
                  </div>
                </div>

                {/* Indicador de Ruta */}
                {originPort && selectedDestinationPort && <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ruta óptima:</span>
                      <span className="font-semibold text-primary">
                        {originPort} → {selectedDestinationPort}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ruta con menor tiempo de tránsito marítimo
                    </p>
                  </div>}
              </div>

              <Separator />


            </CardContent>
          </Card>

          {/* Guest Contact Form - Only shown for non-authenticated users in quote mode */}
          {isQuoteMode && !user && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  Datos de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <p className="text-sm text-muted-foreground">
                  Introduce tus datos para que podamos enviarte la propuesta comercial.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guest-email">Email *</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      placeholder="tu@empresa.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-phone">Teléfono móvil con WhatsApp *</Label>
                    <Input
                      id="guest-phone"
                      type="tel"
                      placeholder="+34 600 123 456"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-taxid">NIF/CIF/NIE/DNI/VAT-ID *</Label>
                    <Input
                      id="guest-taxid"
                      type="text"
                      placeholder="B12345678"
                      value={guestTaxId}
                      onChange={(e) => setGuestTaxId(e.target.value.toUpperCase())}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-postal">Código Postal *</Label>
                    <Input
                      id="guest-postal"
                      type="text"
                      placeholder="28001"
                      value={guestPostalCode}
                      onChange={(e) => setGuestPostalCode(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="guest-terms"
                    checked={guestAcceptedTerms}
                    onCheckedChange={(checked) => setGuestAcceptedTerms(checked === true)}
                  />
                  <Label htmlFor="guest-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    Declaro que los datos proporcionados corresponden a una empresa legalmente registrada y activa, y acepto los{" "}
                    <a href="/terms" className="text-primary underline hover:no-underline" target="_blank">
                      términos y condiciones
                    </a>{" "}
                    y la{" "}
                    <a href="/privacy" className="text-primary underline hover:no-underline" target="_blank">
                      política de privacidad
                    </a>.
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Envío Internacional - Siempre incluido */}
          <CostBreakdown productId={product.id} quantity={quantity} destinationCountry="spain" originPort={originPort || undefined} realTime={true} onCalculationComplete={calc => {
          setInternationalCost(calc.breakdown.total);
          setCalculationSnapshot(calc);
          // Guardar el puerto destino seleccionado automáticamente
          if (calc.transit_info?.destination_port) {
            setSelectedDestinationPort(calc.transit_info.destination_port);
          }
          // Sumar internacional + local
          const localCost = localShippingCalc?.total_local_shipping || 0;
          setTotalCost(calc.breakdown.total + localCost);
        }} />

          {/* Envío Local (España) - Siempre incluido */}
          <LocalShippingCalculator totalVolumeM3={(product.volume_m3 || 0) * quantity} onCalculationComplete={calc => {
          if (calc) {
            setLocalShippingCalc(calc);
            // Sumar internacional + local
            setTotalCost(internationalCost + calc.total_local_shipping);
          } else {
            setLocalShippingCalc(null);
            setTotalCost(internationalCost);
          }
        }} />

          {/* Payment Summary - DESPUÉS del desglose */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                Resumen de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {internationalCost > 0 && <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envío internacional + impuestos</span>
                      <span className="font-medium">
                        €{internationalCost.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                      </span>
                    </div>
                    {localShippingCalc && <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Envío local ({localShippingCalc.zone?.name || 'Pendiente CP'})
                        </span>
                        <span className="font-medium">
                          €{localShippingCalc.total_local_shipping.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                        </span>
                      </div>}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total a Pagar</span>
                      <span className="text-primary">
                        €{totalCost.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                      </span>
                    </div>
                  </>}
              </div>

              <Separator />

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  ¿Qué sucede después?
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Revisaremos tu solicitud en menos de 24 horas</li>
                  <li>Te enviaremos una propuesta comercial final con el precio validado, instrucciones de pago y plazos definitivos</li>
                  <li>En caso de aceptar la propuesta coordinaremos el pago y el envío</li>
                </ul>
              </div>

              {/* Tiempos de Entrega Estimados */}
              {calculationSnapshot?.delivery_timeline && <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-5 w-5 text-primary" />
                      Tiempos de Entrega Estimados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Producción */}
                    {calculationSnapshot.delivery_timeline.production_days > 0 && <div className="flex items-center justify-between py-2 border-b border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Producción:</span>
                        </div>
                        <span className="text-sm font-bold">{calculationSnapshot.delivery_timeline.production_days} días</span>
                      </div>}

                    {/* Logística hasta puerto */}
                    {calculationSnapshot.delivery_timeline.logistics_to_port_days > 0 && <div className="flex items-center justify-between py-2 border-b border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium">Hasta puerto origen:</span>
                        </div>
                        <span className="text-sm font-bold">{calculationSnapshot.delivery_timeline.logistics_to_port_days} días</span>
                      </div>}

                    {/* Tránsito Marítimo */}
                    <div className="flex items-center justify-between py-2 border-b border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Tránsito marítimo:</span>
                      </div>
                      <span className="text-sm font-bold">
                        {calculationSnapshot.delivery_timeline.maritime_transit_min_days} - {calculationSnapshot.delivery_timeline.maritime_transit_max_days} días
                      </span>
                    </div>

                    {/* Despacho Aduanero */}
                    <div className="flex items-center justify-between py-2 border-b border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Despacho aduanero:</span>
                      </div>
                      <span className="text-sm font-bold">
                        {calculationSnapshot.delivery_timeline.customs_clearance_min_days} - {calculationSnapshot.delivery_timeline.customs_clearance_max_days} días
                      </span>
                    </div>

                    {/* Total Estimado */}
                    <div className="flex items-center justify-between pt-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="font-bold text-primary">TOTAL ESTIMADO:</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {calculationSnapshot.delivery_timeline.total_min_days} - {calculationSnapshot.delivery_timeline.total_max_days} días
                      </span>
                    </div>

                    {/* Warning sobre tiempos incompletos */}
                    {(!calculationSnapshot.delivery_timeline.production_days || !calculationSnapshot.delivery_timeline.logistics_to_port_days) && <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>Los plazos mostrados son estimaciones basadas en tiempos históricos promedio de producción, tránsito marítimo y despacho. Pueden variar según condiciones operativas del fabricante, del transporte internacional y de las autoridades aduaneras.</span>
                      </div>}
                  </CardContent>
                </Card>}

              <Button
                className="w-full"
                size="lg"
                onClick={() => handleConfirmOrder()}
                disabled={
                  submitting ||
                  quantity < product.moq ||
                  totalCost === 0 ||
                  (isQuoteMode && !user && !isGuestFormValid())
                }
              >
                {submitting
                  ? "Enviando solicitud..."
                  : isQuoteMode
                    ? "Solicitar Propuesta"
                    : "Solicitar Propuesta Final"
                }
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Esta solicitud no implica pago ni compra confirmada
              </p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                Al enviar, aceptas nuestros términos y condiciones de servicio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        profile={profile}
        userId={user?.id || ""}
      />
    </div>;
}
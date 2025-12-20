import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Phone, FileText, MapPin, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { trackFormSubmission, FORM_NAMES, trackQuoteRequest } from "@/lib/gtmEvents";

interface QuoteRequestModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  productId: string;
  productName: string;
}

export function QuoteRequestModal({
  open,
  onClose,
  onComplete,
  productId,
  productName,
}: QuoteRequestModalProps) {
  const [email, setEmail] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Formato de email inválido";
    }

    if (!mobilePhone.trim()) {
      newErrors.mobilePhone = "El teléfono móvil es obligatorio";
    } else if (!/^\+?[0-9\s-]{9,20}$/.test(mobilePhone.replace(/\s/g, ""))) {
      newErrors.mobilePhone = "Formato de teléfono inválido (ej: +34 670 88 30 93)";
    }

    if (!taxId.trim()) {
      newErrors.taxId = "El NIF/CIF/NIE/DNI/VAT-ID es obligatorio";
    }

    if (!postalCode.trim()) {
      newErrors.postalCode = "El código postal es obligatorio";
    } else if (!/^[0-9]{4,10}$/.test(postalCode.replace(/\s/g, ""))) {
      newErrors.postalCode = "Formato de código postal inválido";
    }

    if (!acceptedTerms) {
      newErrors.acceptedTerms = "Debes aceptar los términos para continuar";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("quote_requests")
        .insert({
          product_id: productId,
          user_id: null,
          email: email.trim(),
          mobile_phone: mobilePhone.trim(),
          tax_id: taxId.trim().toUpperCase(),
          postal_code: postalCode.trim(),
          is_authenticated: false,
          status: "pending",
        });

      if (error) throw error;

      // Track GTM events
      trackFormSubmission(FORM_NAMES.QUOTE_REQUEST);
      trackQuoteRequest(productId, false);

      toast.success("Solicitud enviada correctamente. Te contactaremos pronto.");

      // Reset form
      setEmail("");
      setMobilePhone("");
      setTaxId("");
      setPostalCode("");
      setAcceptedTerms(false);
      setErrors({});

      onComplete();
    } catch (error: any) {
      console.error("Error creating quote request:", error);
      toast.error(error.message || "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Solicitar información
          </DialogTitle>
          <DialogDescription>
            Completa tus datos para recibir información detallada sobre{" "}
            <span className="font-medium">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="quote-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email de contacto
            </Label>
            <Input
              id="quote-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Mobile Phone */}
          <div className="space-y-2">
            <Label htmlFor="quote-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfono móvil con WhatsApp
            </Label>
            <Input
              id="quote-phone"
              type="tel"
              value={mobilePhone}
              onChange={(e) => setMobilePhone(e.target.value)}
              placeholder="+34 670 88 30 93"
              className={errors.mobilePhone ? "border-destructive" : ""}
            />
            {errors.mobilePhone && (
              <p className="text-xs text-destructive">{errors.mobilePhone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Incluye el código de país (ej: +34 para España)
            </p>
          </div>

          {/* Tax ID */}
          <div className="space-y-2">
            <Label htmlFor="quote-tax-id" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              NIF / CIF / NIE / DNI / VAT-ID
            </Label>
            <Input
              id="quote-tax-id"
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value.toUpperCase())}
              placeholder="B12345678"
              className={errors.taxId ? "border-destructive" : ""}
            />
            {errors.taxId && (
              <p className="text-xs text-destructive">{errors.taxId}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Identificación fiscal de tu empresa
            </p>
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <Label htmlFor="quote-postal-code" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Código Postal
            </Label>
            <Input
              id="quote-postal-code"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="28001"
              maxLength={10}
              className={errors.postalCode ? "border-destructive" : ""}
            />
            {errors.postalCode && (
              <p className="text-xs text-destructive">{errors.postalCode}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Código postal de tu empresa
            </p>
          </div>

          {/* Terms Acceptance */}
          <div className="space-y-2">
            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
              <Checkbox
                id="quote-terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className={errors.acceptedTerms ? "border-destructive" : ""}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="quote-terms"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Acepto recibir información comercial
                </Label>
                <p className="text-xs text-muted-foreground">
                  Autorizo a LeanZupply a contactarme sobre este producto y otras ofertas relacionadas.
                </p>
              </div>
            </div>
            {errors.acceptedTerms && (
              <p className="text-xs text-destructive">{errors.acceptedTerms}</p>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
              Recibirás información detallada sobre precios, plazos de entrega y condiciones comerciales.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

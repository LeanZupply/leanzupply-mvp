import { useState, useEffect } from "react";
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
import { User, Phone, FileText, Building2, AlertCircle, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  mobile_phone?: string;
  tax_id?: string;
  postal_code?: string;
  is_professional_business?: boolean;
}

interface ProfileCompletionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  profile: Profile | null;
  userId: string;
}

export function ProfileCompletionModal({
  open,
  onClose,
  onComplete,
  profile,
  userId,
}: ProfileCompletionModalProps) {
  const [mobilePhone, setMobilePhone] = useState(profile?.mobile_phone || "");
  const [taxId, setTaxId] = useState(profile?.tax_id || "");
  const [postalCode, setPostalCode] = useState(profile?.postal_code || "");
  const [isProfessionalBusiness, setIsProfessionalBusiness] = useState(
    profile?.is_professional_business || false
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setMobilePhone(profile.mobile_phone || "");
      setTaxId(profile.tax_id || "");
      setPostalCode(profile.postal_code || "");
      setIsProfessionalBusiness(profile.is_professional_business || false);
    }
  }, [profile]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

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

    if (!isProfessionalBusiness) {
      newErrors.isProfessionalBusiness = "Debes confirmar que eres una empresa profesional";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          mobile_phone: mobilePhone.trim(),
          tax_id: taxId.trim(),
          postal_code: postalCode.trim(),
          is_professional_business: isProfessionalBusiness,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Perfil actualizado correctamente");
      onComplete();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Error al guardar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Completa tu perfil para continuar
          </DialogTitle>
          <DialogDescription>
            Necesitamos estos datos para procesar tu solicitud de propuesta comercial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Mobile Phone */}
          <div className="space-y-2">
            <Label htmlFor="mobile-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfono móvil con WhatsApp
            </Label>
            <Input
              id="mobile-phone"
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
            <Label htmlFor="tax-id" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              NIF / CIF / NIE / DNI / VAT-ID
            </Label>
            <Input
              id="tax-id"
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
            <Label htmlFor="postal-code" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Código Postal
            </Label>
            <Input
              id="postal-code"
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

          {/* Professional Business Declaration */}
          <div className="space-y-2">
            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
              <Checkbox
                id="professional-business"
                checked={isProfessionalBusiness}
                onCheckedChange={(checked) =>
                  setIsProfessionalBusiness(checked === true)
                }
                className={errors.isProfessionalBusiness ? "border-destructive" : ""}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="professional-business"
                  className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Declaro ser una Empresa Profesional Activa Registrada
                </Label>
                <p className="text-xs text-muted-foreground">
                  Confirmo que represento a una empresa legalmente constituida y activa.
                </p>
              </div>
            </div>
            {errors.isProfessionalBusiness && (
              <p className="text-xs text-destructive">{errors.isProfessionalBusiness}</p>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
              Esta información se guardará en tu perfil y no tendrás que ingresarla de nuevo en futuras solicitudes.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GuestContactData } from "@/lib/guestContactValidation";

interface GuestContactFormProps {
  values: GuestContactData;
  onChange: (data: GuestContactData) => void;
  showCard?: boolean;
}

export function GuestContactForm({
  values,
  onChange,
  showCard = true
}: GuestContactFormProps) {
  const updateField = <K extends keyof GuestContactData>(
    field: K,
    value: GuestContactData[K]
  ) => {
    onChange({ ...values, [field]: value });
  };

  const formContent = (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Introduce tus datos antes de avanzar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guest-email">Email *</Label>
          <Input
            id="guest-email"
            type="email"
            placeholder="tu@empresa.com"
            value={values.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="guest-phone">Telefono movil con WhatsApp *</Label>
          <Input
            id="guest-phone"
            type="tel"
            placeholder="+34 600 123 456"
            value={values.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="guest-taxid">NIF/CIF/NIE/DNI/VAT-ID *</Label>
          <Input
            id="guest-taxid"
            type="text"
            placeholder="B12345678"
            value={values.taxId}
            onChange={(e) => updateField('taxId', e.target.value.toUpperCase())}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="guest-postal">Codigo Postal *</Label>
          <Input
            id="guest-postal"
            type="text"
            placeholder="28001"
            value={values.postalCode}
            onChange={(e) => updateField('postalCode', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex items-start gap-3 pt-4">
        <Checkbox
          id="guest-terms"
          checked={values.acceptedTerms}
          onCheckedChange={(checked) => updateField('acceptedTerms', checked === true)}
        />
        <Label htmlFor="guest-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
          Declaro que los datos proporcionados corresponden a una empresa legalmente registrada y activa, y acepto los{" "}
          <a href="/legal/terminos" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
            terminos y condiciones
          </a>{" "}
          y la{" "}
          <a href="/legal/privacidad" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
            politica de privacidad
          </a>.
        </Label>
      </div>
    </>
  );

  if (!showCard) {
    return <div className="space-y-4">{formContent}</div>;
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
          Datos de Contacto
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {formContent}
      </CardContent>
    </Card>
  );
}

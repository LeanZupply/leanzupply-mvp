import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, MapPin, Truck } from "lucide-react";
import { buyerInfoSchema, BuyerInfoFormData } from "@/lib/validationSchemas";

interface Profile {
  email?: string | null;
  full_name?: string | null;
  company_name?: string | null;
  country?: string | null;
  tax_id?: string | null;
  eori_number?: string | null;
  mobile_phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  importer_status?: string | null;
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_postal_code?: string | null;
  delivery_phone?: string | null;
  delivery_hours?: string | null;
}

interface BuyerInfoFormProps {
  profile: Profile | null;
  userEmail?: string;
  onValidChange: (isValid: boolean, data: BuyerInfoFormData | null) => void;
  onDeliveryPostalCodeChange?: (postalCode: string) => void;
}

export function BuyerInfoForm({
  profile,
  userEmail,
  onValidChange,
  onDeliveryPostalCodeChange,
}: BuyerInfoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
  } = useForm<BuyerInfoFormData>({
    resolver: zodResolver(buyerInfoSchema),
    mode: "onChange",
    defaultValues: {
      // Section 1 - Personal Info (from profile)
      email: profile?.email || userEmail || "",
      full_name: profile?.full_name || "",
      company_name: profile?.company_name || "",
      country: profile?.country || "Espana",

      // Section 2 - Fiscal Info
      tax_id: profile?.tax_id || "",
      eori_number: profile?.eori_number || "",
      mobile_phone: profile?.mobile_phone || "",
      address: profile?.address || "",
      city: profile?.city || "",
      postal_code: profile?.postal_code || "",
      importer_status: profile?.importer_status || "",

      // Section 3 - Delivery Info
      same_as_fiscal: !profile?.delivery_address, // Default to true if no delivery address set
      delivery_address: profile?.delivery_address || "",
      delivery_city: profile?.delivery_city || "",
      delivery_postal_code: profile?.delivery_postal_code || "",
      delivery_phone: profile?.delivery_phone || "",
      delivery_hours: profile?.delivery_hours || "",
    },
  });

  const sameAsFiscal = watch("same_as_fiscal");
  const fiscalPostalCode = watch("postal_code");
  const deliveryPostalCode = watch("delivery_postal_code");
  const formValues = watch();

  // Notify parent about validation state changes
  useEffect(() => {
    if (isValid) {
      onValidChange(true, formValues as BuyerInfoFormData);
    } else {
      onValidChange(false, null);
    }
  }, [isValid, formValues]);

  // Update local shipping calculator when delivery postal code changes
  useEffect(() => {
    const effectivePostalCode = sameAsFiscal ? fiscalPostalCode : deliveryPostalCode;
    if (effectivePostalCode && onDeliveryPostalCodeChange) {
      onDeliveryPostalCodeChange(effectivePostalCode);
    }
  }, [sameAsFiscal, fiscalPostalCode, deliveryPostalCode, onDeliveryPostalCodeChange]);

  // When "same as fiscal" changes, copy or clear delivery fields
  useEffect(() => {
    if (sameAsFiscal) {
      // Clear delivery fields when same as fiscal
      setValue("delivery_address", "");
      setValue("delivery_city", "");
      setValue("delivery_postal_code", "");
      setValue("delivery_phone", "");
      setValue("delivery_hours", "");
    }
    trigger(); // Re-validate after change
  }, [sameAsFiscal, setValue, trigger]);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
          Datos del Comprador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        {/* Section 1: Personal Information (Read-only) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-4 w-4" />
            Informacion Personal
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="company_name">Nombre de empresa</Label>
              <Input
                id="company_name"
                {...register("company_name")}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="country">Pais</Label>
              <Input
                id="country"
                {...register("country")}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 2: Fiscal Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Informacion Fiscal
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax_id">
                NIF / CIF / NIE / DNI / VAT-ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tax_id"
                {...register("tax_id")}
                placeholder="Ej: B12345678"
                className={`mt-1 ${errors.tax_id ? "border-red-500" : ""}`}
              />
              {errors.tax_id && (
                <p className="text-xs text-red-500 mt-1">{errors.tax_id.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="eori_number">Numero EORI</Label>
              <Input
                id="eori_number"
                {...register("eori_number")}
                placeholder="Ej: ES12345678901234"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Opcional - Necesario para importaciones
              </p>
            </div>
            <div>
              <Label htmlFor="mobile_phone">
                Numero de contacto movil <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mobile_phone"
                {...register("mobile_phone")}
                placeholder="Ej: +34 612 345 678"
                className={`mt-1 ${errors.mobile_phone ? "border-red-500" : ""}`}
              />
              {errors.mobile_phone && (
                <p className="text-xs text-red-500 mt-1">{errors.mobile_phone.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="importer_status">Estado de importador</Label>
              <Select
                value={formValues.importer_status || ""}
                onValueChange={(value) => setValue("importer_status", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="nuevo">Nuevo importador</SelectItem>
                  <SelectItem value="ocasional">Importador ocasional</SelectItem>
                  <SelectItem value="habitual">Importador habitual</SelectItem>
                  <SelectItem value="profesional">Importador profesional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">
                Direccion fiscal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Calle, numero, piso, puerta..."
                className={`mt-1 ${errors.address ? "border-red-500" : ""}`}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="city">
                Ciudad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="Ej: Barcelona"
                className={`mt-1 ${errors.city ? "border-red-500" : ""}`}
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="postal_code">
                Codigo postal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="postal_code"
                {...register("postal_code")}
                placeholder="Ej: 08001"
                className={`mt-1 ${errors.postal_code ? "border-red-500" : ""}`}
              />
              {errors.postal_code && (
                <p className="text-xs text-red-500 mt-1">{errors.postal_code.message}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 3: Delivery Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Truck className="h-4 w-4" />
            Direccion de Entrega
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="same_as_fiscal"
              checked={sameAsFiscal}
              onCheckedChange={(checked) => setValue("same_as_fiscal", checked as boolean)}
            />
            <Label
              htmlFor="same_as_fiscal"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Direccion de entrega igual a la fiscal
            </Label>
          </div>

          {!sameAsFiscal && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="sm:col-span-2">
                <Label htmlFor="delivery_address">
                  Domicilio exacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="delivery_address"
                  {...register("delivery_address")}
                  placeholder="Calle, numero, piso, puerta..."
                  className={`mt-1 ${errors.delivery_address ? "border-red-500" : ""}`}
                />
                {errors.delivery_address && (
                  <p className="text-xs text-red-500 mt-1">{errors.delivery_address.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="delivery_city">
                  Ciudad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="delivery_city"
                  {...register("delivery_city")}
                  placeholder="Ej: Barcelona"
                  className={`mt-1 ${errors.delivery_city ? "border-red-500" : ""}`}
                />
                {errors.delivery_city && (
                  <p className="text-xs text-red-500 mt-1">{errors.delivery_city.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="delivery_postal_code">
                  Codigo Postal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="delivery_postal_code"
                  {...register("delivery_postal_code")}
                  placeholder="Ej: 08001"
                  className={`mt-1 ${errors.delivery_postal_code ? "border-red-500" : ""}`}
                />
                {errors.delivery_postal_code && (
                  <p className="text-xs text-red-500 mt-1">{errors.delivery_postal_code.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Este codigo postal se usa para calcular el envio local
                </p>
              </div>
              <div>
                <Label htmlFor="delivery_phone">Telefono de contacto</Label>
                <Input
                  id="delivery_phone"
                  {...register("delivery_phone")}
                  placeholder="Ej: +34 612 345 678"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="delivery_hours">Horarios de entrega</Label>
                <Input
                  id="delivery_hours"
                  {...register("delivery_hours")}
                  placeholder="Ej: Lunes a Viernes 9:00-18:00"
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

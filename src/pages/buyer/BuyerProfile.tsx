import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/errorHandler";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trackFormSubmission, FORM_NAMES } from "@/lib/gtmEvents";

const BuyerProfile = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const hasInitialized = useRef(false);
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    country: "España",
    email: "",
    tax_id: "",
    eori_number: "",
    mobile_phone: "",
    address: "",
    city: "",
    postal_code: "",
    importer_status: "",
    delivery_address: "",
    delivery_city: "",
    delivery_postal_code: "",
    delivery_hours: "",
    delivery_phone: "",
    is_professional_business: false,
  });

  useEffect(() => {
    // Only initialize form once when profile first becomes available
    if (profile && !hasInitialized.current) {
      hasInitialized.current = true;
      setFormData({
        full_name: profile.full_name || "",
        company_name: profile.company_name || "",
        country: "España",
        email: profile.email || "",
        tax_id: profile.tax_id || "",
        eori_number: profile.eori_number || "",
        mobile_phone: profile.mobile_phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postal_code: profile.postal_code || "",
        importer_status: profile.importer_status || "",
        delivery_address: profile.delivery_address || "",
        delivery_city: profile.delivery_city || "",
        delivery_postal_code: profile.delivery_postal_code || "",
        delivery_hours: profile.delivery_hours || "",
        delivery_phone: profile.delivery_phone || "",
        is_professional_business: profile.is_professional_business || false,
      });
    }
  }, [profile]);

  // Handler for Personal Info section
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate personal info fields
    if (!formData.full_name.trim()) {
      toast.error("El nombre completo es requerido");
      return;
    }
    if (!formData.company_name.trim()) {
      toast.error("El nombre de la empresa es requerido");
      return;
    }
    if (!formData.is_professional_business) {
      toast.error("Debe declarar ser empresa profesional activa registrada");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          country: formData.country,
          is_professional_business: formData.is_professional_business,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Track successful form submission
      trackFormSubmission(FORM_NAMES.BUYER_PROFILE_PERSONAL);

      toast.success("Información personal actualizada");
    } catch (error) {
      const message = handleError("Profile update", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handler for Fiscal Info section
  const handleFiscalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate fiscal info fields
    if (!formData.tax_id.trim()) {
      toast.error("El NIF/CIF/NIE/DNI/VAT-ID es requerido");
      return;
    }
    if (!formData.eori_number.trim()) {
      toast.error("El número EORI es requerido");
      return;
    }
    if (!formData.mobile_phone.trim()) {
      toast.error("El número de contacto móvil es requerido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          tax_id: formData.tax_id,
          eori_number: formData.eori_number,
          mobile_phone: formData.mobile_phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          importer_status: formData.importer_status,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Track successful form submission
      trackFormSubmission(FORM_NAMES.BUYER_PROFILE_FISCAL);

      toast.success("Información fiscal actualizada");
    } catch (error) {
      const message = handleError("Profile update", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handler for Delivery Info section
  const handleDeliveryInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate delivery info fields
    if (!formData.delivery_address.trim()) {
      toast.error("El domicilio exacto es requerido");
      return;
    }
    if (!formData.delivery_city.trim()) {
      toast.error("La ciudad de entrega es requerida");
      return;
    }
    if (!formData.delivery_postal_code.trim()) {
      toast.error("El código postal de entrega es requerido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          delivery_address: formData.delivery_address,
          delivery_city: formData.delivery_city,
          delivery_postal_code: formData.delivery_postal_code,
          delivery_hours: formData.delivery_hours,
          delivery_phone: formData.delivery_phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Track successful form submission
      trackFormSubmission(FORM_NAMES.BUYER_PROFILE_DELIVERY);

      toast.success("Dirección de entrega actualizada");
    } catch (error) {
      const message = handleError("Profile update", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-2 md:gap-0">
        <h1 className="text-xl md:text-3xl font-semibold text-foreground">
          Información de Usuario Comprador
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Gestiona tu información empresarial y fiscal
        </p>
      </div>

      <Card className="border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="text-text">Información Personal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} disabled />
              <p className="text-xs text-muted mt-1">El email no puede ser modificado</p>
            </div>

            <div>
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="company_name">Nombre de la Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="country">País *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
              >
                <SelectTrigger id="country" className="mt-1">
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="España">España</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="is_professional_business"
                checked={formData.is_professional_business}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_professional_business: checked === true })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="is_professional_business"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Declaro ser empresa profesional activa registrada *
                </Label>
                <p className="text-xs text-muted-foreground">
                  Este campo es obligatorio para operar en la plataforma
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="text-text">Información Fiscal y Aduanera</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFiscalInfoSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tax_id">NIF / CIF / NIE / DNI / VAT-ID *</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) =>
                  setFormData({ ...formData, tax_id: e.target.value })
                }
                placeholder="Ej: B12345678, 12345678A"
              />
            </div>

            <div>
              <Label htmlFor="eori_number">Número EORI *</Label>
              <Input
                id="eori_number"
                value={formData.eori_number}
                onChange={(e) =>
                  setFormData({ ...formData, eori_number: e.target.value })
                }
                placeholder="Ej: ES12345678901234"
              />
            </div>

            <div>
              <Label htmlFor="mobile_phone">Número de contacto móvil *</Label>
              <Input
                id="mobile_phone"
                type="tel"
                value={formData.mobile_phone}
                onChange={(e) =>
                  setFormData({ ...formData, mobile_phone: e.target.value })
                }
                placeholder="+34 612 345 678"
              />
            </div>

            <div>
              <Label htmlFor="address">Dirección Fiscal</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Calle, número, piso, depto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  placeholder="CP"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="importer_status">Estado de Importador</Label>
              <Input
                id="importer_status"
                value={formData.importer_status}
                onChange={(e) =>
                  setFormData({ ...formData, importer_status: e.target.value })
                }
                placeholder="Ej: Habilitado, En trámite, etc."
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="text-text">Dirección de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeliveryInfoSubmit} className="space-y-4">
            <div>
              <Label htmlFor="delivery_address">Domicilio Exacto *</Label>
              <Input
                id="delivery_address"
                value={formData.delivery_address}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_address: e.target.value })
                }
                placeholder="Calle, número, piso, puerta"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_city">Ciudad *</Label>
                <Input
                  id="delivery_city"
                  value={formData.delivery_city}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_city: e.target.value })
                  }
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="delivery_postal_code">Código Postal *</Label>
                <Input
                  id="delivery_postal_code"
                  value={formData.delivery_postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_postal_code: e.target.value })
                  }
                  placeholder="CP"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="delivery_hours">Horarios</Label>
              <Input
                id="delivery_hours"
                value={formData.delivery_hours}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_hours: e.target.value })
                }
                placeholder="Ej: Lunes a Viernes 9:00 - 18:00"
              />
            </div>

            <div>
              <Label htmlFor="delivery_phone">Teléfono de Contacto</Label>
              <Input
                id="delivery_phone"
                type="tel"
                value={formData.delivery_phone}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_phone: e.target.value })
                }
                placeholder="+34 912 345 678"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="text-text">Información de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted">Rol:</span>
            <span className="font-medium capitalize">{profile.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Estado de la Cuenta:</span>
            <span className="font-medium">
              {profile.is_verified ? "Verificado" : "Pendiente de Verificación"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerProfile;

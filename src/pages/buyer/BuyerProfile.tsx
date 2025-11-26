import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/errorHandler";

const BuyerProfile = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    country: "",
    email: "",
    tax_id: "",
    address: "",
    city: "",
    postal_code: "",
    importer_status: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        company_name: profile.company_name || "",
        country: profile.country || "",
        email: profile.email || "",
        tax_id: (profile as any).tax_id || "",
        address: (profile as any).address || "",
        city: (profile as any).city || "",
        postal_code: (profile as any).postal_code || "",
        importer_status: (profile as any).importer_status || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate with Zod schema
    try {
      const { profileSchema } = await import('@/lib/validationSchemas');
      profileSchema.parse({
        full_name: formData.full_name,
        company_name: formData.company_name,
        country: formData.country,
        tax_id: formData.tax_id || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postal_code: formData.postal_code || undefined,
        importer_status: formData.importer_status || undefined,
      });
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error("Error de validación");
      }
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
          tax_id: formData.tax_id,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          importer_status: formData.importer_status,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Perfil actualizado exitosamente");
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
          Información de Cliente
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} disabled />
              <p className="text-xs text-muted mt-1">El email no puede ser modificado</p>
            </div>

            <div>
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                required
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
                required
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                required
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
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
          <CardTitle className="text-text">Información Fiscal y Aduanera</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tax_id">CUIT / Tax ID</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) =>
                  setFormData({ ...formData, tax_id: e.target.value })
                }
                placeholder="Ej: 20-12345678-9"
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

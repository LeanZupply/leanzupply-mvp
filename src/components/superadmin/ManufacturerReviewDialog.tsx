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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  FileText,
  Package,
  CreditCard,
  Shield,
  Users,
  Factory,
  Truck,
  Image as ImageIcon,
  Languages
} from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

interface ManufacturerProfile {
  id: string;
  user_id: string;
  legal_name: string;
  tax_id: string;
  registered_brand: string;
  brand_logo_url: string;
  country: string;
  province: string;
  city: string;
  postal_code?: string;
  address: string;
  official_website: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  primary_contact_messaging?: string;
  secondary_contact_name?: string;
  secondary_contact_email?: string;
  secondary_contact_phone?: string;
  secondary_contact_messaging?: string;
  english_level: string;
  certifications: string[];
  vacation_dates: string;
  product_sectors: string[];
  production_capacity?: string;
  machinery?: string;
  total_employees?: number;
  facility_area_m2?: number;
  factory_positioning: string;
  factory_history: string;
  photos_production_lines: string[];
  photos_staff: string[];
  photos_machinery: string[];
  photos_warehouse: string[];
  photos_container_loading: string[];
  terms_accepted: boolean;
  verified?: boolean;
  verification_status?: string;
  verification_notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface ManufacturerReviewDialogProps {
  manufacturer: ManufacturerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const ManufacturerReviewDialog = ({
  manufacturer,
  open,
  onOpenChange,
  onUpdate,
}: ManufacturerReviewDialogProps) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!manufacturer) return null;

  // Detectar si el fabricante tiene perfil completo
  const hasCompleteProfile = manufacturer.legal_name && manufacturer.tax_id && manufacturer.registered_brand;

  const handleStatusUpdate = async (status: string) => {
    if (!notes.trim() && status !== "approved") {
      toast.error("Por favor proporciona una razón o sugerencias");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Map status to verification_status values
      const verificationStatus = status === "approved" ? "approved" 
        : status === "rejected" ? "rejected" 
        : "changes_requested";

      // Update manufacturers table if record exists
      const { error: mfgError } = await supabase
        .from("manufacturers")
        .update({
          verified: status === "approved",
          verification_status: verificationStatus,
          verification_notes: notes.trim() || null,
        })
        .eq("user_id", manufacturer.user_id);

      if (mfgError) console.error("Manufacturer update error:", mfgError);

      // Also update profiles table to keep is_verified in sync
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_verified: status === "approved",
        })
        .eq("id", manufacturer.user_id);

      if (profileError) throw profileError;

      await logActivity({
        action: `Manufacturer ${status}`,
        entity: "manufacturer",
        entity_id: manufacturer.user_id,
        metadata: { status: verificationStatus, notes: notes.trim() },
      });

      toast.success(
        status === "approved"
          ? "Fabricante aprobado exitosamente"
          : status === "rejected"
          ? "Fabricante rechazado"
          : "Cambios solicitados al fabricante"
      );

      setNotes("");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (verificationStatus?: string) => {
    switch (verificationStatus) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Aprobado</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rechazado</Badge>;
      case "changes_requested":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Cambios Solicitados</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const completenessScore = () => {
    let score = 0;
    let totalPoints = 0;
    
    // Campos básicos requeridos (1 punto cada uno)
    const basicFields = [
      manufacturer.legal_name,
      manufacturer.tax_id,
      manufacturer.registered_brand,
      manufacturer.brand_logo_url,
      manufacturer.country,
      manufacturer.province,
      manufacturer.city,
      manufacturer.address,
      manufacturer.official_website,
      manufacturer.primary_contact_name,
      manufacturer.primary_contact_email,
      manufacturer.primary_contact_phone,
      manufacturer.english_level,
      manufacturer.vacation_dates,
      manufacturer.factory_positioning,
      manufacturer.factory_history,
    ];
    
    basicFields.forEach(field => {
      totalPoints++;
      if (field && field !== '') score++;
    });
    
    // Certificaciones (1 punto)
    totalPoints++;
    if (manufacturer.certifications && manufacturer.certifications.length > 0) score++;
    
    // Sectores de productos (1 punto)
    totalPoints++;
    if (manufacturer.product_sectors && manufacturer.product_sectors.length > 0) score++;
    
    // Fotos (1 punto por cada categoría completa)
    const photoCategories = [
      manufacturer.photos_production_lines,
      manufacturer.photos_staff,
      manufacturer.photos_machinery,
      manufacturer.photos_warehouse,
      manufacturer.photos_container_loading,
    ];
    
    photoCategories.forEach(photoArray => {
      totalPoints++;
      if (photoArray && photoArray.length > 0) score++;
    });
    
    return Math.round((score / totalPoints) * 100);
  };

  const score = completenessScore();

  const renderPhotoSection = (photos: string[], title: string, icon: any) => {
    if (!photos || photos.length === 0) return null;
    
    return (
      <>
        <Separator />
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            {icon}
            {title} ({photos.length})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group"
              >
                <img
                  src={url}
                  alt={`${title} ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            Revisar Fabricante - {manufacturer.registered_brand || manufacturer.primary_contact_name}
          </DialogTitle>
          <DialogDescription>
            {hasCompleteProfile 
              ? "Revisa toda la información y fotos del fabricante antes de aprobar o rechazar"
              : "Este fabricante aún no ha completado su perfil extendido"
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            
            {/* Alerta si no hay perfil completo */}
            {!hasCompleteProfile && (
              <div className="p-4 rounded-lg bg-amber-500/10 border-2 border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                      Perfil Incompleto
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      Este fabricante se registró pero no ha completado el formulario de perfil extendido. 
                      No podrá subir productos hasta que complete su perfil y sea verificado.
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                      <strong>Solo tienes acceso a:</strong> Información básica de registro (email, nombre, empresa).
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Status y Logo */}
            <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4">
                {manufacturer.brand_logo_url && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-border bg-background">
                    <img 
                      src={manufacturer.brand_logo_url} 
                      alt="Brand Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Estado Actual</p>
                  <div className="mt-1">{getStatusBadge(manufacturer.verification_status)}</div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Completitud del Perfil</p>
                <p className="text-2xl font-bold text-foreground">{score}%</p>
              </div>
            </div>

            {/* Información Básica (siempre disponible) */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Información Básica de Registro
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre de Contacto</p>
                  <p className="font-medium text-foreground">{manufacturer.primary_contact_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{manufacturer.primary_contact_email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresa/Marca</p>
                  <p className="font-medium text-foreground">{manufacturer.registered_brand || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">País</p>
                  <p className="font-medium text-foreground">{manufacturer.country || "—"}</p>
                </div>
              </div>
            </div>

            {hasCompleteProfile && (
              <>
                <Separator />
                
                {/* Información Legal y de Empresa */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Información Legal y de Empresa
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Razón Social</p>
                      <p className="font-medium text-foreground">{manufacturer.legal_name || "—"}</p>
                    </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marca Registrada</p>
                  <p className="font-medium text-foreground">{manufacturer.registered_brand || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TAX ID / RUC</p>
                  <p className="font-medium text-foreground">{manufacturer.tax_id || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sitio Web Oficial</p>
                  {manufacturer.official_website ? (
                    <a 
                      href={manufacturer.official_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      {manufacturer.official_website}
                    </a>
                  ) : (
                    <p className="font-medium text-foreground">—</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Ubicación Completa */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación de la Planta
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">País</p>
                  <p className="font-medium text-foreground">{manufacturer.country || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Provincia/Estado</p>
                  <p className="font-medium text-foreground">{manufacturer.province || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ciudad</p>
                  <p className="font-medium text-foreground">{manufacturer.city || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código Postal</p>
                  <p className="font-medium text-foreground">{manufacturer.postal_code || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Dirección Completa</p>
                  <p className="font-medium text-foreground">{manufacturer.address || "—"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contactos */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Información de Contacto
              </h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Contacto Principal</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="text-sm font-medium">{manufacturer.primary_contact_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{manufacturer.primary_contact_email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="text-sm font-medium">{manufacturer.primary_contact_phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp/Messaging</p>
                      <p className="text-sm font-medium">{manufacturer.primary_contact_messaging || "—"}</p>
                    </div>
                  </div>
                </div>
                
                {(manufacturer.secondary_contact_name || manufacturer.secondary_contact_email) && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Contacto Secundario</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Nombre</p>
                        <p className="text-sm font-medium">{manufacturer.secondary_contact_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{manufacturer.secondary_contact_email || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <p className="text-sm font-medium">{manufacturer.secondary_contact_phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">WhatsApp/Messaging</p>
                        <p className="text-sm font-medium">{manufacturer.secondary_contact_messaging || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Capacidades y Recursos */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Capacidades de Producción y Recursos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Capacidad de Producción</p>
                  <p className="font-medium text-foreground">{manufacturer.production_capacity || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Empleados</p>
                  <p className="font-medium text-foreground">{manufacturer.total_employees || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Área de la Planta (m²)</p>
                  <p className="font-medium text-foreground">{manufacturer.facility_area_m2 ? `${manufacturer.facility_area_m2} m²` : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nivel de Inglés</p>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    {manufacturer.english_level || "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Maquinaria</p>
                  <p className="font-medium text-foreground">{manufacturer.machinery || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Fechas de Vacaciones</p>
                  <p className="font-medium text-foreground">{manufacturer.vacation_dates || "—"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sectores y Posicionamiento */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Sectores y Posicionamiento
              </h3>
              <div className="space-y-3">
                {manufacturer.product_sectors && manufacturer.product_sectors.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Sectores de Productos</p>
                    <div className="flex flex-wrap gap-2">
                      {manufacturer.product_sectors.map((sector, idx) => (
                        <Badge key={idx} variant="secondary">{sector}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Posicionamiento de la Fábrica</p>
                  <p className="text-sm font-medium bg-muted/50 p-3 rounded">{manufacturer.factory_positioning || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Historia de la Fábrica</p>
                  <p className="text-sm font-medium bg-muted/50 p-3 rounded">{manufacturer.factory_history || "—"}</p>
                </div>
              </div>
            </div>

            {/* Certificaciones */}
            {manufacturer.certifications && manufacturer.certifications.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Certificaciones
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {manufacturer.certifications.map((cert, idx) => (
                      <Badge key={idx} variant="outline" className="border-green-500/20 text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Fotos de Líneas de Producción */}
            {renderPhotoSection(
              manufacturer.photos_production_lines,
              "Fotos de Líneas de Producción",
              <Factory className="h-4 w-4" />
            )}

            {/* Fotos de Personal */}
            {renderPhotoSection(
              manufacturer.photos_staff,
              "Fotos del Personal",
              <Users className="h-4 w-4" />
            )}

            {/* Fotos de Maquinaria */}
            {renderPhotoSection(
              manufacturer.photos_machinery,
              "Fotos de Maquinaria",
              <Package className="h-4 w-4" />
            )}

            {/* Fotos de Almacén */}
            {renderPhotoSection(
              manufacturer.photos_warehouse,
              "Fotos del Almacén",
              <Building2 className="h-4 w-4" />
            )}

            {/* Fotos de Carga de Contenedores */}
            {renderPhotoSection(
              manufacturer.photos_container_loading,
              "Fotos de Carga de Contenedores",
              <Truck className="h-4 w-4" />
            )}
              </>
            )}

            {/* Notas Previas del Superadmin */}
            {manufacturer.verification_notes && (
              <>
                <Separator />
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        Notas de Revisión Anterior
                      </h3>
                      <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                        {manufacturer.verification_notes}
                      </p>
                      {manufacturer.verification_status && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-amber-700 dark:text-amber-300">Último estado:</span>
                          {getStatusBadge(manufacturer.verification_status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Área de Notas */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Notas / Razón / Sugerencias de Cambios
              </h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Proporciona razones para rechazo o sugerencias de cambios..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                * Estas notas se enviarán al fabricante como notificación
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusUpdate("changes_requested")}
            disabled={loading}
            className="border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Solicitar Cambios
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleStatusUpdate("rejected")}
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rechazar
          </Button>
          <Button
            onClick={() => handleStatusUpdate("approved")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

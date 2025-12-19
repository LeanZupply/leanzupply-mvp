import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Upload, Loader2, X, Plus, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { handleError } from "@/lib/errorHandler";
import { Separator } from "@/components/ui/separator";
import { trackFormSubmission, FORM_NAMES } from "@/lib/gtmEvents";
import { Progress } from "@/components/ui/progress";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

const profileSchema = z.object({
  legal_name: z.string().min(1, "Razón social es requerida").max(200),
  tax_id: z.string().min(1, "TAX ID es requerido").max(50),
  registered_brand: z.string().min(1, "Marca registrada es requerida").max(100),
  brand_logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  country: z.string().min(1, "País es requerido"),
  province: z.string().min(1, "Provincia es requerida"),
  city: z.string().min(1, "Ciudad es requerida"),
  postal_code: z.string().optional(),
  address: z.string().min(1, "Domicilio es requerido"),
  official_website: z.string().min(1, "Sitio web es requerido").url("URL inválida").refine(
    (url) => !url.toLowerCase().includes("alibaba") && !url.toLowerCase().includes("made-in-china"),
    "No se aceptan sitios de Alibaba o Made-in-China"
  ),
  primary_contact_name: z.string().min(1, "Nombre es requerido"),
  primary_contact_email: z.string().email("Email inválido"),
  primary_contact_phone: z.string().min(1, "Teléfono es requerido"),
  primary_contact_messaging: z.string().optional(),
  secondary_contact_name: z.string().optional(),
  secondary_contact_email: z.string().email("Email inválido").or(z.literal("")),
  secondary_contact_phone: z.string().optional(),
  secondary_contact_messaging: z.string().optional(),
  english_level: z.enum(["básico", "intermedio", "fluido", "alta capacidad"]),
  vacation_dates: z.string().min(1, "Fechas de vacaciones son requeridas"),
  production_capacity: z.string().optional(),
  machinery: z.string().optional(),
  total_employees: z.number().optional().nullable(),
  facility_area_m2: z.number().optional().nullable(),
  factory_positioning: z.string().min(1, "Posicionamiento es requerido"),
  factory_history: z.string().min(1, "Historia es requerida"),
  terms_accepted: z.boolean().refine((val) => val === true, "Debes aceptar los términos"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ManufacturerProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [productSectors, setProductSectors] = useState<string[]>([]);
  const [sectorInput, setSectorInput] = useState("");
  const [profileExists, setProfileExists] = useState(false);
  const [certError, setCertError] = useState<string>("");
  const [sectorError, setSectorError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [manufacturerStatus, setManufacturerStatus] = useState<{ 
    verified: boolean;
    verification_status?: string;
    verification_notes?: string;
  }>({ verified: false });
  const [isEditing, setIsEditing] = useState(false);
  
  // Photo states
  const [photosProductionLines, setPhotosProductionLines] = useState<string[]>([]);
  const [photosStaff, setPhotosStaff] = useState<string[]>([]);
  const [photosMachinery, setPhotosMachinery] = useState<string[]>([]);
  const [photosWarehouse, setPhotosWarehouse] = useState<string[]>([]);
  const [photosContainerLoading, setPhotosContainerLoading] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      terms_accepted: false,
    }
  });

  useEffect(() => {
    if (user) fetchManufacturerProfile();
  }, [user]);

  const fetchManufacturerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("manufacturers")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfileExists(true);
        setManufacturerStatus({ 
          verified: data.verified,
          verification_status: data.verification_status,
          verification_notes: data.verification_notes
        });
        // Cast data to match form types
        const formData = {
          ...data,
          english_level: data.english_level as "básico" | "intermedio" | "fluido" | "alta capacidad",
        };
        reset(formData as any);
        setLogoPreview(data.brand_logo_url || "");
        setCertifications(data.certifications || []);
        setProductSectors(data.product_sectors || []);
        setPhotosProductionLines(data.photos_production_lines || []);
        setPhotosStaff(data.photos_staff || []);
        setPhotosMachinery(data.photos_machinery || []);
        setPhotosWarehouse(data.photos_warehouse || []);
        setPhotosContainerLoading(data.photos_container_loading || []);
      }
    } catch (error) {
      const message = handleError("Profile fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('manufacturer-docs')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Return the public URL for display
    const { data } = supabase.storage.from('manufacturer-docs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadPhoto = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user?.id}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('manufacturer-docs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Return the public URL for display
    const { data } = supabase.storage.from('manufacturer-docs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Helper to convert stored paths to public URLs (handles both old paths and new URLs)
  const getManufacturerDocUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const { data } = supabase.storage.from('manufacturer-docs').getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: 'production_lines' | 'staff' | 'machinery' | 'warehouse' | 'container_loading',
    currentPhotos: string[],
    setPhotos: (photos: string[]) => void
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const uploadPromises = files.map(file => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`El archivo ${file.name} supera los 5MB`);
        }
        return uploadPhoto(file, category);
      });

      const urls = await Promise.all(uploadPromises);
      setPhotos([...currentPhotos, ...urls]);
      toast.success(`${files.length} foto(s) cargada(s) exitosamente`);
    } catch (error) {
      const message = handleError("Photo upload", error);
      toast.error(message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (url: string, currentPhotos: string[], setPhotos: (photos: string[]) => void) => {
    setPhotos(currentPhotos.filter(p => p !== url));
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast.error("Usuario no autenticado");
      return;
    }

    // Reset errors
    setCertError("");
    setSectorError("");
    setValidationErrors([]);

    // Collect all validation errors
    const errors: string[] = [];

    // Validate certifications
    if (certifications.length === 0) {
      setCertError("Debe agregar al menos una certificación");
      errors.push("certificaciones");
    }

    // Validate product sectors
    if (productSectors.length === 0) {
      setSectorError("Debe agregar al menos un sector de productos");
      errors.push("sectores de productos");
    }

    // Validate logo presence
    if (!logoFile && !logoPreview && !(data.brand_logo_url && data.brand_logo_url.length > 0)) {
      errors.push("logo de la marca");
    }

    // Validate at least one photo in each category
    if (photosProductionLines.length === 0) {
      errors.push("fotos de líneas de producción");
    }
    if (photosStaff.length === 0) {
      errors.push("fotos de personal");
    }
    if (photosMachinery.length === 0) {
      errors.push("fotos de maquinaria");
    }
    if (photosWarehouse.length === 0) {
      errors.push("fotos de almacén");
    }
    if (photosContainerLoading.length === 0) {
      errors.push("fotos de carga de contenedores");
    }

    // If there are validation errors, show them all
    if (errors.length > 0) {
      setValidationErrors(errors);
      const errorMessage = `Faltan los siguientes campos obligatorios: ${errors.join(", ")}`;
      toast.error(errorMessage, { duration: 6000 });
      
      // Scroll to top to show alert
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    try {
      let logoUrl = data.brand_logo_url;
      
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
        if (!logoUrl) {
          throw new Error("Error al subir el logo");
        }
      }

      const profileData = {
        user_id: user.id,
        legal_name: data.legal_name,
        tax_id: data.tax_id,
        registered_brand: data.registered_brand,
        brand_logo_url: logoUrl || "",
        country: data.country,
        province: data.province,
        city: data.city,
        postal_code: data.postal_code || "",
        address: data.address,
        official_website: data.official_website,
        primary_contact_name: data.primary_contact_name,
        primary_contact_email: data.primary_contact_email,
        primary_contact_phone: data.primary_contact_phone,
        primary_contact_messaging: data.primary_contact_messaging || "",
        secondary_contact_name: data.secondary_contact_name || "",
        secondary_contact_email: data.secondary_contact_email || "",
        secondary_contact_phone: data.secondary_contact_phone || "",
        secondary_contact_messaging: data.secondary_contact_messaging || "",
        english_level: data.english_level,
        certifications,
        vacation_dates: data.vacation_dates,
        product_sectors: productSectors,
        production_capacity: data.production_capacity || "",
        machinery: data.machinery || "",
        total_employees: data.total_employees || 0,
        facility_area_m2: data.facility_area_m2 || 0,
        factory_positioning: data.factory_positioning,
        factory_history: data.factory_history,
        photos_production_lines: photosProductionLines,
        photos_staff: photosStaff,
        photos_machinery: photosMachinery,
        photos_warehouse: photosWarehouse,
        photos_container_loading: photosContainerLoading,
        terms_accepted: data.terms_accepted,
      };

      const { error } = await supabase
        .from("manufacturers")
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      // Track successful form submission
      trackFormSubmission(FORM_NAMES.MANUFACTURER_PROFILE);

      toast.success("✅ Perfil guardado y enviado para verificación exitosamente", { duration: 5000 });
      setProfileExists(true);
      setIsEditing(false);
      setValidationErrors([]);
      await fetchManufacturerProfile();
      
      // Scroll to top to show success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      const message = error?.message || handleError("Profile save", error);
      toast.error(`Error al guardar: ${message}`, { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 2MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCertification = () => {
    if (certInput.trim() && !certifications.includes(certInput.trim())) {
      setCertifications([...certifications, certInput.trim()]);
      setCertInput("");
      setCertError(""); // Clear error when adding
    }
  };

  const removeCertification = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert));
  };

  const addProductSector = () => {
    if (sectorInput.trim() && !productSectors.includes(sectorInput.trim())) {
      setProductSectors([...productSectors, sectorInput.trim()]);
      setSectorInput("");
      setSectorError(""); // Clear error when adding
    }
  };

  const addProductSectorFromSelect = (value: string) => {
    if (value && !productSectors.includes(value)) {
      setProductSectors([...productSectors, value]);
      setSectorInput(""); // Reset select
      setSectorError(""); // Clear error when adding
    }
  };

  const removeProductSector = (sector: string) => {
    setProductSectors(productSectors.filter(s => s !== sector));
  };

  // Calcular completitud del perfil
  const calculateProfileCompleteness = () => {
    if (!profileExists) return 0;
    
    let completed = 0;
    const totalFields = 15;
    
    const watchedValues = watch();
    
    // Campos críticos (1 punto cada uno)
    if (watchedValues.legal_name) completed++;
    if (watchedValues.tax_id) completed++;
    if (watchedValues.registered_brand) completed++;
    if (logoPreview || watchedValues.brand_logo_url) completed++;
    if (watchedValues.address) completed++;
    if (watchedValues.primary_contact_phone) completed++;
    if (watchedValues.official_website) completed++;
    if (watchedValues.factory_positioning) completed++;
    if (watchedValues.factory_history) completed++;
    if (watchedValues.vacation_dates) completed++;
    if (certifications.length > 0) completed++;
    if (productSectors.length > 0) completed++;
    
    // Fotos (3 puntos - al menos una categoría con fotos)
    const hasPhotos = photosProductionLines.length > 0 || 
                     photosStaff.length > 0 || 
                     photosMachinery.length > 0 || 
                     photosWarehouse.length > 0 || 
                     photosContainerLoading.length > 0;
    if (hasPhotos) completed += 3;
    
    return Math.round((completed / totalFields) * 100);
  };

  const getMissingFields = () => {
    const missing: string[] = [];
    const watchedValues = watch();
    
    if (!watchedValues.legal_name) missing.push("Razón Social");
    if (!watchedValues.tax_id) missing.push("TAX ID");
    if (!watchedValues.registered_brand) missing.push("Marca Registrada");
    if (!logoPreview && !watchedValues.brand_logo_url) missing.push("Logo de la Marca");
    if (!watchedValues.address) missing.push("Dirección");
    if (!watchedValues.primary_contact_phone) missing.push("Teléfono de Contacto");
    if (!watchedValues.official_website) missing.push("Sitio Web Oficial");
    if (!watchedValues.factory_positioning) missing.push("Posicionamiento de la Fábrica");
    if (!watchedValues.factory_history) missing.push("Historia de la Fábrica");
    if (!watchedValues.vacation_dates) missing.push("Fechas de Vacaciones");
    if (certifications.length === 0) missing.push("Al menos una Certificación");
    if (productSectors.length === 0) missing.push("Al menos un Sector de Productos");
    
    const hasPhotos = photosProductionLines.length > 0 || 
                     photosStaff.length > 0 || 
                     photosMachinery.length > 0 || 
                     photosWarehouse.length > 0 || 
                     photosContainerLoading.length > 0;
    if (!hasPhotos) missing.push("Fotos de la Planta/Producción");
    
    return missing;
  };

  const completeness = calculateProfileCompleteness();
  const missingFields = getMissingFields();
  const isProfileComplete = completeness === 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Perfil de Fabricante</h1>
          <p className="text-muted-foreground">
            Completa tu información para poder publicar productos en la plataforma
          </p>
        </div>
        {profileExists && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Completitud del Perfil</p>
            <p className={`text-3xl font-bold ${completeness === 100 ? 'text-green-600' : completeness >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {completeness}%
            </p>
          </div>
        )}
      </div>

      {/* Alerta de Errores de Validación */}
      {validationErrors.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  ❌ No se puede enviar el perfil
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  Debes completar los siguientes campos obligatorios antes de enviar:
                </p>
                <ul className="space-y-1 mb-2">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-900 dark:text-red-100 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Perfil Incompleto */}
      {profileExists && !isProfileComplete && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  ⚠️ Perfil Incompleto - No puedes subir productos aún
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  Para poder publicar productos y ser verificado por el administrador, debes completar tu perfil al 100%. 
                  Te faltan los siguientes campos:
                </p>
                <div className="space-y-2 mb-4">
                  {missingFields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-900 dark:text-amber-100">{field}</span>
                    </div>
                  ))}
                </div>
                <Progress value={completeness} className="h-2 mb-2" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Completa todos los campos requeridos y haz clic en "Guardar/Enviar" al final del formulario.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Perfil Completo pero No Verificado */}
      {profileExists && isProfileComplete && !manufacturerStatus.verified && manufacturerStatus.verification_status !== 'changes_requested' && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  ✓ Perfil Completo - Pendiente de Verificación
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Has completado toda la información requerida. Tu perfil está siendo revisado por el administrador. 
                  Una vez aprobado, podrás comenzar a publicar productos. Te notificaremos cuando sea verificado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Cambios Solicitados */}
      {profileExists && manufacturerStatus.verification_status === 'changes_requested' && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  📝 Cambios Solicitados por el Administrador
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  El administrador ha revisado tu perfil y solicita los siguientes cambios:
                </p>
                {manufacturerStatus.verification_notes && (
                  <div className="bg-white dark:bg-gray-800 border border-amber-500/30 rounded p-3 mb-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {manufacturerStatus.verification_notes}
                    </p>
                  </div>
                )}
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Por favor realiza los cambios solicitados y vuelve a guardar tu perfil para enviarlo a revisión nuevamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Perfil Rechazado */}
      {profileExists && manufacturerStatus.verification_status === 'rejected' && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  ❌ Perfil Rechazado
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  Lamentablemente tu perfil ha sido rechazado por el administrador.
                </p>
                {manufacturerStatus.verification_notes && (
                  <div className="bg-white dark:bg-gray-800 border border-red-500/30 rounded p-3 mb-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {manufacturerStatus.verification_notes}
                    </p>
                  </div>
                )}
                <p className="text-sm text-red-700 dark:text-red-300">
                  Por favor contacta al administrador para más información.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profileExists && !isEditing && manufacturerStatus.verified && (
        <Card className={manufacturerStatus.verified ? "border-green-500/20 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${manufacturerStatus.verified ? 'text-green-600' : 'text-yellow-600'}`} />
                <p className="text-sm font-medium">
                  {manufacturerStatus.verified 
                    ? "✅ Tu perfil ha sido verificado y aprobado"
                    : "⏳ Tu perfil está pendiente de verificación por el administrador"}
                </p>
              </div>
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {profileExists && !isEditing && (
          <div className="fixed bottom-6 right-6 z-50 flex gap-2">
            <Button type="button" onClick={() => setIsEditing(true)} size="lg">
              Editar Perfil
            </Button>
          </div>
        )}
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General de la Empresa</CardTitle>
            <CardDescription>Datos legales y de registro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razón Social *</Label>
                <Input id="legal_name" {...register("legal_name")} disabled={profileExists && !isEditing} />
                {errors.legal_name && <p className="text-sm text-destructive">{errors.legal_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">TAX ID *</Label>
                <Input id="tax_id" {...register("tax_id")} disabled={profileExists && !isEditing} />
                {errors.tax_id && <p className="text-sm text-destructive">{errors.tax_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registered_brand">Marca Registrada *</Label>
                <Input id="registered_brand" {...register("registered_brand")} disabled={profileExists && !isEditing} />
                {errors.registered_brand && <p className="text-sm text-destructive">{errors.registered_brand.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="official_website">Sitio Web Oficial *</Label>
                <Input id="official_website" placeholder="https://..." {...register("official_website")} disabled={profileExists && !isEditing} />
                <p className="text-xs text-muted-foreground">Solo páginas oficiales de tu fábrica. No incluyas links de Alibaba, marketplaces u otros sitios externos.</p>
                {errors.official_website && <p className="text-sm text-destructive">{errors.official_website.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_logo">Logo de la Marca *</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={getManufacturerDocUrl(logoPreview)} alt="Logo preview" className="h-20 w-20 object-contain border rounded" />
                )}
                {(!profileExists || isEditing) && (
                  <Input
                    id="brand_logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Tamaño máximo: 2MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Input id="country" {...register("country")} disabled={profileExists && !isEditing} />
                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Provincia *</Label>
                <Input id="province" {...register("province")} disabled={profileExists && !isEditing} />
                {errors.province && <p className="text-sm text-destructive">{errors.province.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input id="city" {...register("city")} disabled={profileExists && !isEditing} />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Domicilio Completo *</Label>
                <Input id="address" {...register("address")} disabled={profileExists && !isEditing} />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input id="postal_code" {...register("postal_code")} disabled={profileExists && !isEditing} />
                {errors.postal_code && <p className="text-sm text-destructive">{errors.postal_code.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contactos */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-semibold">Contacto Primario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_contact_name">Nombre *</Label>
                <Input id="primary_contact_name" {...register("primary_contact_name")} disabled={profileExists && !isEditing} />
                {errors.primary_contact_name && <p className="text-sm text-destructive">{errors.primary_contact_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_email">Email *</Label>
                <Input type="email" id="primary_contact_email" {...register("primary_contact_email")} disabled={profileExists && !isEditing} />
                {errors.primary_contact_email && <p className="text-sm text-destructive">{errors.primary_contact_email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_phone">Teléfono *</Label>
                <Input id="primary_contact_phone" {...register("primary_contact_phone")} disabled={profileExists && !isEditing} />
                {errors.primary_contact_phone && <p className="text-sm text-destructive">{errors.primary_contact_phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_messaging">WeChat / WhatsApp</Label>
                <Input id="primary_contact_messaging" {...register("primary_contact_messaging")} disabled={profileExists && !isEditing} />
                {errors.primary_contact_messaging && <p className="text-sm text-destructive">{errors.primary_contact_messaging.message}</p>}
              </div>
            </div>

            <Separator />
            <h3 className="text-sm font-semibold">Contacto Secundario (Opcional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="secondary_contact_name">Nombre</Label>
                <Input id="secondary_contact_name" {...register("secondary_contact_name")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_contact_email">Email</Label>
                <Input type="email" id="secondary_contact_email" {...register("secondary_contact_email")} />
                {errors.secondary_contact_email && <p className="text-sm text-destructive">{errors.secondary_contact_email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_contact_phone">Teléfono</Label>
                <Input id="secondary_contact_phone" {...register("secondary_contact_phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_contact_messaging">WeChat / WhatsApp</Label>
                <Input id="secondary_contact_messaging" {...register("secondary_contact_messaging")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="english_level">Nivel de Inglés *</Label>
              <Select onValueChange={(value) => setValue("english_level", value as any)} defaultValue={watch("english_level")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="básico">Básico</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="fluido">Fluido</SelectItem>
                  <SelectItem value="alta capacidad">Alta Capacidad</SelectItem>
                </SelectContent>
              </Select>
              {errors.english_level && <p className="text-sm text-destructive">{errors.english_level.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Capacidades Operativas */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Operativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Certificaciones *</Label>
              <div className="flex gap-2">
                <Input
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  placeholder="Ej: ISO 9001, CE, FDA"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" onClick={addCertification} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {certifications.map((cert) => (
                  <Badge key={cert} variant="secondary" className="gap-1">
                    {cert}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeCertification(cert)} />
                  </Badge>
                ))}
              </div>
              {certError && <p className="text-sm text-destructive">{certError}</p>}
              {certifications.length === 0 && (
                <p className="text-xs text-muted-foreground">Agregue al menos una certificación</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vacation_dates">Fechas de Cierre por Vacaciones *</Label>
              <Input id="vacation_dates" placeholder="Ej: Del 1 al 15 de enero" {...register("vacation_dates")} />
              {errors.vacation_dates && <p className="text-sm text-destructive">{errors.vacation_dates.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Sectores o Categorías Principales *</Label>
              <Select
                value={sectorInput}
                onValueChange={(value) => {
                  setSectorInput(value);
                  addProductSectorFromSelect(value);
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {PRODUCT_CATEGORIES.filter(cat => !productSectors.includes(cat)).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {productSectors.map((sector) => (
                  <Badge key={sector} variant="secondary" className="gap-1">
                    {sector}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeProductSector(sector)} />
                  </Badge>
                ))}
              </div>
              {sectorError && <p className="text-sm text-destructive">{sectorError}</p>}
              {productSectors.length === 0 && (
                <p className="text-xs text-muted-foreground">Seleccione al menos una categoría</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="production_capacity">Capacidad de Producción</Label>
                <Textarea id="production_capacity" {...register("production_capacity")} disabled={profileExists && !isEditing} />
                {errors.production_capacity && <p className="text-sm text-destructive">{errors.production_capacity.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="machinery">Maquinaria Instalada</Label>
                <Textarea id="machinery" {...register("machinery")} disabled={profileExists && !isEditing} />
                {errors.machinery && <p className="text-sm text-destructive">{errors.machinery.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_employees">Número de Empleados</Label>
                <Input
                  id="total_employees"
                  type="number"
                  {...register("total_employees", { valueAsNumber: true })}
                  disabled={profileExists && !isEditing}
                />
                {errors.total_employees && <p className="text-sm text-destructive">{errors.total_employees.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility_area_m2">Metros Cuadrados Totales</Label>
                <Input
                  id="facility_area_m2"
                  type="number"
                  {...register("facility_area_m2", { valueAsNumber: true })}
                  disabled={profileExists && !isEditing}
                />
                {errors.facility_area_m2&& <p className="text-sm text-destructive">{errors.facility_area_m2.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="factory_positioning">Posicionamiento Actual de la Fábrica *</Label>
              <Textarea id="factory_positioning" {...register("factory_positioning")} />
              {errors.factory_positioning && <p className="text-sm text-destructive">{errors.factory_positioning.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="factory_history">Historia Breve y Planes Futuros *</Label>
              <Textarea id="factory_history" {...register("factory_history")} />
              {errors.factory_history && <p className="text-sm text-destructive">{errors.factory_history.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Evidencia Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Evidencia Visual</CardTitle>
            <CardDescription>
              Fotografías recientes de las instalaciones y operaciones (máximo 5MB por foto)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Líneas de Producción */}
            <div className="space-y-2">
              <Label>Líneas de Producción</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e, 'production_lines', photosProductionLines, setPhotosProductionLines)}
                disabled={uploadingPhoto}
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {photosProductionLines.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={getManufacturerDocUrl(url)} alt="Línea de producción" className="w-full h-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url, photosProductionLines, setPhotosProductionLines)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trabajadores/Personal */}
            <div className="space-y-2">
              <Label>Trabajadores / Personal</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e, 'staff', photosStaff, setPhotosStaff)}
                disabled={uploadingPhoto}
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {photosStaff.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={getManufacturerDocUrl(url)} alt="Personal" className="w-full h-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url, photosStaff, setPhotosStaff)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Maquinaria */}
            <div className="space-y-2">
              <Label>Maquinaria</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e, 'machinery', photosMachinery, setPhotosMachinery)}
                disabled={uploadingPhoto}
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {photosMachinery.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={getManufacturerDocUrl(url)} alt="Maquinaria" className="w-full h-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url, photosMachinery, setPhotosMachinery)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Almacén */}
            <div className="space-y-2">
              <Label>Almacén</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e, 'warehouse', photosWarehouse, setPhotosWarehouse)}
                disabled={uploadingPhoto}
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {photosWarehouse.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={getManufacturerDocUrl(url)} alt="Almacén" className="w-full h-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url, photosWarehouse, setPhotosWarehouse)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Carga de Contenedores */}
            <div className="space-y-2">
              <Label>Carga de Contenedores o Preparación de Palés para Exportación</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e, 'container_loading', photosContainerLoading, setPhotosContainerLoading)}
                disabled={uploadingPhoto}
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {photosContainerLoading.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={getManufacturerDocUrl(url)} alt="Carga de contenedor" className="w-full h-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url, photosContainerLoading, setPhotosContainerLoading)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {uploadingPhoto && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo fotografías...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Términos y Condiciones */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms_accepted"
                checked={watch("terms_accepted")}
                onCheckedChange={(checked) => setValue("terms_accepted", checked as boolean)}
              />
              <Label htmlFor="terms_accepted" className="text-sm cursor-pointer">
                Confirmo que la información proporcionada es veraz y acepto los Términos y Condiciones de "LeanZupply".
              </Label>
            </div>
            {errors.terms_accepted && <p className="text-sm text-destructive">{errors.terms_accepted.message}</p>}

            {(!profileExists || isEditing) && (
              <div className="flex gap-2">
                {isEditing && (
                  <Button type="button" onClick={() => { setIsEditing(false); fetchManufacturerProfile(); }} variant="outline" className="flex-1" size="lg">
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={saving} className="flex-1" size="lg">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    isEditing ? "Guardar Cambios" : "Guardar y Enviar para Verificación"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

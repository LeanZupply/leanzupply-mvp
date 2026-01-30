import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Package, Loader2, X, AlertCircle, ArrowLeft, Upload, AlertTriangle, Eye } from "lucide-react";
import { handleError } from "@/lib/errorHandler";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trackFormSubmission, FORM_NAMES } from "@/lib/gtmEvents";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { calculateOrderTotal, getApplicableDiscount } from "@/lib/priceCalculations";
import { formatNumber } from "@/lib/formatters";
import { DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { compressImage, getProductImageCompressionOptions, validateFileSize } from "@/lib/imageCompression";
import { ZodError } from "zod";
interface ProductImage {
  url: string;
  alt: string;
}
interface Certificate {
  name: string;
  file_url: string;
}
export default function ProductCreate() {
  const {
    user,
    profile
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [commissionConfirmed, setCommissionConfirmed] = useState(false);
  const [registeredBrand, setRegisteredBrand] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [previewQuantity, setPreviewQuantity] = useState(1);
  useEffect(() => {
    if (user) {
      checkManufacturerProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const checkManufacturerProfile = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("manufacturers").select("id, legal_name, tax_id, registered_brand").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      const isComplete = !!data && !!data.legal_name && !!data.tax_id && !!data.registered_brand;
      if (!isComplete) {
        toast.error("Debes completar tu perfil de fabricante antes de cargar productos");
        navigate("/manufacturer/profile");
      } else {
        // Guardar la marca registrada y pre-llenar el campo
        setRegisteredBrand(data.registered_brand);
        setFormData(prev => ({
          ...prev,
          brand: data.registered_brand
        }));
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      toast.error("Error al verificar perfil");
      navigate("/manufacturer/products");
    } finally {
      setCheckingProfile(false);
    }
  };
  const [formData, setFormData] = useState({
    // Información Básica
    name: "",
    model: "",
    brand: "",
    sku: "",
    category: "",
    subcategory: "",
    description: "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
    weight_net_kg: "",
    // Empaque y Plazos
    packaging_length_cm: "",
    packaging_width_cm: "",
    packaging_height_cm: "",
    weight_gross_kg: "",
    packaging_type: "",
    lead_time_production_days: "",
    lead_time_logistics_days: "",
    // Notas especiales transporte/aduana
    transport_notes: "",
    hs_code: "",
    // Precio y Disponibilidad
    price_unit: "",
    delivery_port: "",
    stock: "",
    discount_3u: "",
    discount_5u: "",
    discount_8u: "",
    discount_10u: "",
    moq: "",
    // Garantía y Términos
    warranty_terms: "",
    service_terms: ""
  });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [certifications, setCertifications] = useState<Certificate[]>([]);
  const [technicalDocs, setTechnicalDocs] = useState<Certificate[]>([]);
  const uploadToBucket = async (bucket: "product-images" | "product-docs", file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${user?.id}/${crypto.randomUUID()}.${ext}`;
    const {
      error
    } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: true
    });
    if (error) throw error;
    // Para documentos, guardamos solo la ruta interna
    if (bucket === "product-docs") {
      return fileName;
    }
    const {
      data: urlData
    } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      // Compress images before uploading
      toast.info("Comprimiendo imágenes...");
      const compressedFiles = await Promise.all(
        Array.from(files).map(file => 
          compressImage(file, getProductImageCompressionOptions())
        )
      );
      
      toast.info("Subiendo imágenes comprimidas...");
      const uploadPromises = compressedFiles.map(async (compressedFile, index) => {
        // Validate file size after compression (bucket limit is 5MB, but we target 150KB)
        validateFileSize(compressedFile, 5, "archivo de imagen");
        
        const url = await uploadToBucket("product-images", compressedFile);
        return {
          url,
          alt: files[index].name
        };
      });
      const newImages = await Promise.all(uploadPromises);
      setImages([...images, ...newImages]);
      toast.success("Archivos subidos correctamente");
    } catch (error) {
      const message = handleError("Image upload", error);
      toast.error(message);
    } finally {
      setUploadingImages(false);
    }
  };
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "cert" | "tech") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDocs(true);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const url = await uploadToBucket("product-docs", file);
        return {
          name: file.name,
          file_url: url
        };
      });
      const newDocs = await Promise.all(uploadPromises);
      if (type === "cert") {
        setCertifications([...certifications, ...newDocs]);
      } else {
        setTechnicalDocs([...technicalDocs, ...newDocs]);
      }
      toast.success("Documentos subidos correctamente");
    } catch (error) {
      const message = handleError("Document upload", error);
      toast.error(message);
    } finally {
      setUploadingDocs(false);
    }
  };
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  const removeDoc = (index: number, type: "cert" | "tech") => {
    if (type === "cert") {
      setCertifications(certifications.filter((_, i) => i !== index));
    } else {
      setTechnicalDocs(technicalDocs.filter((_, i) => i !== index));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.category || !formData.price_unit || !formData.moq) {
      toast.error("Por favor completa todos los campos obligatorios marcados con *");
      return;
    }
    if (!commissionConfirmed) {
      toast.error("Debes confirmar los términos de comisión del 12%");
      return;
    }

    // Validate with Zod schema
    try {
      const {
        productSchema
      } = await import('@/lib/validationSchemas');
      const validationData = {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        description: formData.description || undefined,
        price_unit: Number(formData.price_unit),
        moq: Number(formData.moq),
        stock: Number(formData.stock || 0),
        length_cm: formData.length_cm ? Number(formData.length_cm) : undefined,
        width_cm: formData.width_cm ? Number(formData.width_cm) : undefined,
        height_cm: formData.height_cm ? Number(formData.height_cm) : undefined,
        weight_net_kg: formData.weight_net_kg ? Number(formData.weight_net_kg) : undefined,
        weight_gross_kg: formData.weight_gross_kg ? Number(formData.weight_gross_kg) : undefined,
        lead_time_production_days: formData.lead_time_production_days ? Number(formData.lead_time_production_days) : undefined,
        lead_time_logistics_days: formData.lead_time_logistics_days ? Number(formData.lead_time_logistics_days) : undefined,
        sku: formData.sku || undefined,
        model: formData.model || undefined
      };
      productSchema.parse(validationData);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        error.errors.forEach((err) => toast.error(err.message));
      } else {
        toast.error("Error de validación en los datos del producto");
      }
      return;
    }
    setLoading(true);
    try {
      const volume = formData.packaging_length_cm && formData.packaging_width_cm && formData.packaging_height_cm ? Number(formData.packaging_length_cm) * Number(formData.packaging_width_cm) * Number(formData.packaging_height_cm) / 1000000 : null;
      const payload = {
        // Información básica
        name: formData.name.trim(),
        model: formData.model?.trim() || null,
        brand: formData.brand?.trim() || null,
        sku: formData.sku?.trim() || null,
        category: formData.category,
        subcategory: formData.subcategory?.trim() || null,
        description: formData.description?.trim() || null,
        images: images.length > 0 ? JSON.stringify(images) : JSON.stringify([]),
        // Dimensiones NETO
        length_cm: formData.length_cm ? Number(formData.length_cm) : null,
        width_cm: formData.width_cm ? Number(formData.width_cm) : null,
        height_cm: formData.height_cm ? Number(formData.height_cm) : null,
        weight_net_kg: formData.weight_net_kg ? Number(formData.weight_net_kg) : null,
        // Empaque y plazos (BRUTO)
        packaging_length_cm: formData.packaging_length_cm ? Number(formData.packaging_length_cm) : null,
        packaging_width_cm: formData.packaging_width_cm ? Number(formData.packaging_width_cm) : null,
        packaging_height_cm: formData.packaging_height_cm ? Number(formData.packaging_height_cm) : null,
        weight_gross_kg: formData.weight_gross_kg ? Number(formData.weight_gross_kg) : null,
        volume_m3: volume,
        packaging_type: formData.packaging_type?.trim() || null,
        lead_time_production_days: formData.lead_time_production_days ? Number(formData.lead_time_production_days) : null,
        lead_time_logistics_days: formData.lead_time_logistics_days ? Number(formData.lead_time_logistics_days) : null,
        // Notas especiales transporte/aduana
        transport_notes: formData.transport_notes?.trim() || null,
        hs_code: formData.hs_code?.trim() || null,
        // Documentación
        certifications: certifications.length > 0 ? JSON.stringify(certifications) : JSON.stringify([]),
        technical_docs: technicalDocs.length > 0 ? JSON.stringify(technicalDocs) : JSON.stringify([]),
        // Precio y disponibilidad
        price_unit: Number(formData.price_unit),
        // Nota: "condition" en la DB corresponde al estado del producto (new/used), no al INCOTERM
        // Para evitar violar el constraint products_condition_check lo dejamos como null salvo que el usuario lo elija
        condition: null,
        delivery_port: formData.delivery_port?.trim() || null,
        stock: formData.stock ? Number(formData.stock) : 0,
        discount_3u: formData.discount_3u ? Number(formData.discount_3u) : null,
        discount_5u: formData.discount_5u ? Number(formData.discount_5u) : null,
        discount_8u: formData.discount_8u ? Number(formData.discount_8u) : null,
        discount_10u: formData.discount_10u ? Number(formData.discount_10u) : null,
        moq: Number(formData.moq),
        // Garantía y términos
        warranty_terms: formData.warranty_terms?.trim() || null,
        service_terms: formData.service_terms?.trim() || null,
        manufacturer_id: user?.id,
        status: "pending"
      };
      console.log("Payload being sent:", payload);
      const {
        data,
        error
      } = await supabase.from("products").insert(payload).select("id").maybeSingle();
      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      // Track successful product creation
      trackFormSubmission(FORM_NAMES.PRODUCT_CREATE);

      toast.success("Tu producto fue enviado para revisión. Te notificaremos cuando sea aprobado.");
      navigate("/manufacturer/products");
    } catch (error: unknown) {
      console.error("Product creation error:", error);
      const message = handleError("Product creation", error);
      toast.error(message || "Error al crear el producto. Verifica todos los campos.");
    } finally {
      setLoading(false);
    }
  };
  if (!profile?.is_verified) {
    return <div className="p-6 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/manufacturer/products")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a productos
        </Button>

        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Verificación Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Tu cuenta de fabricante debe ser verificada por el administrador antes de que puedas cargar productos.
            </p>
            <Button onClick={() => navigate("/manufacturer/profile")} className="mt-4">
              Ir a Mi Perfil
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  if (checkingProfile) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="p-6 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/manufacturer/products")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a productos
      </Button>

      <h1 className="text-3xl font-bold mb-2">CARGAR PRODUCTO</h1>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* INFORMACIÓN BÁSICA */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Título del Producto *</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" value={formData.model} onChange={e => setFormData({
                ...formData,
                model: e.target.value
              })} />
              </div>
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" value={formData.brand} disabled className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="sku">SKU (uso interno)</Label>
                <Input id="sku" value={formData.sku} onChange={e => setFormData({
                ...formData,
                sku: e.target.value
              })} placeholder="Para identificación interna" />
                <p className="text-xs text-muted-foreground mt-1">No se mostrará públicamente</p>
              </div>
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select value={formData.category} onValueChange={value => setFormData({
                ...formData,
                category: value
              })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Detallar producción, capacidad, tipo de uso (intensivo, liviano o intermedio), construcción, materiales, componentes, información relevante y certera.
              </p>
              <Textarea id="description" rows={5} value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} />
            </div>

            <div>
              <Label className="mb-2 block">Dimensiones y Peso NETO (sin embalaje)</Label>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="length" className="text-xs">Largo (mm)</Label>
                  <Input id="length" type="number" step="0.01" value={formData.length_cm} onChange={e => setFormData({
                  ...formData,
                  length_cm: e.target.value
                })} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="width" className="text-xs">Ancho (mm)</Label>
                  <Input id="width" type="number" step="0.01" value={formData.width_cm} onChange={e => setFormData({
                  ...formData,
                  width_cm: e.target.value
                })} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs">Alto (mm)</Label>
                  <Input id="height" type="number" step="0.01" value={formData.height_cm} onChange={e => setFormData({
                  ...formData,
                  height_cm: e.target.value
                })} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="weight_net" className="text-xs">Peso (kg)</Label>
                  <Input id="weight_net" type="number" step="0.01" value={formData.weight_net_kg} onChange={e => setFormData({
                  ...formData,
                  weight_net_kg: e.target.value
                })} placeholder="0.00" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARGAR ARCHIVOS - Fotos y Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Cargar Archivos → Fotos y Videos</CardTitle>
            <CardDescription className="text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              DEBE RESPONDER EXACTAMENTE AL MISMO MODELO, SKU Y MARCA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="images" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadingImages ? "Subiendo..." : "Haz clic para subir fotos y videos"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos: JPG, PNG, WEBP, MP4, WEBM
                  </p>
                </div>
                <Input id="images" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" onChange={handleImageUpload} disabled={uploadingImages} />
              </Label>
              {images.length > 0 && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, idx) => <div key={idx} className="relative group">
                      {img.url.includes('.mp4') || img.url.includes('.webm') ? <video src={img.url} className="w-full h-32 object-cover rounded-lg" controls /> : <img src={img.url} alt={img.alt} className="w-full h-32 object-cover rounded-lg" />}
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>)}
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* CARGAR ARCHIVOS - Documentación Técnica */}
        <Card>
          <CardHeader>
            <CardTitle>Cargar Archivos → Documentación Técnica</CardTitle>
            <CardDescription className="text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              Manuales de usuario, ficha técnica, instrucciones de uso y mantenimiento. DEBE RESPONDER EXACTAMENTE AL MISMO MODELO, SKU Y MARCA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="techdocs" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadingDocs ? "Subiendo..." : "Subir documentación técnica (PDF, DOC)"}
                  </p>
                </div>
                <Input id="techdocs" type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleDocUpload(e, "tech")} disabled={uploadingDocs} />
              </Label>
              {technicalDocs.length > 0 && <ul className="space-y-2">
                  {technicalDocs.map((doc, idx) => <li key={idx} className="flex items-center justify-between p-2 bg-accent/50 rounded">
                      <span className="text-sm">{doc.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDoc(idx, "tech")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>)}
                </ul>}
            </div>
          </CardContent>
        </Card>

        {/* CARGAR ARCHIVOS - Certificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Cargar Archivos → Certificaciones</CardTitle>
            <CardDescription className="text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              DEBE RESPONDER EXACTAMENTE AL MISMO MODELO, SKU Y MARCA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="certs" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadingDocs ? "Subiendo..." : "Subir certificados (PDF, imágenes)"}
                  </p>
                </div>
                <Input id="certs" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleDocUpload(e, "cert")} disabled={uploadingDocs} />
              </Label>
              {certifications.length > 0 && <ul className="space-y-2">
                  {certifications.map((cert, idx) => <li key={idx} className="flex items-center justify-between p-2 bg-accent/50 rounded">
                      <span className="text-sm">{cert.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDoc(idx, "cert")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>)}
                </ul>}
            </div>
          </CardContent>
        </Card>

        {/* EMPAQUE Y PLAZOS */}
        <Card>
          <CardHeader>
            <CardTitle>Empaque y Plazos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Dimensiones Bruto (incluye embalaje - cm)</Label>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="pack_length" className="text-xs">Largo (cm)</Label>
                  <Input id="pack_length" type="number" step="0.01" value={formData.packaging_length_cm} onChange={e => setFormData({
                  ...formData,
                  packaging_length_cm: e.target.value
                })} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="pack_width" className="text-xs">Ancho (cm)</Label>
                  <Input id="pack_width" type="number" step="0.01" value={formData.packaging_width_cm} onChange={e => setFormData({
                  ...formData,
                  packaging_width_cm: e.target.value
                })} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="pack_height" className="text-xs">Alto (cm)</Label>
                  <Input id="pack_height" type="number" step="0.01" value={formData.packaging_height_cm} onChange={e => setFormData({
                  ...formData,
                  packaging_height_cm: e.target.value
                })} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="volume_calc" className="text-xs">Volumen (m³)</Label>
                  <Input id="volume_calc" type="text" value={formData.packaging_length_cm && formData.packaging_width_cm && formData.packaging_height_cm ? formatNumber(Number(formData.packaging_length_cm) * Number(formData.packaging_width_cm) * Number(formData.packaging_height_cm) / 1000000, 4, 4) : "0,0000"} disabled className="bg-muted" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="weight_gross">Peso Bruto (kg, incluye embalaje)</Label>
                <Input id="weight_gross" type="number" step="0.01" value={formData.weight_gross_kg} onChange={e => setFormData({
                ...formData,
                weight_gross_kg: e.target.value
              })} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="packaging">Tipo de Embalaje</Label>
                <Input id="packaging" value={formData.packaging_type} onChange={e => setFormData({
                ...formData,
                packaging_type: e.target.value
              })} placeholder="Ej: caja de cartón, pallet, cajón de madera, etc." />
              </div>
              <div>
                <Label htmlFor="lead_prod">Tiempo de Producción (días)</Label>
                <Input id="lead_prod" type="number" value={formData.lead_time_production_days} onChange={e => setFormData({
                ...formData,
                lead_time_production_days: e.target.value
              })} placeholder="X días" />
              </div>
              <div>
                <Label htmlFor="lead_log">Tiempo de Logística (días)</Label>
                <p className="text-xs text-muted-foreground mb-1">Hasta Puerto de Origen seleccionado</p>
                <Input id="lead_log" type="number" value={formData.lead_time_logistics_days} onChange={e => setFormData({
                ...formData,
                lead_time_logistics_days: e.target.value
              })} placeholder="X días" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NOTAS ESPECIALES DE TRANSPORTE / ADUANA */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Especiales de Transporte / Aduana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hs_code">Código HS Sugerido</Label>
              <Input id="hs_code" value={formData.hs_code} onChange={e => setFormData({
              ...formData,
              hs_code: e.target.value
            })} placeholder="Ej: 8418.50.00" />
            </div>
            <div>
              <Label htmlFor="transport_notes">Información Relevante</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Gases refrigerantes / Aceites / Componentes Lubricados / Electrónica / Sensores / Placas de control / Cristales / Piezas Frágiles / Información relevante para despacho aduanero o transporte marítimo hacia Unión Europea
              </p>
              <Textarea id="transport_notes" rows={4} value={formData.transport_notes} onChange={e => setFormData({
              ...formData,
              transport_notes: e.target.value
            })} placeholder="Describe cualquier requisito especial de declaración, notas de mercancías peligrosas, etc." />
            </div>
          </CardContent>
        </Card>

        {/* PRECIO Y DISPONIBILIDAD */}
        <Card>
          <CardHeader>
            <CardTitle>Precio y Disponibilidad</CardTitle>
            <CardDescription className="text-warning">
              DE ESTE PRECIO x CANTIDADES SE RETENDRÁ EL 12% DE COMISIÓN
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="price">Precio Unitario EUR *</Label>
                <Input id="price" type="number" step="0.01" value={formData.price_unit} onChange={e => setFormData({
                ...formData,
                price_unit: e.target.value
              })} required placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="condition">Condición</Label>
                <Input id="condition" value="FOB" disabled className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="delivery_port">Puerto de Entrega</Label>
                <Select value={formData.delivery_port} onValueChange={value => setFormData({
                ...formData,
                delivery_port: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona puerto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tianjin">Tianjin</SelectItem>
                    <SelectItem value="Qingdao">Qingdao</SelectItem>
                    <SelectItem value="Shanghai">Shanghai</SelectItem>
                    <SelectItem value="Ningbo">Ningbo</SelectItem>
                    <SelectItem value="Xiamen">Xiamen</SelectItem>
                    <SelectItem value="Shenzhen">Shenzhen</SelectItem>
                    <SelectItem value="Guangzhou">Guangzhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stock">Stock Disponible</Label>
                <p className="text-xs text-muted-foreground mb-1">Para entrega inmediata desde almacén en fábrica</p>
                <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({
                ...formData,
                stock: e.target.value
              })} placeholder="0" />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Descuento por Cantidad</Label>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="disc_3" className="text-xs">3 uds (%)</Label>
                  <Input id="disc_3" type="number" step="0.01" max="100" value={formData.discount_3u} onChange={e => setFormData({
                  ...formData,
                  discount_3u: e.target.value
                })} placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="disc_5" className="text-xs">5 uds (%)</Label>
                  <Input id="disc_5" type="number" step="0.01" max="100" value={formData.discount_5u} onChange={e => setFormData({
                  ...formData,
                  discount_5u: e.target.value
                })} placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="disc_8" className="text-xs">8 uds (%)</Label>
                  <Input id="disc_8" type="number" step="0.01" max="100" value={formData.discount_8u} onChange={e => setFormData({
                  ...formData,
                  discount_8u: e.target.value
                })} placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="disc_10" className="text-xs">10 uds (%)</Label>
                  <Input id="disc_10" type="number" step="0.01" max="100" value={formData.discount_10u} onChange={e => setFormData({
                  ...formData,
                  discount_10u: e.target.value
                })} placeholder="0" />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="moq">MOQ - Cantidad Mínima *</Label>
              <Input id="moq" type="number" value={formData.moq} onChange={e => setFormData({
              ...formData,
              moq: e.target.value
            })} required placeholder="1" />
            </div>
          </CardContent>
        </Card>

        {/* PREVIEW DE CÁLCULO PARA COMPRADORES */}
        <Card className="border-primary/50">
          <CardHeader>
            <Collapsible open={showPreview} onOpenChange={setShowPreview}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <CardTitle>Preview:</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm">
                    {showPreview ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CardDescription className="mt-2">
                Este es el desglose automático que verán los compradores con todos los costos logísticos e impuestos incluidos para España
              </CardDescription>
              <CollapsibleContent className="space-y-4 mt-4">
                {formData.price_unit && formData.packaging_length_cm && formData.packaging_width_cm && formData.packaging_height_cm ? <>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Los costos se calculan automáticamente
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Este preview usa los parámetros logísticos de España (flete €115/m³, seguro 1%, gastos destino €350, arancel 3%, IVA 21%). Los compradores verán este desglose actualizado en tiempo real según su destino.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <Label htmlFor="preview_quantity" className="text-sm">Simular cantidad (para ver descuentos)</Label>
                        <Input id="preview_quantity" type="number" min={formData.moq || 1} value={previewQuantity} onChange={e => setPreviewQuantity(parseInt(e.target.value) || 1)} onFocus={e => e.target.select()} placeholder="1" className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.moq && previewQuantity < Number(formData.moq) ? `⚠️ Cantidad menor al MOQ (${formData.moq})` : `✓ Cantidad válida`}
                        </p>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Volumen total ({previewQuantity} {previewQuantity === 1 ? 'unidad' : 'unidades'})</p>
                          <p className="text-lg font-semibold">
                            {formatNumber(Number(formData.packaging_length_cm) * Number(formData.packaging_width_cm) * Number(formData.packaging_height_cm) / 1000000 * previewQuantity, 3, 3)} m³
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatNumber(Number(formData.packaging_length_cm) * Number(formData.packaging_width_cm) * Number(formData.packaging_height_cm) / 1000000, 4, 4)} m³ por unidad
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comisión de Plataforma */}
                    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          Comisión de Plataforma
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Precio Unitario</p>
                            <p className="text-xl font-semibold">€{formatNumber(Number(formData.price_unit || 0))}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Cantidad</p>
                            <p className="text-xl font-semibold">{previewQuantity}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          {(() => {
                        const basePrice = Number(formData.price_unit || 0);
                        const discounts = {
                          discount_3u: formData.discount_3u ? Number(formData.discount_3u) : null,
                          discount_5u: formData.discount_5u ? Number(formData.discount_5u) : null,
                          discount_8u: formData.discount_8u ? Number(formData.discount_8u) : null,
                          discount_10u: formData.discount_10u ? Number(formData.discount_10u) : null
                        };
                        const applicableDiscount = getApplicableDiscount(previewQuantity, discounts);
                        const totalFOB = calculateOrderTotal(basePrice, previewQuantity, discounts);
                        const commission = totalFOB * 0.12;
                        const netProfit = totalFOB * 0.88;
                        return <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Precio Base Total (FOB)</span>
                                  <span className="font-medium">€{formatNumber(basePrice * previewQuantity)}</span>
                                </div>
                                {applicableDiscount > 0 && <div className="flex justify-between text-green-600 dark:text-green-400">
                                    <span>Descuento por Volumen (-{applicableDiscount}%)</span>
                                    <span className="font-medium">-€{formatNumber(basePrice * previewQuantity - totalFOB)}</span>
                                  </div>}
                                {applicableDiscount > 0 && <div className="flex justify-between font-semibold">
                                    <span className="text-muted-foreground">Precio Total con Descuento</span>
                                    <span className="font-medium">€{formatNumber(totalFOB)}</span>
                                  </div>}
                                <div className="flex justify-between text-amber-600 dark:text-amber-500">
                                  <span>Comisión Plataforma (12%)</span>
                                  <span className="font-medium">-€{formatNumber(commission)}</span>
                                </div>
                              </>;
                      })()}
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center bg-primary/5 dark:bg-primary/10 p-4 rounded-lg">
                          <span className="text-lg font-semibold">Tu Saldo Neto a Cobrar Será</span>
                          <span className="text-2xl font-bold text-primary">€{(() => {
                          const basePrice = Number(formData.price_unit || 0);
                          const discounts = {
                            discount_3u: formData.discount_3u ? Number(formData.discount_3u) : null,
                            discount_5u: formData.discount_5u ? Number(formData.discount_5u) : null,
                            discount_8u: formData.discount_8u ? Number(formData.discount_8u) : null,
                            discount_10u: formData.discount_10u ? Number(formData.discount_10u) : null
                          };
                          const totalFOB = calculateOrderTotal(basePrice, previewQuantity, discounts);
                          return formatNumber(totalFOB * 0.88);
                        })()}</span>
                        </div>

                        <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="ml-2 text-sm text-amber-900 dark:text-amber-100">
                            <div className="space-y-2">
                              <p className="font-semibold">COSTE POR VENDER EN LA PLATAFORMA:</p>
                              <p>COMISIÓN DEL 12% SE APLICA SOBRE EL PRECIO TOTAL DE VENTA (PRECIO UNITARIO POR CANTIDAD PEDIDA MENOS LOS DESCUENTOS).</p>
                              <p className="italic">Ejemplo: Precio Unitario 250 EUR x 3 unidades = 750 EUR, descuento 1% por cantidad = 742,5€ → Comisión LeanZupply = 89,1 EUR</p>
                              <p className="font-semibold">SE COBRARÁ SÓLO CUANDO SE EFECTÚE LA VENTA.</p>
                              <p className="text-xs">(Aclaraciones legales y contractuales en Términos y Condiciones de "La Plataforma LeanZupply" con "Usuarios Fabricantes")</p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </> : <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      Completa el precio unitario para ver el cálculo de comisión
                    </AlertDescription>
                  </Alert>}
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* GARANTÍA, SERVICIO TÉCNICO, TÉRMINOS Y CONDICIONES */}
        <Card>
          <CardHeader>
            <CardTitle>Garantía, Servicio Técnico, Términos y Condiciones de Fábrica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="warranty">Términos de Garantía</Label>
              <Textarea id="warranty" rows={3} value={formData.warranty_terms} onChange={e => setFormData({
              ...formData,
              warranty_terms: e.target.value
            })} placeholder="Describe los términos de garantía del producto" />
            </div>
            <div>
              <Label htmlFor="service">Servicio Técnico y Términos</Label>
              <Textarea id="service" rows={3} value={formData.service_terms} onChange={e => setFormData({
              ...formData,
              service_terms: e.target.value
            })} placeholder="Describe servicio técnico, soporte y términos de fábrica" />
            </div>
          </CardContent>
        </Card>

        {/* CONFIRMACIÓN DE COMISIÓN */}
        <Card className="border-primary">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <p className="font-semibold">COSTE POR VENDER EN LA PLATAFORMA:</p>
                  <p>
                    <strong>COMISIÓN DEL 12%</strong> SE APLICA SOBRE EL PRECIO TOTAL DE VENTA (PRECIO UNITARIO POR CANTIDAD PEDIDA).
                  </p>
                  <p className="text-sm">
                    Ejemplo: Precio Unitario 250 EUR x 3 unidades = 750 EUR, Comisión LeanZupply = 90 EUR
                  </p>
                  <p className="text-sm">
                    SE COBRARÁ SÓLO CUANDO SE EFECTÚE LA VENTA.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    (Aclaraciones legales y contractuales en Términos y Condiciones de "La Plataforma LeanZupply" con "Usuarios Fabricantes")
                  </p>
                  
                  <div className="flex items-start gap-2 mt-4 pt-4 border-t">
                    <Checkbox id="commission" checked={commissionConfirmed} onCheckedChange={checked => setCommissionConfirmed(checked as boolean)} />
                    <label htmlFor="commission" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      CONFIRMAR términos de comisión del 12% *
                    </label>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* BOTONES */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/manufacturer/products")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !commissionConfirmed}>
            {loading ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </> : "Crear Producto"}
          </Button>
        </div>
      </form>
    </div>;
}
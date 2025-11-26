import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Loader2, Eye, AlertCircle, AlertTriangle } from "lucide-react";
import { handleError } from "@/lib/errorHandler";
import { DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateOrderTotal, getApplicableDiscount } from "@/lib/priceCalculations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProductImage {
  url: string;
  alt: string;
}

interface Certificate {
  name: string;
  file_url: string;
}

export default function ProductEdit() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewQuantity, setPreviewQuantity] = useState(1);

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
    volume_m3: "",
    // Garantía y Términos
    warranty_terms: "",
    service_terms: ""
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [certifications, setCertifications] = useState<Certificate[]>([]);
  const [technicalDocs, setTechnicalDocs] = useState<Certificate[]>([]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("manufacturer_id", user?.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Producto no encontrado");
        navigate("/manufacturer/products");
        return;
      }

      setFormData({
        name: data.name || "",
        model: data.model || "",
        brand: data.brand || "",
        sku: data.sku || "",
        category: data.category || "",
        subcategory: data.subcategory || "",
        description: data.description || "",
        price_unit: data.price_unit?.toString() || "",
        delivery_port: data.delivery_port || "",
        moq: data.moq?.toString() || "",
        stock: data.stock?.toString() || "",
        discount_3u: data.discount_3u?.toString() || "",
        discount_5u: data.discount_5u?.toString() || "",
        discount_8u: data.discount_8u?.toString() || "",
        discount_10u: data.discount_10u?.toString() || "",
        length_cm: data.length_cm?.toString() || "",
        width_cm: data.width_cm?.toString() || "",
        height_cm: data.height_cm?.toString() || "",
        volume_m3: data.volume_m3?.toString() || "",
        weight_net_kg: data.weight_net_kg?.toString() || "",
        weight_gross_kg: data.weight_gross_kg?.toString() || "",
        packaging_length_cm: data.packaging_length_cm?.toString() || "",
        packaging_width_cm: data.packaging_width_cm?.toString() || "",
        packaging_height_cm: data.packaging_height_cm?.toString() || "",
        packaging_type: data.packaging_type || "",
        lead_time_production_days: data.lead_time_production_days?.toString() || "",
        lead_time_logistics_days: data.lead_time_logistics_days?.toString() || "",
        transport_notes: data.transport_notes || "",
        hs_code: data.hs_code || "",
        warranty_terms: data.warranty_terms || "",
        service_terms: data.service_terms || "",
      });

      // Parse images - handle both array and JSON string
      const parseImages = (images: any): ProductImage[] => {
        if (!images) return [];
        if (Array.isArray(images)) return images as ProductImage[];
        if (typeof images === 'string') {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      // Parse certifications and technical docs
      const parseDocs = (docs: any): Certificate[] => {
        if (!docs) return [];
        if (Array.isArray(docs)) return docs as Certificate[];
        if (typeof docs === 'string') {
          try {
            const parsed = JSON.parse(docs);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };

      setImages(parseImages(data.images));
      setCertifications(parseDocs(data.certifications));
      setTechnicalDocs(parseDocs(data.technical_docs));
    } catch (error) {
      const message = handleError("Product fetch", error);
      toast.error(message);
      navigate("/manufacturer/products");
    } finally {
      setLoading(false);
    }
  };

  const uploadToBucket = async (
    bucket: "product-images" | "product-docs",
    file: File
  ): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${user?.id}/${crypto.randomUUID()}.${ext}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: "3600", upsert: true });

    if (error) throw error;

    // Para documentos, guardamos solo la ruta interna
    if (bucket === "product-docs") {
      return fileName;
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadToBucket("product-images", file);
        return { url, alt: file.name };
      });

      const newImages = await Promise.all(uploadPromises);
      setImages([...images, ...newImages]);
      toast.success("Imágenes subidas correctamente");
    } catch (error) {
      const message = handleError("Image upload", error);
      toast.error(message);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cert" | "tech"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDocs(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadToBucket("product-docs", file);
        return { name: file.name, file_url: url };
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

    if (!formData.name || !formData.category || !formData.price_unit || !formData.moq) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    // Validate with Zod schema
    try {
      const { productSchema } = await import('@/lib/validationSchemas');
      
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
        model: formData.model || undefined,
      };
      
      productSchema.parse(validationData);
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error("Error de validación en los datos del producto");
      }
      return;
    }

    setSaving(true);
    try {
      const volume = formData.packaging_length_cm && formData.packaging_width_cm && formData.packaging_height_cm
        ? (Number(formData.packaging_length_cm) * Number(formData.packaging_width_cm) * Number(formData.packaging_height_cm)) / 1000000
        : formData.volume_m3 ? Number(formData.volume_m3) : null;

      const payload = {
        name: formData.name,
        brand: formData.brand || null,
        model: formData.model || null,
        sku: formData.sku || null,
        category: formData.category,
        subcategory: formData.subcategory || null,
        description: formData.description || null,
        price_unit: Number(formData.price_unit),
        delivery_port: formData.delivery_port || null,
        moq: Number(formData.moq),
        stock: Number(formData.stock || 0),
        discount_3u: formData.discount_3u ? Number(formData.discount_3u) : null,
        discount_5u: formData.discount_5u ? Number(formData.discount_5u) : null,
        discount_8u: formData.discount_8u ? Number(formData.discount_8u) : null,
        discount_10u: formData.discount_10u ? Number(formData.discount_10u) : null,
        images: JSON.stringify(images),
        length_cm: formData.length_cm ? Number(formData.length_cm) : null,
        width_cm: formData.width_cm ? Number(formData.width_cm) : null,
        height_cm: formData.height_cm ? Number(formData.height_cm) : null,
        volume_m3: volume,
        weight_net_kg: formData.weight_net_kg ? Number(formData.weight_net_kg) : null,
        weight_gross_kg: formData.weight_gross_kg ? Number(formData.weight_gross_kg) : null,
        packaging_length_cm: formData.packaging_length_cm ? Number(formData.packaging_length_cm) : null,
        packaging_width_cm: formData.packaging_width_cm ? Number(formData.packaging_width_cm) : null,
        packaging_height_cm: formData.packaging_height_cm ? Number(formData.packaging_height_cm) : null,
        packaging_type: formData.packaging_type || null,
        lead_time_production_days: formData.lead_time_production_days ? Number(formData.lead_time_production_days) : null,
        lead_time_logistics_days: formData.lead_time_logistics_days ? Number(formData.lead_time_logistics_days) : null,
        transport_notes: formData.transport_notes || null,
        hs_code: formData.hs_code || null,
        warranty_terms: formData.warranty_terms || null,
        service_terms: formData.service_terms || null,
        certifications: JSON.stringify(certifications),
        technical_docs: JSON.stringify(technicalDocs),
      };

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id)
        .eq("manufacturer_id", user?.id);

      if (error) throw error;

      toast.success("Producto actualizado correctamente");
      navigate("/manufacturer/products");
    } catch (error: any) {
      const message = handleError("Product update", error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate("/manufacturer/products")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a productos
      </Button>

      <h1 className="text-3xl font-semibold mb-6">Editar Producto</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">
                Nombre del Producto * 
                <span className="text-xs text-muted-foreground ml-2">
                  ({formData.name.length}/100 caracteres)
                </span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    setFormData({ ...formData, name: e.target.value });
                  }
                }}
                maxLength={100}
                required
              />
              {formData.name.length >= 95 && (
                <p className="text-xs text-warning mt-1">
                  Alcanzando límite de caracteres
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="sku">SKU (uso interno)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Para identificación interna"
              />
              <p className="text-xs text-muted-foreground mt-1">No se mostrará públicamente</p>
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cocina y Restauración">Cocina y Restauración</SelectItem>
                  <SelectItem value="Panaderías y Pastelerías">Panaderías y Pastelerías</SelectItem>
                  <SelectItem value="Carnicerías y Chacinados">Carnicerías y Chacinados</SelectItem>
                  <SelectItem value="Heladerías y Pastelería Fría">Heladerías y Pastelería Fría</SelectItem>
                  <SelectItem value="Refrigeración Comercial e Industrial">Refrigeración Comercial e Industrial</SelectItem>
                  <SelectItem value="Packaging y Envasado">Packaging y Envasado</SelectItem>
                  <SelectItem value="Mobiliario y Equipamiento para Hoteles">Mobiliario y Equipamiento para Hoteles</SelectItem>
                  <SelectItem value="Equipamiento Audiovisual y para Eventos">Equipamiento Audiovisual y para Eventos</SelectItem>
                  <SelectItem value="Movilidad y Logística Interna (Intralogística)">Movilidad y Logística Interna (Intralogística)</SelectItem>
                  <SelectItem value="Ferretería y Construcción">Ferretería y Construcción</SelectItem>
                  <SelectItem value="Vending & Automatización Comercial">Vending & Automatización Comercial</SelectItem>
                  <SelectItem value="Centros de Entrenamiento y Gimnasios Profesionales">Centros de Entrenamiento y Gimnasios Profesionales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Imágenes y Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes y Videos del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="images" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadingImages ? "Subiendo..." : "Haz clic para subir imágenes y videos"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos: JPG, PNG, WEBP, MP4, WEBM
                    </p>
                  </div>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                </Label>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      {img.url.includes('.mp4') || img.url.includes('.webm') ? (
                        <video
                          src={img.url}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                        />
                      ) : (
                        <img
                          src={img.url}
                          alt={img.alt}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medidas y Peso */}
        <Card>
          <CardHeader>
            <CardTitle>Dimensiones y Peso</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="length">Largo (cm)</Label>
              <Input
                id="length"
                type="number"
                step="0.01"
                value={formData.length_cm}
                onChange={(e) => setFormData({ ...formData, length_cm: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="width">Ancho (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={formData.width_cm}
                onChange={(e) => setFormData({ ...formData, width_cm: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="height">Alto (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="volume">Volumen Unitario (m³)</Label>
              <Input
                id="volume"
                type="text"
                value={
                  formData.length_cm && formData.width_cm && formData.height_cm
                    ? ((Number(formData.length_cm) * Number(formData.width_cm) * Number(formData.height_cm)) / 1000000).toFixed(4)
                    : formData.volume_m3 || "0.0000"
                }
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="weight_net">Peso Neto (kg)</Label>
              <Input
                id="weight_net"
                type="number"
                step="0.01"
                value={formData.weight_net_kg}
                onChange={(e) => setFormData({ ...formData, weight_net_kg: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="weight_gross">Peso Bruto (kg)</Label>
              <Input
                id="weight_gross"
                type="number"
                step="0.01"
                value={formData.weight_gross_kg}
                onChange={(e) => setFormData({ ...formData, weight_gross_kg: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Empaque y Tiempos */}
        <Card>
          <CardHeader>
            <CardTitle>Empaque y Plazos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Dimensiones Empaque (cm)</Label>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="pack_length" className="text-xs">Largo (cm)</Label>
                  <Input
                    id="pack_length"
                    type="number"
                    step="0.01"
                    value={formData.packaging_length_cm}
                    onChange={(e) => setFormData({ ...formData, packaging_length_cm: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="pack_width" className="text-xs">Ancho (cm)</Label>
                  <Input
                    id="pack_width"
                    type="number"
                    step="0.01"
                    value={formData.packaging_width_cm}
                    onChange={(e) => setFormData({ ...formData, packaging_width_cm: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="pack_height" className="text-xs">Alto (cm)</Label>
                  <Input
                    id="pack_height"
                    type="number"
                    step="0.01"
                    value={formData.packaging_height_cm}
                    onChange={(e) => setFormData({ ...formData, packaging_height_cm: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="volume_pack" className="text-xs">Volumen (m³)</Label>
                  <Input
                    id="volume_pack"
                    type="text"
                    value={
                      formData.packaging_length_cm && formData.packaging_width_cm && formData.packaging_height_cm
                        ? ((Number(formData.packaging_length_cm) * Number(formData.packaging_width_cm) * Number(formData.packaging_height_cm)) / 1000000).toFixed(4)
                        : "0.0000"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="packaging">Tipo de Embalaje</Label>
                <Input
                  id="packaging"
                  value={formData.packaging_type}
                  onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
                  placeholder="Ej: Caja de cartón, pallet"
                />
              </div>
              <div>
                <Label htmlFor="lead_prod">Tiempo Producción (días)</Label>
                <Input
                  id="lead_prod"
                  type="number"
                  value={formData.lead_time_production_days}
                  onChange={(e) => setFormData({ ...formData, lead_time_production_days: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lead_log">Tiempo Logística (días)</Label>
                <p className="text-xs text-muted-foreground mb-1">Hasta Puerto de Origen seleccionado</p>
                <Input
                  id="lead_log"
                  type="number"
                  value={formData.lead_time_logistics_days}
                  onChange={(e) => setFormData({ ...formData, lead_time_logistics_days: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label htmlFor="transport_notes">Notas Especiales de Transporte/Aduana</Label>
                <Textarea
                  id="transport_notes"
                  value={formData.transport_notes}
                  onChange={(e) => setFormData({ ...formData, transport_notes: e.target.value })}
                  placeholder="Cualquier información relevante para logística o aduanas"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="hs_code">Código HS (opcional)</Label>
                <Input
                  id="hs_code"
                  value={formData.hs_code}
                  onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                  placeholder="Código arancelario internacional"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Precio y Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Precio y Disponibilidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="price">Precio Unitario (EUR) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price_unit}
                  onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="delivery_port">Puerto de Entrega</Label>
                <Select
                  value={formData.delivery_port}
                  onValueChange={(value) => setFormData({ ...formData, delivery_port: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona puerto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shanghai">Shanghai</SelectItem>
                    <SelectItem value="Ningbo">Ningbo</SelectItem>
                    <SelectItem value="Shenzhen">Shenzhen</SelectItem>
                    <SelectItem value="Guangzhou">Guangzhou</SelectItem>
                    <SelectItem value="Qingdao">Qingdao</SelectItem>
                    <SelectItem value="Tianjin">Tianjin</SelectItem>
                    <SelectItem value="Xiamen">Xiamen</SelectItem>
                    <SelectItem value="Dalian">Dalian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="moq">MOQ (Cantidad Mínima) *</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Disponible</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="mb-2 block">Descuentos por Volumen (%)</Label>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="disc3" className="text-xs">3+ unidades</Label>
                  <Input
                    id="disc3"
                    type="number"
                    step="0.01"
                    value={formData.discount_3u}
                    onChange={(e) => setFormData({ ...formData, discount_3u: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="disc5" className="text-xs">5+ unidades</Label>
                  <Input
                    id="disc5"
                    type="number"
                    step="0.01"
                    value={formData.discount_5u}
                    onChange={(e) => setFormData({ ...formData, discount_5u: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="disc8" className="text-xs">8+ unidades</Label>
                  <Input
                    id="disc8"
                    type="number"
                    step="0.01"
                    value={formData.discount_8u}
                    onChange={(e) => setFormData({ ...formData, discount_8u: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="disc10" className="text-xs">10+ unidades</Label>
                  <Input
                    id="disc10"
                    type="number"
                    step="0.01"
                    value={formData.discount_10u}
                    onChange={(e) => setFormData({ ...formData, discount_10u: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
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
                    <CardTitle>Preview: ¿Cómo verán los compradores tu precio final?</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" type="button">
                    {showPreview ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                {formData.price_unit && formData.length_cm && formData.width_cm && formData.height_cm ? (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Los costos se calculan automáticamente
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Este preview usa los parámetros logísticos de España (flete €115/m³, seguro 1%, gastos destino €350, arancel 3%, IVA 21%). 
                            Los compradores verán este desglose actualizado en tiempo real según su país de destino.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <Label htmlFor="preview_quantity" className="text-sm">Simular cantidad (para ver descuentos)</Label>
                        <Input 
                          id="preview_quantity"
                          type="number" 
                          min={formData.moq || 1}
                          value={previewQuantity}
                          onChange={(e) => setPreviewQuantity(parseInt(e.target.value) || 1)}
                          onFocus={(e) => e.target.select()}
                          placeholder="1"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.moq && previewQuantity < Number(formData.moq) 
                            ? `⚠️ Cantidad menor al MOQ (${formData.moq})`
                            : `✓ Cantidad válida`}
                        </p>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Volumen total ({previewQuantity} {previewQuantity === 1 ? 'unidad' : 'unidades'})</p>
                          <p className="text-lg font-semibold">
                            {formData.packaging_length_cm && formData.packaging_width_cm && formData.packaging_height_cm
                              ? (((Number(formData.packaging_length_cm) * Number(formData.packaging_width_cm) * Number(formData.packaging_height_cm)) / 1000000) * previewQuantity).toFixed(3)
                              : '0.000'} m³
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formData.packaging_length_cm && formData.packaging_width_cm && formData.packaging_height_cm
                              ? ((Number(formData.packaging_length_cm) * Number(formData.packaging_width_cm) * Number(formData.packaging_height_cm)) / 1000000).toFixed(4)
                              : '0.0000'} m³ por unidad
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
                            <p className="text-xl font-semibold">€{Number(formData.price_unit || 0).toFixed(2)}</p>
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
                              discount_10u: formData.discount_10u ? Number(formData.discount_10u) : null,
                            };
                            const applicableDiscount = getApplicableDiscount(previewQuantity, discounts);
                            const totalFOB = calculateOrderTotal(basePrice, previewQuantity, discounts);
                            const commission = totalFOB * 0.12;
                            const netProfit = totalFOB * 0.88;

                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Precio Base Total (FOB)</span>
                                  <span className="font-medium">€{(basePrice * previewQuantity).toFixed(2)}</span>
                                </div>
                                {applicableDiscount > 0 && (
                                  <div className="flex justify-between text-green-600 dark:text-green-400">
                                    <span>Descuento por Volumen (-{applicableDiscount}%)</span>
                                    <span className="font-medium">-€{((basePrice * previewQuantity) - totalFOB).toFixed(2)}</span>
                                  </div>
                                )}
                                {applicableDiscount > 0 && (
                                  <div className="flex justify-between font-semibold">
                                    <span className="text-muted-foreground">Precio Total con Descuento</span>
                                    <span className="font-medium">€{totalFOB.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-amber-600 dark:text-amber-500">
                                  <span>Comisión Plataforma (12%)</span>
                                  <span className="font-medium">-€{commission.toFixed(2)}</span>
                                </div>
                              </>
                            );
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
                              discount_10u: formData.discount_10u ? Number(formData.discount_10u) : null,
                            };
                            const totalFOB = calculateOrderTotal(basePrice, previewQuantity, discounts);
                            return (totalFOB * 0.88).toFixed(2);
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
                              <p className="text-xs">(Aclaraciones legales y contractuales en Términos y Condiciones de "La Plataforma LenzSupply" con "Usuarios Fabricantes")</p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      Completa el precio unitario para ver el cálculo de comisión
                    </AlertDescription>
                  </Alert>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* Certificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Certificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="certs" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadingDocs ? "Subiendo..." : "Subir certificados"}
                    </p>
                  </div>
                  <Input
                    id="certs"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleDocUpload(e, "cert")}
                    disabled={uploadingDocs}
                  />
                </Label>
              </div>
              {certifications.length > 0 && (
                <div className="space-y-2">
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <span className="text-sm">{cert.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDoc(idx, "cert")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documentación Técnica */}
        <Card>
          <CardHeader>
            <CardTitle>Documentación Técnica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="techdocs" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadingDocs ? "Subiendo..." : "Subir documentación técnica"}
                    </p>
                  </div>
                  <Input
                    id="techdocs"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleDocUpload(e, "tech")}
                    disabled={uploadingDocs}
                  />
                </Label>
              </div>
              {technicalDocs.length > 0 && (
                <div className="space-y-2">
                  {technicalDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <span className="text-sm">{doc.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDoc(idx, "tech")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Garantía y Términos */}
        <Card>
          <CardHeader>
            <CardTitle>Garantía y Términos de Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="warranty">Garantía</Label>
              <Textarea
                id="warranty"
                value={formData.warranty_terms}
                onChange={(e) => setFormData({ ...formData, warranty_terms: e.target.value })}
                placeholder="Describe los términos de garantía del producto"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="service">Términos de Servicio</Label>
              <Textarea
                id="service"
                value={formData.service_terms}
                onChange={(e) => setFormData({ ...formData, service_terms: e.target.value })}
                placeholder="Condiciones de servicio, mantenimiento, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/manufacturer/products")}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}

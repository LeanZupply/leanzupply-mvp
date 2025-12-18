# 📦 Configuración de Storage - LeanZupply Platform

## 🎯 Objetivo
Configurar los 3 buckets de Storage necesarios para almacenar imágenes de productos, documentos técnicos y documentación de fabricantes.

---

## 📋 Buckets Requeridos

### 1️⃣ **product-images** (PÚBLICO)
- **Propósito:** Almacenar imágenes de productos visibles en el catálogo
- **Público:** SÍ (accesible sin autenticación)
- **Estructura de carpetas:**
  ```
  product-images/
  ├── {product_id}/
  │   ├── main.jpg
  │   ├── gallery-1.jpg
  │   ├── gallery-2.jpg
  │   └── ...
  ```

### 2️⃣ **product-docs** (PRIVADO)
- **Propósito:** Documentos técnicos, certificaciones, fichas de producto
- **Público:** NO (solo usuarios autenticados)
- **Estructura de carpetas:**
  ```
  product-docs/
  ├── {product_id}/
  │   ├── datasheet.pdf
  │   ├── certification-CE.pdf
  │   ├── manual.pdf
  │   └── ...
  ```

### 3️⃣ **manufacturer-docs** (PRIVADO)
- **Propósito:** Documentación legal de fabricantes (licencias, certificados)
- **Público:** NO (solo el fabricante propietario y superadmins)
- **Estructura de carpetas:**
  ```
  manufacturer-docs/
  ├── {user_id}/
  │   ├── business-license.pdf
  │   ├── tax-certificate.pdf
  │   ├── factory-photos/
  │   │   ├── production-line-1.jpg
  │   │   └── warehouse.jpg
  │   └── ...
  ```

---

## 🔧 Paso a Paso: Configuración en Supabase

### **OPCIÓN A: Mediante Dashboard (Recomendado)**

#### 1. Crear Buckets

1. Ir a Supabase Dashboard → **Storage**
2. Click en "**New Bucket**"
3. Para cada bucket:

**Bucket 1: product-images**
- Name: `product-images`
- Public: ✅ **Activar** (check)
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

**Bucket 2: product-docs**
- Name: `product-docs`
- Public: ❌ **Desactivar**
- File size limit: 10 MB
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`

**Bucket 3: manufacturer-docs**
- Name: `manufacturer-docs`
- Public: ❌ **Desactivar**
- File size limit: 10 MB
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`

#### 2. Configurar Políticas RLS

**IMPORTANTE:** Las políticas ya están creadas en `DATABASE_SCHEMA.sql`, pero puedes verificarlas en Storage → Policies.

Si necesitas crearlas manualmente:

##### **Políticas para product-images:**
```sql
-- Vista pública
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Upload para fabricantes
CREATE POLICY "Manufacturers can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    has_role(auth.uid(), 'manufacturer')
  );

-- Update para fabricantes
CREATE POLICY "Manufacturers can update own product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' AND
    has_role(auth.uid(), 'manufacturer')
  );

-- Delete para fabricantes
CREATE POLICY "Manufacturers can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    has_role(auth.uid(), 'manufacturer')
  );
```

##### **Políticas para product-docs:**
```sql
-- Vista para usuarios autenticados
CREATE POLICY "Authenticated users can view product docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-docs' AND auth.role() = 'authenticated');

-- Upload para fabricantes
CREATE POLICY "Manufacturers can upload product docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-docs' AND
    has_role(auth.uid(), 'manufacturer')
  );
```

##### **Políticas para manufacturer-docs:**
```sql
-- Fabricantes ven solo sus documentos
CREATE POLICY "Manufacturers can view own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'manufacturer-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fabricantes suben a su carpeta
CREATE POLICY "Manufacturers can upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'manufacturer-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Superadmins ven todos los documentos
CREATE POLICY "Superadmins can view all manufacturer docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'manufacturer-docs' AND
    has_role(auth.uid(), 'superadmin')
  );
```

---

### **OPCIÓN B: Mediante SQL Editor**

Si prefieres crear todo mediante SQL, ejecuta esto en SQL Editor:

```sql
-- Crear buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'product-docs',
    'product-docs',
    false,
    10485760, -- 10MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  ),
  (
    'manufacturer-docs',
    'manufacturer-docs',
    false,
    10485760, -- 10MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO NOTHING;

-- Las políticas RLS ya están en DATABASE_SCHEMA.sql
```

---

## 📤 Migración de Archivos Existentes

### Opción 1: Upload Manual (Recomendado para pocos archivos)

1. **Descargar archivos del proyecto anterior:**
   - Acceder a Lovable Cloud Storage (si tienes acceso)
   - O solicitar los archivos al desarrollador

2. **Subir a nuevo proyecto:**
   - Dashboard → Storage → Seleccionar bucket
   - Click en "Upload file"
   - Mantener estructura de carpetas

### Opción 2: Script Automatizado (Para muchos archivos)

Si tienes acceso programático al proyecto original, usa este script Node.js:

```javascript
// migrate-storage.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Proyecto ORIGEN (Lovable Cloud)
const supabaseOrigin = createClient(
  'https://[PROYECTO_ORIGEN].supabase.co',
  '[SERVICE_ROLE_KEY_ORIGEN]'
);

// Proyecto DESTINO (Nuevo)
const supabaseDestination = createClient(
  'https://[PROYECTO_DESTINO].supabase.co',
  '[SERVICE_ROLE_KEY_DESTINO]'
);

async function migrateStorageBucket(bucketName) {
  console.log(`Migrando bucket: ${bucketName}`);
  
  // Listar archivos en origen
  const { data: files, error } = await supabaseOrigin.storage
    .from(bucketName)
    .list();

  if (error) {
    console.error(`Error listando archivos: ${error.message}`);
    return;
  }

  // Migrar cada archivo
  for (const file of files) {
    try {
      // Descargar de origen
      const { data: fileData, error: downloadError } = await supabaseOrigin.storage
        .from(bucketName)
        .download(file.name);

      if (downloadError) throw downloadError;

      // Subir a destino
      const { error: uploadError } = await supabaseDestination.storage
        .from(bucketName)
        .upload(file.name, fileData, {
          contentType: file.metadata?.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      console.log(`✓ Migrado: ${file.name}`);
    } catch (err) {
      console.error(`✗ Error migrando ${file.name}:`, err.message);
    }
  }
}

// Ejecutar migración
async function main() {
  await migrateStorageBucket('product-images');
  await migrateStorageBucket('product-docs');
  await migrateStorageBucket('manufacturer-docs');
  console.log('Migración completada');
}

main();
```

**Ejecutar:**
```bash
node migrate-storage.js
```

---

## ✅ Verificación Post-Setup

### Checklist:

- [ ] 3 buckets creados
- [ ] `product-images` es público
- [ ] `product-docs` es privado
- [ ] `manufacturer-docs` es privado
- [ ] Políticas RLS aplicadas correctamente
- [ ] File size limits configurados
- [ ] MIME types permitidos configurados
- [ ] (Opcional) Archivos migrados

### Probar Funcionalidad:

1. **Test de Upload (como Manufacturer):**
   - Registrarse como fabricante
   - Crear un producto
   - Subir imagen → debe funcionar
   - Verificar que imagen aparezca en catálogo

2. **Test de Permisos:**
   - Logout
   - Intentar acceder a URL de imagen en `product-images` → debe funcionar (público)
   - Intentar acceder a URL de documento en `product-docs` → debe fallar (privado)

3. **Test de RLS:**
   - Login como fabricante A
   - Intentar subir documento a carpeta de fabricante B → debe fallar
   - Subir a su propia carpeta → debe funcionar

---

## 🚨 Troubleshooting

### Error: "bucket not found"
**Solución:** Verificar que el nombre del bucket sea exacto (sensible a mayúsculas).

### Error: "RLS policy violation"
**Solución:** Verificar que las políticas RLS estén aplicadas. Ejecutar sección de políticas en SQL Editor.

### Imágenes no cargan en frontend
**Solución:** 
1. Verificar que bucket sea público
2. Revisar CORS settings en Supabase Storage
3. Verificar URL de imagen (debe ser signed URL para buckets privados)

### Error: "file too large"
**Solución:** Aumentar `file_size_limit` en configuración del bucket.

---

## 📞 Recursos Adicionales

- [Documentación Oficial Supabase Storage](https://supabase.com/docs/guides/storage)
- [RLS Policies para Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)

---

**Última actualización:** Noviembre 2025

# 📦 Guía Completa de Migración - LeanZupply D2B Platform

## 🎯 Objetivo
Migrar el proyecto completo desde Lovable Cloud a un proyecto de Supabase independiente y desplegarlo en Vercel.

---

## 📋 Pre-requisitos

### Cliente debe tener:
- [ ] Cuenta de Supabase (https://supabase.com)
- [ ] Cuenta de Vercel (https://vercel.com)
- [ ] Node.js v18+ instalado
- [ ] Git instalado
- [ ] Supabase CLI instalado (opcional pero recomendado)

```bash
npm install -g supabase
```

---

## 🔄 Proceso de Migración (Paso a Paso)

### **FASE 1: Configuración de Supabase**

#### 1.1 Crear Proyecto en Supabase
1. Ir a https://supabase.com/dashboard
2. Click en "New Project"
3. Llenar datos:
   - **Name:** LenzSupply-Production
   - **Database Password:** [generar contraseña segura]
   - **Region:** Elegir más cercana a usuarios finales
4. Esperar ~2 minutos mientras se crea el proyecto
5. **Guardar credenciales importantes:**
   - Project URL (ej: `https://xxx.supabase.co`)
   - API Keys → `anon` `public` key
   - API Keys → `service_role` key (mantener SECRETA)
   - Project Settings → Database → Connection String

#### 1.2 Aplicar Migraciones de Base de Datos

**Opción A: Usando Supabase Dashboard (Recomendado para principiantes)**
1. Ir a SQL Editor en Supabase Dashboard
2. Abrir el archivo `DATABASE_SCHEMA.sql` (del paquete de migración)
3. Copiar y pegar TODO el contenido
4. Click en "Run" (ejecutar)
5. Verificar que no haya errores en el panel de resultados

**Opción B: Usando Supabase CLI (Para usuarios avanzados)**
```bash
# Login a Supabase
supabase login

# Linkar proyecto
supabase link --project-ref [TU_PROJECT_REF]

# Aplicar migraciones
supabase db push
```

#### 1.3 Insertar Datos Iniciales (Seed Data)
1. En SQL Editor, abrir `DATA_SEED.sql`
2. Copiar y ejecutar sección por sección:
   - Primero: Settings (configuraciones globales)
   - Segundo: Shipping routes (rutas marítimas)
   - Tercero: Volume surcharges (recargos por volumen)
   - Cuarto: Local shipping zones (zonas de envío local)

**IMPORTANTE:** NO ejecutar la parte de usuarios/passwords. Los usuarios deberán registrarse nuevamente.

#### 1.4 Configurar Storage Buckets
1. Ir a Storage en Supabase Dashboard
2. Crear 3 buckets siguiendo `STORAGE_SETUP.md`:
   - `product-images` (público)
   - `product-docs` (privado)
   - `manufacturer-docs` (privado)
3. Aplicar las políticas RLS especificadas en cada bucket

#### 1.5 Desplegar Edge Functions
1. Ir a Edge Functions en Supabase Dashboard
2. Crear función: `calculate-logistics-costs`
   - Copiar código de `supabase/functions/calculate-logistics-costs/index.ts`
   - Verificar que no requiera variables de entorno adicionales
   - Deploy
3. Crear función: `check-manufacturer-profile`
   - Copiar código de `supabase/functions/check-manufacturer-profile/index.ts`
   - Deploy

---

### **FASE 2: Migración de Archivos (Storage)**

#### Opción A: Descarga y Re-subida Manual
1. Descargar todos los archivos actuales:
   - Imágenes de productos (5 productos × ~3 imágenes c/u)
   - Documentos de fabricantes
   - Logos de marcas
2. Organizarlos en carpetas locales
3. Subirlos manualmente al nuevo Storage en Supabase:
   - Dashboard → Storage → Bucket correspondiente → Upload

#### Opción B: Script Automatizado (Requiere acceso a proyecto original)
```bash
# Ejecutar script de migración de storage
node migrate-storage.js
```

**NOTA:** Si el cliente no tiene acceso al proyecto original de Lovable Cloud, usar Opción A.

---

### **FASE 3: Configuración del Código Frontend**

#### 3.1 Clonar Repositorio
```bash
git clone [URL_DEL_REPO]
cd lenzsupply-platform
npm install
```

#### 3.2 Configurar Variables de Entorno
1. Crear archivo `.env` en la raíz del proyecto
2. Copiar contenido de `.env.example`
3. Llenar con las credenciales del nuevo proyecto Supabase:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[TU_PROJECT_ID].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[TU_ANON_KEY]
VITE_SUPABASE_PROJECT_ID=[TU_PROJECT_ID]
```

**IMPORTANTE:** Nunca commitear el archivo `.env` al repositorio.

#### 3.3 Verificar Conexión Local
```bash
npm run dev
```

- Abrir http://localhost:8080
- Intentar registrarse como nuevo usuario
- Verificar que la autenticación funcione
- Verificar que se pueda navegar por el catálogo

---

### **FASE 4: Deployment en Vercel**

#### 4.1 Conectar Repositorio a Vercel
1. Ir a https://vercel.com/new
2. Importar repositorio Git
3. Configurar proyecto:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

#### 4.2 Configurar Variables de Entorno en Vercel
1. En Settings → Environment Variables
2. Agregar las mismas 3 variables del `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
3. Aplicar a: Production, Preview, Development

#### 4.3 Deploy
1. Click en "Deploy"
2. Esperar ~2-3 minutos
3. Visitar URL de producción (ej: `lenzsupply.vercel.app`)

---

### **FASE 5: Configuración de Autenticación**

#### 5.1 Configurar Email en Supabase
1. Authentication → Settings → Email Templates
2. Personalizar templates (opcional):
   - Confirm signup
   - Reset password
   - Magic Link

#### 5.2 Configurar Redirect URLs
1. Authentication → URL Configuration
2. Agregar tu dominio de producción:
   - Site URL: `https://lenzsupply.vercel.app`
   - Redirect URLs: `https://lenzsupply.vercel.app/**`

#### 5.3 Configurar Auto-confirm Email (Desarrollo)
**SOLO para ambiente de pruebas:**
1. Authentication → Settings
2. Enable "Enable email confirmations" → Desactivar
3. Esto permite que usuarios se registren sin verificar email

**IMPORTANTE:** Reactivar en producción para seguridad.

---

### **FASE 6: Testing Post-Migración**

#### Checklist de Verificación

**Base de Datos:**
- [ ] 15 tablas creadas correctamente
- [ ] Políticas RLS funcionando
- [ ] Funciones de base de datos operativas
- [ ] Datos seed importados

**Autenticación:**
- [ ] Registro de nuevos usuarios funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Roles asignados correctamente (buyer, manufacturer, superadmin)

**Storage:**
- [ ] Buckets creados
- [ ] Políticas RLS aplicadas
- [ ] Imágenes de productos visibles
- [ ] Upload de documentos funciona

**Edge Functions:**
- [ ] `calculate-logistics-costs` responde correctamente
- [ ] `check-manufacturer-profile` valida perfiles

**Frontend (Vercel):**
- [ ] Deploy exitoso
- [ ] Variables de entorno configuradas
- [ ] SSL/HTTPS habilitado automáticamente
- [ ] Todas las rutas cargan correctamente

**Flujos de Usuario:**
- [ ] Buyer puede registrarse y ver catálogo
- [ ] Manufacturer puede crear perfil y subir productos
- [ ] Superadmin puede aprobar productos y fabricantes
- [ ] Sistema de órdenes funciona end-to-end
- [ ] Notificaciones se envían correctamente

---

### **FASE 7: Configuración de Usuario Superadmin**

#### Crear Primer Superadmin
1. Registrarse normalmente como usuario
2. En Supabase Dashboard → Authentication → Users
3. Copiar el UUID del usuario
4. En SQL Editor, ejecutar:

```sql
-- Actualizar rol a superadmin
UPDATE profiles 
SET role = 'superadmin', is_verified = true
WHERE id = '[UUID_DEL_USUARIO]';

-- Insertar en user_roles
INSERT INTO user_roles (user_id, role)
VALUES ('[UUID_DEL_USUARIO]', 'superadmin');
```

5. Recargar aplicación y verificar acceso al panel de superadmin

---

## 🚨 Troubleshooting Común

### Error: "No puede conectarse a la base de datos"
- Verificar que las variables de entorno estén correctas
- Verificar que el proyecto de Supabase esté activo
- Revisar que la API key sea la correcta

### Error: "RLS policy violation"
- Verificar que las políticas RLS estén aplicadas
- Revisar que el usuario tenga el rol correcto
- Ejecutar `STORAGE_SETUP.md` para policies de storage

### Error: "Edge function not found"
- Verificar que las funciones estén desplegadas en Supabase
- Revisar logs en Supabase → Edge Functions

### Imágenes no cargan
- Verificar que bucket sea público (`product-images`)
- Revisar políticas RLS del bucket
- Verificar que archivos estén subidos correctamente

---

## 📞 Soporte Post-Migración

### Recursos Útiles
- Documentación Supabase: https://supabase.com/docs
- Documentación Vercel: https://vercel.com/docs
- Supabase Discord: https://discord.supabase.com

### Arquitectura del Sistema
Ver `ARCHITECTURE.md` para diagrama detallado.

### Mantenimiento
Ver `MAINTENANCE_GUIDE.md` para tareas comunes.

---

## ✅ Checklist Final

Antes de entregar al cliente:
- [ ] Todos los scripts SQL probados
- [ ] Documentación revisada
- [ ] Variables de entorno documentadas
- [ ] README.md actualizado
- [ ] .env.example creado
- [ ] .gitignore incluye .env
- [ ] Deploy de prueba en Vercel exitoso
- [ ] Superadmin creado y verificado
- [ ] Datos de prueba cargados
- [ ] Todas las funcionalidades testeadas

---

**Tiempo estimado de migración completa:** 2-4 horas
**Nivel de dificultad:** Intermedio

**Última actualización:** Noviembre 2025

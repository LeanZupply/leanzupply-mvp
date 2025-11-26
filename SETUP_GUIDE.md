# Guía de Configuración - LenzSupply Platform

Esta guía te llevará paso a paso por la configuración completa del proyecto.

## Tabla de Contenidos

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Configuración Local](#configuración-local)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Configuración de Storage](#configuración-de-storage)
6. [Configuración de Autenticación](#configuración-de-autenticación)
7. [Primera Ejecución](#primera-ejecución)
8. [Creación de Usuario Superadmin](#creación-de-usuario-superadmin)

---

## Requisitos del Sistema

### Software Necesario

- **Node.js**: v18.0.0 o superior
  - Descargar: https://nodejs.org/
  - Verificar instalación: `node --version`

- **npm**: v9.0.0 o superior (viene con Node.js)
  - Verificar instalación: `npm --version`

- **Git**: Para clonar el repositorio
  - Descargar: https://git-scm.com/
  - Verificar instalación: `git --version`

### Cuentas Requeridas

- **Cuenta de Supabase**: https://supabase.com/
  - Plan gratuito es suficiente para desarrollo

---

## Configuración de Supabase

### Paso 1: Crear Proyecto en Supabase

1. Ir a https://supabase.com/ y hacer login
2. Click en "New Project"
3. Completar los datos:
   - **Name**: leanzupply-prod (o nombre que prefieras)
   - **Database Password**: [Generar contraseña segura y guardarla]
   - **Region**: Elegir la más cercana a tus usuarios
   - **Pricing Plan**: Free (para desarrollo)
4. Click en "Create new project"
5. Esperar ~2 minutos mientras se provisiona el proyecto

### Paso 2: Obtener Credenciales

1. En el dashboard de tu proyecto, ir a **Settings** → **API**
2. Copiar los siguientes valores:
   - **Project URL**: `https://[project-id].supabase.co`
   - **anon/public key**: `eyJhbGci...` (es largo, copiar completo)
   - **Project ID**: visible en la URL o en Settings

3. Guardar estos valores, los necesitarás pronto.

---

## Configuración Local

### Paso 1: Clonar el Repositorio

```bash
git clone [URL-DEL-REPOSITORIO]
cd leanzupply
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

Este comando instalará todas las dependencias listadas en `package.json`. Puede tardar 1-2 minutos.

### Paso 3: Configurar Variables de Entorno

1. En la raíz del proyecto, crear archivo `.env`:

```bash
# En Windows (Command Prompt)
copy .env.example .env

# En Windows (PowerShell)
Copy-Item .env.example .env

# En Mac/Linux
cp .env.example .env
```

2. Abrir `.env` con tu editor favorito y completar con las credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://[tu-project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[tu-anon-key-aqui]
VITE_SUPABASE_PROJECT_ID=[tu-project-id]
```

**⚠️ IMPORTANTE**: No compartir este archivo ni subirlo a Git. Ya está en `.gitignore`.

---

## Configuración de Base de Datos

### Paso 1: Ejecutar Migraciones

Las migraciones ya están en la carpeta `supabase/migrations/`. Para aplicarlas:

**Opción A: Usando Supabase Dashboard (Recomendado para principiantes)**

1. Ir a **SQL Editor** en el dashboard de Supabase
2. Abrir cada archivo de migración en orden cronológico
3. Copiar el contenido SQL y ejecutarlo en el editor
4. Verificar que no haya errores

**Opción B: Usando Supabase CLI**

```bash
# Instalar CLI
npm install -g supabase

# Conectar al proyecto
supabase link --project-ref [tu-project-id]

# Ejecutar migraciones
supabase db push
```

### Paso 2: Verificar Tablas Creadas

1. En Supabase Dashboard → **Database** → **Tables**
2. Deberías ver estas tablas:
   - profiles
   - manufacturers
   - products
   - orders
   - notifications
   - pallet_items
   - order_tracking
   - activity_log
   - user_roles
   - documents
   - settings

### Paso 3: Verificar Funciones de Base de Datos

1. Ir a **Database** → **Functions**
2. Verificar que existan funciones como:
   - `get_users_stats()`
   - `get_products_stats()`
   - `get_orders_stats()`
   - `get_top_products()`
   - etc.

---

## Configuración de Storage

### Crear Buckets de Storage

1. En Supabase Dashboard → **Storage**
2. Crear estos 3 buckets:

#### Bucket 1: product-images
- Click en "Create bucket"
- **Name**: `product-images`
- **Public**: ✅ Habilitado
- Click "Create bucket"

#### Bucket 2: product-docs
- Click en "Create bucket"
- **Name**: `product-docs`
- **Public**: ❌ Deshabilitado
- Click "Create bucket"

#### Bucket 3: manufacturer-docs
- Click en "Create bucket"
- **Name**: `manufacturer-docs`
- **Public**: ✅ Habilitado
- Click "Create bucket"

### Configurar Políticas de Storage

Para cada bucket, agregar las políticas RLS:

**product-images** (imágenes públicas):
```sql
-- Policy 1: Public Read
CREATE POLICY "Public can read product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Policy 2: Authenticated Upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

-- Policy 3: Users can update their own
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**product-docs** (documentos privados):
```sql
-- Policy: Owners can read their docs
CREATE POLICY "Users can read their docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Authenticated upload
CREATE POLICY "Users can upload docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-docs'
  AND auth.uid() IS NOT NULL
);
```

**manufacturer-docs** (fotos de validación públicas):
```sql
-- Policy 1: Public Read
CREATE POLICY "Public can read manufacturer docs" ON storage.objects
FOR SELECT USING (bucket_id = 'manufacturer-docs');

-- Policy 2: Manufacturers can upload
CREATE POLICY "Manufacturers can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'manufacturer-docs'
  AND auth.uid() IS NOT NULL
);
```

---

## Configuración de Autenticación

### Paso 1: Configurar Providers

1. Ir a **Authentication** → **Providers**
2. Habilitar **Email** (ya debería estar habilitado)
3. (Opcional) Configurar OAuth providers si se desea:
   - Google
   - GitHub
   - Etc.

### Paso 2: Configuración de Email

**Para Desarrollo**:
1. Ir a **Authentication** → **Settings**
2. Desactivar "Confirm email" temporalmente
   - Esto permite crear cuentas sin verificar emails en desarrollo
3. **⚠️ En producción, dejar habilitado**

**Para Producción**:
1. Configurar SMTP personalizado o usar el de Supabase
2. Personalizar templates de email

### Paso 3: Configurar URL Site

1. En **Authentication** → **URL Configuration**
2. Agregar:
   - **Site URL**: Tu dominio de producción
   - **Redirect URLs**: URLs permitidas para redirect después de auth

---

## Primera Ejecución

### Paso 1: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Deberías ver algo como:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Paso 2: Abrir en Navegador

1. Abrir http://localhost:5173/
2. Deberías ver la landing page pública
3. Verificar que:
   - Las imágenes cargan correctamente
   - No hay errores en consola (F12)
   - Los botones de Login/Signup funcionan

### Paso 3: Test de Autenticación

1. Click en "Comenzar" o "Iniciar Sesión"
2. Ir a Signup
3. Crear una cuenta de prueba:
   - Email: test@example.com
   - Contraseña: Test123456!
   - Rol: Buyer (comprador)
4. Si todo está bien configurado, deberías ser redirigido al dashboard

---

## Creación de Usuario Superadmin

El primer usuario superadmin debe crearse manualmente en la base de datos.

### Opción A: Usando SQL Editor (Más fácil)

1. Primero, crear una cuenta normal desde el signup
2. Copiar el `user_id` del usuario (visible en tabla `profiles`)
3. Ir a **SQL Editor** en Supabase Dashboard
4. Ejecutar este SQL (reemplazar `[USER_ID]` con el ID real):

```sql
-- Actualizar role en profiles
UPDATE profiles 
SET role = 'superadmin', is_verified = true 
WHERE id = '[USER_ID]';

-- Actualizar role en user_roles
DELETE FROM user_roles WHERE user_id = '[USER_ID]';
INSERT INTO user_roles (user_id, role) 
VALUES ('[USER_ID]', 'superadmin');
```

### Opción B: Desde Table Editor

1. Ir a **Database** → **Tables** → `profiles`
2. Encontrar tu usuario
3. Editar el registro:
   - **role**: cambiar a `superadmin`
   - **is_verified**: cambiar a `true`
4. Guardar cambios
5. Ir a tabla `user_roles`
6. Eliminar rol actual del usuario si existe
7. Insertar nuevo registro:
   - **user_id**: tu user id
   - **role**: `superadmin`

### Verificar Acceso

1. Hacer logout y volver a login con ese usuario
2. Deberías ser redirigido a `/superadmin`
3. Verificar que puedes acceder a todas las secciones admin

---

## Checklist de Configuración Completa

Marca cada item cuando lo completes:

- [ ] Node.js instalado y verificado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Proyecto de Supabase creado
- [ ] Variables de entorno configuradas en `.env`
- [ ] Migraciones de base de datos ejecutadas
- [ ] Tablas verificadas en dashboard
- [ ] Storage buckets creados (3 buckets)
- [ ] Políticas de storage configuradas
- [ ] Configuración de auth ajustada
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Página carga correctamente en navegador
- [ ] Signup/Login funciona
- [ ] Usuario superadmin creado y verificado

---

## Problemas Comunes y Soluciones

### Error: "Cannot find module"
**Solución**: Ejecutar `npm install` de nuevo

### Error: "VITE_SUPABASE_URL is not defined"
**Solución**: Verificar que el archivo `.env` existe y tiene las variables correctas. Reiniciar servidor de desarrollo.

### Error: "Could not find the table 'profiles'"
**Solución**: Las migraciones no se ejecutaron. Ir a SQL Editor y ejecutarlas manualmente.

### Error: "RLS policy violation"
**Solución**: La tabla tiene RLS habilitado pero faltan políticas. Verificar en Supabase Dashboard → Database → Policies.

### Imágenes no cargan
**Solución**: 
1. Verificar que los buckets existen
2. Verificar que las políticas de storage están creadas
3. Verificar que los buckets correctos están marcados como públicos

### No puedo hacer login después de signup
**Solución**: Verificar en Supabase Dashboard → Authentication → Users que el usuario se creó. Si está "Waiting for verification", desactivar email confirmation en settings.

---

## Siguientes Pasos

Una vez completada la configuración:

1. **Leer la documentación técnica**: `TECHNICAL_DOCUMENTATION.md`
2. **Explorar el código**: Empezar por `src/pages/` para entender las rutas
3. **Probar las funcionalidades**: Crear fabricante, productos, pedidos
4. **Personalizar**: Ajustar estilos en `src/index.css` y `tailwind.config.ts`

---

## Soporte

Si encuentras problemas no cubiertos en esta guía:
- Revisar logs en consola del navegador (F12)
- Revisar logs de Supabase en Dashboard → Logs
- Consultar documentación oficial: https://supabase.com/docs

---

¡Listo! Tu entorno de desarrollo está configurado. 🚀

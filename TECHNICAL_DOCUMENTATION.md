# LeanZupply D2B Platform - Documentación Técnica

## Índice
1. [Descripción General](#descripción-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Modelos de Datos](#modelos-de-datos)
6. [Roles y Permisos](#roles-y-permisos)
7. [Funcionalidades Principales](#funcionalidades-principales)
8. [Configuración del Entorno](#configuración-del-entorno)
9. [Guía de Desarrollo](#guía-de-desarrollo)
10. [Deployment](#deployment)
11. [Mantenimiento](#mantenimiento)

---

## Descripción General

**LeanZupply** es una plataforma D2B (Direct-to-Business) que conecta **fabricantes certificados** de Latinoamérica y otras regiones con **empresas compradoras internacionales**. La plataforma facilita el sourcing de productos, coordinación logística y validación de exportaciones en un solo lugar.

### Objetivos Principales
- Simplificar la conexión entre fabricantes y compradores B2B
- Proporcionar transparencia total en precios FOB (sin intermediarios)
- Gestionar todo el flujo desde cotización hasta entrega
- Validar y certificar fabricantes antes de publicar productos
- Ofrecer seguimiento en tiempo real de pedidos

### Usuarios del Sistema
1. **Superadmin**: Control total del sistema, validación de usuarios y productos
2. **Fabricante (Manufacturer)**: Gestiona productos, pedidos y perfil empresarial
3. **Comprador (Buyer)**: Navega catálogo, realiza pedidos y seguimiento

---

## Stack Tecnológico

### Frontend
- **Framework**: React 18.3.1 con TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM 6.30.1
- **Estilos**: Tailwind CSS 3.x con sistema de diseño personalizado
- **UI Components**: 
  - Radix UI primitives
  - Shadcn/ui components (customizados)
  - Lucide React (iconografía)
- **State Management**: 
  - React Context API (autenticación)
  - TanStack Query v5 (server state)
- **Forms**: React Hook Form con Zod validation
- **Notificaciones**: Sonner (toast notifications)

### Backend & Database
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth con JWT
- **Storage**: Supabase Storage (archivos y documentos)
- **Edge Functions**: Deno runtime para lógica serverless
- **Real-time**: Supabase Realtime (opcional para notificaciones)

### Herramientas de Desarrollo
- **Package Manager**: npm/yarn
- **Linting**: ESLint
- **Type Checking**: TypeScript 5.x
- **Date Handling**: date-fns 3.6.0
- **Analytics**: Sistema custom de tracking

---

## Arquitectura del Sistema

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Public      │  │  Auth Pages  │  │  Dashboards     │   │
│  │  Landing     │  │  Login/Signup│  │  Role-specific  │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Supabase Client SDK
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  SUPABASE BACKEND                            │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │ PostgreSQL   │  │ Auth Service  │  │ Storage Buckets │ │
│  │ + RLS        │  │ + JWT         │  │ + Policies      │ │
│  └──────────────┘  └───────────────┘  └─────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐                       │
│  │ Edge         │  │ Database      │                       │
│  │ Functions    │  │ Functions     │                       │
│  └──────────────┘  └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Autenticación

```
Usuario → Signup/Login → Supabase Auth → JWT Token
                                          ↓
                                    Profile Creation
                                          ↓
                                    Role Assignment
                                          ↓
                                    Dashboard Redirect
```

### Flujo de Negocio Principal

```
1. FABRICANTE CREA PRODUCTO
   ↓
2. SUPERADMIN VALIDA PRODUCTO
   ↓
3. PRODUCTO APARECE EN CATÁLOGO PÚBLICO
   ↓
4. COMPRADOR REALIZA PEDIDO
   ↓
5. FABRICANTE CONFIRMA/RECHAZA
   ↓
6. SISTEMA GESTIONA SEGUIMIENTO
   ↓
7. ENTREGA Y CIERRE
```

---

## Estructura del Proyecto

```
leanzupply/
├── src/
│   ├── assets/              # Imágenes y archivos estáticos
│   │   └── login-illustration.jpg
│   ├── components/          # Componentes React reutilizables
│   │   ├── ui/             # Componentes UI base (Shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (30+ componentes)
│   │   ├── buyer/          # Componentes específicos de compradores
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── OrderTimeline.tsx
│   │   │   ├── OrderTrackingTimeline.tsx
│   │   │   └── PalletSidebar.tsx
│   │   ├── dashboard/      # Componentes de dashboard compartidos
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── DashboardSidebar.tsx
│   │   │   └── NotificationsDropdown.tsx
│   │   ├── superadmin/     # Componentes de superadmin
│   │   │   └── ManufacturerReviewDialog.tsx
│   │   ├── CostBreakdown.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── ProductCard.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # React Contexts
│   │   └── AuthContext.tsx # Context de autenticación
│   ├── hooks/              # Custom Hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useNotifications.ts
│   │   ├── useOptimizedImage.ts
│   │   ├── usePallet.ts
│   │   ├── usePerformanceTracking.ts
│   │   └── useProductsQuery.ts
│   ├── integrations/       # Integraciones externas
│   │   └── supabase/
│   │       ├── client.ts   # Cliente Supabase
│   │       └── types.ts    # Tipos generados automáticamente
│   ├── lib/                # Utilidades y helpers
│   │   ├── activityLogger.ts
│   │   ├── analytics.ts
│   │   ├── categories.ts   # Lista de categorías de productos
│   │   ├── errorHandler.ts
│   │   └── utils.ts
│   ├── pages/              # Páginas de la aplicación
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   ├── buyer/
│   │   │   ├── BuyerCatalog.tsx
│   │   │   ├── BuyerDashboard.tsx
│   │   │   ├── BuyerNotifications.tsx
│   │   │   ├── BuyerOrders.tsx
│   │   │   ├── BuyerProfile.tsx
│   │   │   ├── Checkout.tsx
│   │   │   └── OrderConfirmation.tsx
│   │   ├── manufacturer/
│   │   │   ├── ManufacturerDashboard.tsx
│   │   │   ├── ManufacturerOrders.tsx
│   │   │   ├── ManufacturerProducts.tsx
│   │   │   ├── ManufacturerProfile.tsx
│   │   │   ├── ProductCreate.tsx
│   │   │   └── ProductEdit.tsx
│   │   ├── superadmin/
│   │   │   ├── SuperadminAnalytics.tsx
│   │   │   ├── SuperadminDashboard.tsx
│   │   │   ├── SuperadminDocuments.tsx
│   │   │   ├── SuperadminFunnel.tsx
│   │   │   ├── SuperadminOrders.tsx
│   │   │   ├── SuperadminOverview.tsx
│   │   │   ├── SuperadminProducts.tsx
│   │   │   ├── SuperadminSettings.tsx
│   │   │   └── SuperadminUsers.tsx
│   │   ├── Index.tsx       # Landing page pública
│   │   ├── NotFound.tsx
│   │   └── ProductDetail.tsx
│   ├── App.tsx
│   ├── index.css           # Estilos globales + design tokens
│   └── main.tsx            # Entry point
├── supabase/
│   ├── functions/          # Edge Functions
│   │   └── check-manufacturer-profile/
│   │       └── index.ts
│   ├── migrations/         # Migraciones de base de datos
│   └── config.toml         # Configuración de Supabase
├── public/
│   ├── robots.txt
│   └── favicon.ico
├── .env                    # Variables de entorno (no versionar)
├── tailwind.config.ts      # Configuración de Tailwind
├── vite.config.ts          # Configuración de Vite
├── tsconfig.json           # Configuración de TypeScript
└── package.json            # Dependencias del proyecto
```

---

## Modelos de Datos

### Schema de Base de Datos

#### Tabla: `profiles`
Información básica de todos los usuarios del sistema.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  country TEXT NOT NULL,
  role user_role NOT NULL,  -- 'superadmin', 'manufacturer', 'buyer'
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Políticas RLS**:
- Usuarios pueden ver/editar su propio perfil
- Superadmins pueden ver/editar todos los perfiles
- Perfiles de fabricantes son públicamente visibles (solo datos básicos)

#### Tabla: `manufacturers`
Información detallada de fabricantes (empresas productoras).

```sql
CREATE TABLE manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  legal_name TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  registered_brand TEXT NOT NULL,
  brand_logo_url TEXT NOT NULL,
  country TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  address TEXT NOT NULL,
  official_website TEXT NOT NULL,
  
  -- Contactos
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT NOT NULL,
  primary_contact_messaging TEXT,
  secondary_contact_name TEXT,
  secondary_contact_email TEXT,
  secondary_contact_phone TEXT,
  secondary_contact_messaging TEXT,
  
  -- Información operativa
  english_level TEXT NOT NULL,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  vacation_dates TEXT NOT NULL,
  product_sectors TEXT[] NOT NULL,
  
  -- Información de la fábrica
  facility_area_m2 INTEGER,
  total_employees INTEGER,
  production_capacity TEXT,
  machinery TEXT,
  factory_positioning TEXT NOT NULL,
  factory_history TEXT NOT NULL,
  
  -- Fotos de verificación
  photos_production_lines TEXT[] DEFAULT '{}',
  photos_container_loading TEXT[] DEFAULT '{}',
  photos_machinery TEXT[] DEFAULT '{}',
  photos_warehouse TEXT[] DEFAULT '{}',
  photos_staff TEXT[] DEFAULT '{}',
  
  -- Control
  verification_status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  verified BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Políticas RLS**:
- Fabricantes pueden crear/ver/editar solo su propio perfil
- Superadmins tienen acceso completo

#### Tabla: `products`
Productos publicados por los fabricantes.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID REFERENCES profiles(id),
  
  -- Información básica
  name TEXT NOT NULL,
  model TEXT,
  brand TEXT,
  sku TEXT,  -- Para uso interno
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  
  -- Dimensiones del producto (sin embalaje)
  length_cm NUMERIC,
  width_cm NUMERIC,
  height_cm NUMERIC,
  weight_net_kg NUMERIC,
  
  -- Empaque y dimensiones brutas
  packaging_type TEXT,
  packaging_length_cm NUMERIC,
  packaging_width_cm NUMERIC,
  packaging_height_cm NUMERIC,
  weight_gross_kg NUMERIC,
  volume_m3 NUMERIC,  -- Calculado automáticamente
  
  -- Plazos
  lead_time_production_days INTEGER,
  lead_time_logistics_days INTEGER,
  
  -- Precio y disponibilidad
  price_unit NUMERIC NOT NULL,  -- En EUR
  moq INTEGER NOT NULL DEFAULT 1,
  stock INTEGER NOT NULL DEFAULT 0,
  
  -- Garantía y términos
  warranty_terms TEXT,
  
  -- Archivos y multimedia
  images JSONB DEFAULT '[]',
  technical_docs JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  
  -- Información aduanera
  hs_code TEXT,
  transport_notes TEXT,
  
  -- Control y estado
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'rejected', 'paused'
  admin_notes TEXT,
  views_count INTEGER DEFAULT 0,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT products_status_check CHECK (status IN ('pending', 'active', 'rejected', 'paused'))
);
```

**Políticas RLS**:
- Solo fabricantes verificados pueden insertar productos
- Fabricantes pueden ver/editar/eliminar solo sus productos
- Productos activos son públicamente visibles
- Superadmins tienen acceso completo

#### Tabla: `orders`
Pedidos realizados por compradores a fabricantes.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,  -- Para tracking anónimo
  
  -- Referencias
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  manufacturer_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Datos del comprador (cache)
  buyer_email TEXT,
  buyer_company TEXT,
  
  -- Detalles del pedido
  quantity INTEGER NOT NULL,
  buyer_notes TEXT,
  
  -- Precios
  total_price NUMERIC NOT NULL,
  logistics_cost NUMERIC DEFAULT 0,
  insurance_cost NUMERIC DEFAULT 0,
  customs_cost NUMERIC DEFAULT 0,
  total_final NUMERIC,
  
  -- Términos comerciales
  incoterm TEXT,
  
  -- Respuesta del fabricante
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'confirmed', 'rejected', 'completed'
  response_date TIMESTAMPTZ,
  manufacturer_notes TEXT,
  rejected_reason TEXT,
  delivery_estimate TEXT,
  agreement_notes TEXT,
  
  -- Pago
  payment_status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'paid', 'refunded'
  payment_method TEXT,
  contract_url TEXT,
  
  -- Seguimiento
  tracking_stage TEXT DEFAULT 'created',
  tracking_info JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Políticas RLS**:
- Compradores verificados pueden insertar pedidos
- Compradores solo ven sus propios pedidos
- Fabricantes solo ven pedidos de sus productos
- Superadmins tienen acceso completo

#### Tabla: `notifications`
Sistema de notificaciones para usuarios.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'order', 'product', 'validation', 'system'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Políticas RLS**:
- Usuarios solo pueden ver/actualizar sus propias notificaciones
- Superadmins pueden gestionar todas las notificaciones

#### Tabla: `documents`
Documentos legales y certificaciones subidos por usuarios.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,  -- 'legal', 'certification', 'tax', etc.
  file_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Tabla: `pallet_items`
Carrito de compras temporal del comprador.

```sql
CREATE TABLE pallet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'ordered'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Tabla: `order_tracking`
Eventos de seguimiento de pedidos (para analytics y funnel).

```sql
CREATE TABLE order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  session_id TEXT,
  step tracking_step NOT NULL,  -- ENUM: 'viewed', 'added_to_pallet', 'requested', etc.
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Tabla: `activity_log`
Log de actividades administrativas.

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Tabla: `user_roles`
Roles asignados a usuarios (para control de acceso).

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  role app_role NOT NULL,  -- ENUM
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);
```

#### Tabla: `settings`
Configuraciones globales de la plataforma.

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Enums Personalizados

```sql
-- Rol de usuario en perfiles
CREATE TYPE user_role AS ENUM ('superadmin', 'manufacturer', 'buyer');

-- Rol para control de acceso (RLS)
CREATE TYPE app_role AS ENUM ('superadmin', 'manufacturer', 'buyer');

-- Paso de tracking en el funnel
CREATE TYPE tracking_step AS ENUM (
  'viewed', 
  'added_to_pallet', 
  'requested', 
  'pending_confirmation', 
  'confirmed', 
  'paid', 
  'shipped', 
  'delivered'
);
```

### Storage Buckets

#### `product-images` (Público)
- Imágenes y videos de productos
- Acceso: Lectura pública, escritura solo para fabricantes autenticados

#### `product-docs` (Privado)
- Documentación técnica de productos
- Acceso: Solo fabricante propietario y compradores con pedido confirmado

#### `manufacturer-docs` (Público)
- Fotos de validación de fabricantes
- Acceso: Lectura pública, escritura solo para fabricantes

---

## Roles y Permisos

### Matriz de Permisos

| Funcionalidad | Superadmin | Manufacturer | Buyer | Público |
|--------------|------------|--------------|-------|---------|
| Ver landing page | ✓ | ✓ | ✓ | ✓ |
| Ver catálogo de productos | ✓ | ✓ | ✓ | ✓ |
| Ver detalles de producto | ✓ | ✓ | ✓ | ✓ |
| Crear cuenta | ✓ | ✓ | ✓ | ✓ |
| **PRODUCTOS** |
| Crear producto | ✗ | ✓ (si verificado) | ✗ | ✗ |
| Editar producto propio | ✗ | ✓ | ✗ | ✗ |
| Eliminar producto propio | ✗ | ✓ | ✗ | ✗ |
| Aprobar/Rechazar producto | ✓ | ✗ | ✗ | ✗ |
| Pausar producto | ✓ | ✗ | ✗ | ✗ |
| **PEDIDOS** |
| Crear pedido | ✗ | ✗ | ✓ (si verificado) | ✗ |
| Ver pedidos propios | ✗ | ✓ | ✓ | ✗ |
| Confirmar/Rechazar pedido | ✗ | ✓ (recibidos) | ✗ | ✗ |
| Ver todos los pedidos | ✓ | ✗ | ✗ | ✗ |
| **USUARIOS** |
| Ver lista de usuarios | ✓ | ✗ | ✗ | ✗ |
| Verificar fabricante | ✓ | ✗ | ✗ | ✗ |
| Verificar comprador | ✓ | ✗ | ✗ | ✗ |
| Editar perfil propio | ✓ | ✓ | ✓ | ✗ |
| **ANALYTICS** |
| Ver analytics globales | ✓ | ✗ | ✗ | ✗ |
| Ver analytics propios | ✗ | ✓ (limitado) | ✓ (limitado) | ✗ |
| Funnel de conversión | ✓ | ✗ | ✗ | ✗ |

### Row Level Security (RLS)

Todas las tablas implementan RLS para seguridad:

**Ejemplo de política para `products`**:
```sql
-- Los fabricantes solo ven sus productos
CREATE POLICY manufacturers_read_own ON products
  FOR SELECT
  USING (manufacturer_id = auth.uid());

-- Solo productos activos son públicos
CREATE POLICY public_read_verified_manufacturer_products ON products
  FOR SELECT
  USING (status = 'active' AND is_manufacturer_verified(manufacturer_id));

-- Superadmins ven todo
CREATE POLICY superadmin_all ON products
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role));
```

---

## Funcionalidades Principales

### 1. Autenticación y Registro

**Flujo de Signup**:
1. Usuario completa formulario (email, contraseña, datos empresa)
2. Selecciona rol: Fabricante o Comprador
3. Sistema crea cuenta en `auth.users`
4. Trigger crea perfil en `profiles`
5. Redirect a dashboard según rol
6. Estado inicial: `is_verified = false`

**Validación de Fabricantes**:
- Fabricante completa perfil extendido en `/manufacturer/profile`
- Sube fotos de verificación (líneas de producción, instalaciones, etc.)
- Superadmin revisa y aprueba/rechaza desde `/superadmin/users`
- Si aprobado: `is_verified = true` → puede publicar productos

**Validación de Compradores**:
- Comprador completa información básica
- Superadmin valida empresa
- Si aprobado: puede realizar pedidos

### 2. Gestión de Productos (Fabricantes)

**Crear Producto** (`/manufacturer/products/create`):

Información requerida:
- **Básica**: Nombre, marca, modelo, categoría, descripción
- **Dimensiones**: Largo/ancho/alto (cm), peso neto/bruto (kg)
- **Empaque**: Tipo, dimensiones brutas, volumen (calculado automáticamente en m³)
- **Precio**: Precio unitario en EUR (FOB)
- **Disponibilidad**: MOQ, stock disponible
- **Plazos**: Tiempo de producción, tiempo logística hasta puerto de origen
- **Multimedia**: Fotos/videos del producto
- **Documentación**: Manuales técnicos, certificaciones

**Estados de Producto**:
- `pending`: Recién creado, esperando validación
- `active`: Aprobado, visible en catálogo público
- `rejected`: Rechazado por admin (con notas)
- `paused`: Temporalmente no visible

**Comisión**: 12% sobre el precio total de venta (precio unitario × cantidad).

### 3. Catálogo Público

**Landing Page** (`/`):
- Hero section con propuesta de valor
- Filtros: Categoría, fabricante, tiempo de entrega
- Grid de productos (máximo 9 productos destacados)
- Precios en EUR con formato español (€1.234,56)
- CTA para signup diferenciado (Fabricante/Comprador)

**Detalle de Producto** (`/product/:id`):
- Galería de imágenes con zoom
- Especificaciones completas
- Información del fabricante (empresa, país, marca)
- Calculadora de precio por cantidad
- Breakdown de costos (base, logística, seguros, aduanas)
- Documentación técnica descargable
- Botón "Solicitar Cotización" (requiere login)

### 4. Proceso de Compra

**Flujo Completo**:

1. **Navegación**: Comprador explora catálogo
2. **Agregar a Pallet**: Productos van al carrito (`pallet_items`)
3. **Checkout**: 
   - Selecciona cantidades finales
   - Ve breakdown de costos
   - Puede agregar notas para el fabricante
4. **Crear Pedido**:
   ```
   status: 'pending'
   payment_status: 'pending'
   tracking_stage: 'created'
   ```
5. **Notificación al Fabricante**
6. **Fabricante Responde**:
   - Confirma: `status = 'confirmed'` + estimado de entrega
   - Rechaza: `status = 'rejected'` + razón
7. **Notificación al Comprador**
8. **Tracking**: Timeline visual del estado del pedido

**Estados de Pedido**:
- `pending`: Esperando respuesta del fabricante
- `confirmed`: Fabricante aceptó
- `rejected`: Fabricante rechazó
- `completed`: Entregado

### 5. Dashboard de Fabricantes

**Métricas Principales**:
- Pedidos pendientes de respuesta
- Pedidos activos (en proceso)
- Total de productos publicados
- Productos pendientes de validación

**Gestión de Pedidos** (`/manufacturer/orders`):
- Tabla de pedidos recibidos
- Filtros por estado
- Acciones: Ver detalle, Confirmar, Rechazar
- Timeline de seguimiento

**Gestión de Productos** (`/manufacturer/products`):
- Tabla de productos propios
- Filtros por estado (pending/active/rejected)
- Acciones: Ver, Editar, Eliminar
- Búsqueda por nombre/modelo

**Perfil de Fabricante** (`/manufacturer/profile`):
Formulario extenso con:
- Información legal y fiscal
- Contactos (principal y secundario)
- Datos operativos (empleados, área, capacidad)
- Sectores de productos
- Certificaciones
- Fotos de verificación (5 categorías)

### 6. Dashboard de Compradores

**Métricas Principales**:
- Pedidos totales
- Pedidos completados
- Pedidos en proceso
- Total invertido (EUR)

**Catálogo** (`/buyer/catalog`):
- Grid de productos activos
- Filtros avanzados
- Vista rápida de producto
- Agregar directamente a pallet

**Mis Pedidos** (`/buyer/orders`):
- Lista de pedidos realizados
- Estados visuales con colores
- Timeline de tracking
- Detalles completos por pedido

**Pallet (Carrito)** (Sidebar):
- Lista de productos agregados
- Ajustar cantidades
- Eliminar items
- Ver total
- Ir a checkout

### 7. Panel de Superadmin

**Overview** (`/superadmin/overview`):
- Métricas generales del sistema
- Usuarios, productos, pedidos, categorías
- Productos top por vistas
- Actividad reciente

**Gestión de Usuarios** (`/superadmin/users`):
- Tabla de todos los usuarios
- Filtros por rol y estado de verificación
- Acciones:
  - Ver perfil completo
  - Verificar/Desverificar
  - Para fabricantes: revisar fotos y datos

**Gestión de Productos** (`/superadmin/products`):
- Tabla de todos los productos
- Filtros por estado
- Acciones:
  - Ver detalle completo
  - Aprobar (cambia a `active`)
  - Rechazar (con notas)
  - Pausar/Reanudar
  - Eliminar

**Análisis y Reportes** (`/superadmin/analytics`):
Con filtro de rango de fechas:
- Total de ingresos
- Valor promedio de pedidos
- Gráficos:
  - Top 5 productos por órdenes
  - Productos por categoría (pie chart)
  - Top 5 fabricantes por ventas
  - Pedidos por país
- Las queries filtran por `created_at` entre las fechas seleccionadas

**Funnel de Conversión** (`/superadmin/funnel`):
Visualización del funnel de compra:
```
Viewed → Added to Pallet → Requested → Confirmed → Paid → Shipped → Delivered
```
Con porcentajes de conversión en cada paso.

**Gestión de Pedidos** (`/superadmin/orders`):
- Vista global de todos los pedidos
- Filtros por estado
- Ver detalles completos

### 8. Notificaciones

Sistema automático de notificaciones con triggers de base de datos:

**Eventos que generan notificaciones**:
- Nuevo pedido → Fabricante
- Pedido confirmado/rechazado → Comprador
- Producto aprobado/rechazado → Fabricante
- Usuario verificado/desverificado → Usuario
- Documento verificado → Usuario
- Nuevo producto para revisar → Superadmin
- Nuevo pedido creado → Superadmin

Almacenadas en tabla `notifications`, visibles en:
- Dropdown en header (con contador de no leídas)
- Página dedicada `/buyer/notifications`

### 9. Sistema de Tracking

**order_tracking Table**:
Registra eventos del funnel:
- `viewed`: Usuario vio producto
- `added_to_pallet`: Agregó al carrito
- `requested`: Creó pedido
- `pending_confirmation`: Esperando fabricante
- `confirmed`: Fabricante confirmó
- `paid`: Pago procesado
- `shipped`: Producto enviado
- `delivered`: Producto entregado

Usado para:
- Analytics de conversión
- Funnel visualization
- Session tracking (anónimo si no hay usuario)

---

## Configuración del Entorno

### Variables de Entorno

Archivo `.env` (no versionar):

```env
# Supabase
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[ANON_KEY]
VITE_SUPABASE_PROJECT_ID=[PROJECT_ID]

# Opcional - Analytics
VITE_GA_TRACKING_ID=
```

### Instalación

```bash
# 1. Clonar repositorio
git clone [repo-url]
cd leanzupply

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales correctas

# 4. Ejecutar en desarrollo
npm run dev

# 5. Build para producción
npm run build

# 6. Preview del build
npm run preview
```

### Scripts Disponibles

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
}
```

---

## Guía de Desarrollo

### Convenciones de Código

**TypeScript**:
- Usar tipos explícitos siempre que sea posible
- Evitar `any`, usar `unknown` si es necesario
- Interfaces para objetos, types para unions/aliases

**React**:
- Componentes funcionales con hooks
- Props con interfaces tipadas
- Custom hooks para lógica reutilizable
- Memoización solo cuando sea necesario (React.memo, useMemo, useCallback)

**Nombres**:
- Componentes: PascalCase (`ProductCard.tsx`)
- Hooks: camelCase con prefijo `use` (`useProducts.ts`)
- Utilidades: camelCase (`formatCurrency.ts`)
- Constantes: UPPER_SNAKE_CASE (`PRODUCT_CATEGORIES`)

**Estructura de Componentes**:
```tsx
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

// 3. Componente
export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  // 3.1 Hooks
  const [loading, setLoading] = useState(false);
  
  // 3.2 Functions
  const handleClick = () => {
    setLoading(true);
    onClick();
  };
  
  // 3.3 Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Sistema de Diseño

**Tokens de Color** (en `index.css`):
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
  /* ... más tokens */
}
```

**Uso en componentes**:
```tsx
// ❌ Evitar colores directos
<div className="bg-blue-500 text-white">

// ✅ Usar tokens semánticos
<div className="bg-primary text-primary-foreground">
```

**Componentes UI Customizados**:
Todos en `src/components/ui/`, basados en:
- Radix UI (primitivos accesibles)
- Tailwind (estilos)
- CVA (variantes)

Ejemplo de uso:
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg" onClick={handleClick}>
  Enviar
</Button>
```

### Gestión de Estado

**Autenticación**:
```tsx
// AuthContext provee:
const { user, profile, loading, signIn, signUp, signOut } = useAuth();

// user: Datos de Supabase Auth
// profile: Datos de tabla profiles (con role)
// loading: Boolean durante fetch inicial
```

**Server State** (TanStack Query):
```tsx
// Ejemplo: Productos
const { data: products, isLoading, error } = useProductsQuery({ 
  status: 'active' 
});

// Con invalidación automática
const queryClient = useQueryClient();
queryClient.invalidateQueries(['products']);
```

**Local State**: `useState` para estado de componente

**Form State**: React Hook Form
```tsx
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* campos */}
  </form>
</Form>
```

### Manejo de Errores

**Función centralizada**:
```tsx
import { handleError } from "@/lib/errorHandler";

try {
  // operación
} catch (error) {
  const message = handleError("Context description", error);
  toast.error(message);
}
```

**Tipos de error manejados**:
- Errores de Supabase
- Errores de red
- Errores de validación
- Errores genéricos

### Rutas Protegidas

```tsx
<Route 
  path="/buyer/*" 
  element={
    <ProtectedRoute allowedRoles={['buyer']}>
      <BuyerLayout />
    </ProtectedRoute>
  } 
/>
```

El componente `ProtectedRoute`:
- Verifica autenticación
- Verifica role del usuario
- Redirige a login si no autenticado
- Redirige a dashboard correcto si rol incorrecto

### Queries de Base de Datos

**Funciones RPC** (para lógica compleja):
```tsx
const { data, error } = await supabase.rpc('get_orders_stats', {
  p_start_date: startDate,
  p_end_date: endDate
});
```

**Queries directas**:
```tsx
const { data, error } = await supabase
  .from('products')
  .select('*, manufacturer:profiles!manufacturer_id(company_name, country)')
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

**Inserts/Updates**:
```tsx
const { data, error } = await supabase
  .from('orders')
  .insert({
    buyer_id: user.id,
    product_id,
    quantity,
    total_price,
    status: 'pending'
  });
```

### Upload de Archivos

**A Storage Bucket**:
```tsx
const uploadToBucket = async (
  file: File, 
  bucket: string, 
  folder: string
) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
};
```

**Uso**:
```tsx
const url = await uploadToBucket(
  file, 
  'product-images', 
  user.id
);
```

---

## Deployment

### Build de Producción

```bash
# 1. Build
npm run build

# Output en carpeta dist/
```

### Configuración de Vite

El archivo `vite.config.ts` ya está configurado con:
- Path aliases (`@/` → `src/`)
- Optimización de chunks
- Minificación

### Despliegue Recomendado

**Opción 1: Vercel**
```bash
# Conectar repositorio en dashboard de Vercel
# Variables de entorno en Vercel Dashboard
# Deploy automático en cada push
```

**Opción 2: Netlify**
```bash
# Similar a Vercel
# Build command: npm run build
# Publish directory: dist
```

**Opción 3: Render/Railway/Fly.io**
- Crear servicio web estático
- Build: `npm run build`
- Publicar: `dist/`

### Variables de Entorno en Producción

Asegurarse de configurar en el hosting:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

### Configuración de Supabase

**Auto-confirm Email** (para desarrollo):
- Dashboard → Authentication → Settings
- Enable "Confirm email" = OFF (solo dev)

**Row Level Security**:
- SIEMPRE habilitado en producción
- Revisar políticas antes del deploy

**Storage Policies**:
Verificar que estén correctas:
```sql
-- product-images (público)
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated insert" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
```

---

## Mantenimiento

### Logs y Monitoreo

**Supabase Dashboard**:
- Logs de base de datos
- Métricas de uso
- API requests
- Storage usage

**Client-side**:
```tsx
// Sistema de analytics interno
import { trackEvent } from "@/lib/analytics";

trackEvent("product_viewed", {
  product_id: id,
  user_id: user?.id
});
```

### Backups

**Base de Datos** (Supabase):
- Backups automáticos diarios (plan paid)
- Exportar manualmente: Dashboard → Database → Backups

**Storage**:
- Descargar buckets manualmente si es necesario

### Actualizaciones

**Dependencias**:
```bash
# Ver outdated packages
npm outdated

# Actualizar con cuidado
npm update [package-name]

# Major versions manualmente
npm install [package-name]@latest
```

**Migraciones de Base de Datos**:
Usar Supabase CLI o Dashboard:
```bash
# Con CLI
supabase migration new [name]
supabase db push
```

### Performance

**Optimizaciones Implementadas**:
- Lazy loading de imágenes
- Paginación en tablas
- Caching con TanStack Query
- Memoización selectiva
- Code splitting automático (Vite)

**Métricas a Monitorear**:
- Tiempo de carga inicial (< 3s)
- Time to Interactive (< 5s)
- Core Web Vitals (LCP, FID, CLS)
- Bundle size (< 500kb inicial)

### Troubleshooting

**Error: "Could not find table"**
- Verificar que las tablas existen en Supabase
- Ejecutar migraciones pendientes

**Error: "Row Level Security policy violation"**
- Revisar políticas RLS de la tabla
- Verificar que el usuario tiene el role correcto

**Error: "Invalid API key"**
- Verificar variables de entorno
- Regenerar keys en Supabase si es necesario

**Imágenes no cargan**:
- Verificar políticas de Storage
- Verificar que el bucket existe
- Check CORS settings en Supabase

---

## Contacto y Soporte

Para consultas sobre el proyecto:
- **Email técnico**: [dev-team@leanzupply.com]
- **Repositorio**: [GitHub URL]
- **Documentación API**: [API docs URL]

---

## Apéndices

### A. Categorías de Productos

Lista completa definida en `src/lib/categories.ts`:

```typescript
export const PRODUCT_CATEGORIES = [
  "Refrigeración Comercial e Industrial",
  "Alimentos y Bebidas",
  "Electrónica y Tecnología",
  "Equipamiento Médico",
  "Construcción y Materiales",
  "Agricultura y Ganadería",
  "Automotriz y Transporte",
  "Muebles y Decoración",
  "Empaques y Envases",
  "Químicos y Materias Primas",
  "Otros"
];
```

### B. Puertos de Origen Principales

Para campo `delivery_port` (no implementado aún):
- Puerto de Valparaíso (Chile)
- Puerto de Buenos Aires (Argentina)
- Puerto de Santos (Brasil)
- Puerto de Callao (Perú)
- Puerto de Cartagena (Colombia)

### C. Términos Incoterm Comunes

Para campo `incoterm`:
- FOB (Free On Board)
- CIF (Cost, Insurance & Freight)
- EXW (Ex Works)
- DDP (Delivered Duty Paid)

### D. Glosario de Términos

- **D2B**: Direct-to-Business (directo a empresa)
- **FOB**: Free On Board (precio sin incluir flete ni seguro)
- **MOQ**: Minimum Order Quantity (cantidad mínima de pedido)
- **RLS**: Row Level Security (seguridad a nivel de fila)
- **JWT**: JSON Web Token (token de autenticación)
- **SKU**: Stock Keeping Unit (código de inventario interno)
- **HS Code**: Harmonized System Code (código arancelario)
- **m³**: Metro cúbico (volumen)

---

**Última actualización**: 2025-11-11
**Versión**: 1.0.0

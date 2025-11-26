# 🚀 Guía de Deployment en Vercel - LenzSupply Platform

## 🎯 Objetivo
Desplegar la aplicación frontend en Vercel conectada a la base de datos de Supabase.

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener:
- [ ] Cuenta de Vercel (https://vercel.com)
- [ ] Proyecto de Supabase configurado y funcionando
- [ ] Repositorio Git con el código (GitHub, GitLab o Bitbucket)
- [ ] Variables de entorno de Supabase anotadas:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`

---

## 🔄 Método 1: Deploy desde GitHub (Recomendado)

### Paso 1: Preparar Repositorio Git

1. **Inicializar repositorio (si no existe):**
```bash
cd lenzsupply-platform
git init
git add .
git commit -m "Initial commit - LenzSupply Platform"
```

2. **Crear repositorio en GitHub:**
   - Ir a https://github.com/new
   - Nombre: `lenzsupply-platform`
   - Privado o Público según preferencia
   - NO inicializar con README (ya tienes código)

3. **Push al repositorio:**
```bash
git remote add origin https://github.com/[TU_USUARIO]/lenzsupply-platform.git
git branch -M main
git push -u origin main
```

### Paso 2: Conectar a Vercel

1. **Ir a Vercel Dashboard**
   - https://vercel.com/new
   - Login con tu cuenta

2. **Import Git Repository**
   - Click en "Add New..." → "Project"
   - Seleccionar "Import Git Repository"
   - Autorizar acceso a GitHub si es primera vez
   - Seleccionar repositorio `lenzsupply-platform`

### Paso 3: Configurar Proyecto en Vercel

**Framework Preset:**
- Detectará automáticamente "Vite"
- Si no, seleccionar manualmente "Vite"

**Build Settings:**
- **Framework:** Vite
- **Root Directory:** `./` (raíz del proyecto)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

**IMPORTANTE:** No cambiar estos valores a menos que sea necesario.

### Paso 4: Configurar Variables de Entorno

1. **Expandir "Environment Variables"**
2. **Agregar las 3 variables necesarias:**

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://[TU_PROJECT].supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGc...` (tu anon key) | Production, Preview, Development |
| `VITE_SUPABASE_PROJECT_ID` | `[tu-project-id]` | Production, Preview, Development |

**IMPORTANTE:** 
- Usar el prefix `VITE_` (Vite requiere esto)
- Aplicar a todos los ambientes (Production, Preview, Development)
- NO exponer la `service_role` key aquí (solo para backend)

### Paso 5: Deploy

1. Click en **"Deploy"**
2. Esperar 2-3 minutos mientras Vercel:
   - Clona el repositorio
   - Instala dependencias (`npm install`)
   - Ejecuta build (`npm run build`)
   - Despliega a CDN global

3. **Verificar Deployment:**
   - URL de producción: `https://lenzsupply-xxx.vercel.app`
   - Click en "Visit" para ver el sitio

---

## 🔄 Método 2: Deploy con Vercel CLI

### Instalación de Vercel CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy

1. **Navegar al proyecto:**
```bash
cd lenzsupply-platform
```

2. **Deploy:**
```bash
vercel
```

3. **Responder preguntas:**
   - Setup and deploy? **Y**
   - Which scope? Seleccionar tu cuenta
   - Link to existing project? **N** (primera vez)
   - Project name? `lenzsupply-platform`
   - In which directory? **./** (presionar Enter)
   - Want to override settings? **N**

4. **Agregar variables de entorno:**
```bash
vercel env add VITE_SUPABASE_URL
# Pegar valor y presionar Enter

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
# Pegar valor y presionar Enter

vercel env add VITE_SUPABASE_PROJECT_ID
# Pegar valor y presionar Enter
```

5. **Deploy a producción:**
```bash
vercel --prod
```

---

## ⚙️ Configuración Post-Deployment

### 1. Configurar Dominio Personalizado (Opcional)

1. **En Vercel Dashboard:**
   - Settings → Domains
   - Add Domain

2. **Ejemplo:**
   - `lenzsupply.com`
   - `www.lenzsupply.com`

3. **Configurar DNS:**
   - Agregar registro A o CNAME según instrucciones
   - Esperar propagación DNS (1-24 horas)

### 2. Actualizar Redirect URLs en Supabase

**IMPORTANTE:** Para que la autenticación funcione correctamente.

1. **Ir a Supabase Dashboard**
   - Authentication → URL Configuration

2. **Site URL:**
   - Cambiar de `http://localhost:8080` a tu URL de producción
   - Ejemplo: `https://lenzsupply.vercel.app`

3. **Redirect URLs:**
   - Agregar: `https://lenzsupply.vercel.app/**`
   - Agregar: `https://lenzsupply.vercel.app/auth/callback`

4. **Save**

### 3. Configurar Email Templates (Opcional)

1. **Authentication → Email Templates**
2. Personalizar:
   - Confirm signup
   - Reset password
   - Magic link

3. **Actualizar URLs** en templates:
   - De: `{{ .SiteURL }}`
   - A: `https://lenzsupply.vercel.app`

---

## 🔄 Deployments Automáticos

### Deploy Automático en cada Push

Vercel detecta automáticamente pushes a `main` y deploya:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

→ Vercel automáticamente deployará a producción

### Preview Deployments

Cada rama nueva genera un preview deployment:

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

→ Vercel genera URL de preview única
→ Ejemplo: `https://lenzsupply-git-feature-new-feature-xxx.vercel.app`

---

## 📊 Monitoring y Analytics

### Build Logs

Ver logs de build en tiempo real:
1. Dashboard → Project → Deployments
2. Click en deployment
3. Ver "Build Logs" tab

### Runtime Logs

Ver logs de runtime (funciones serverless si las hay):
1. Dashboard → Project → Functions
2. Click en función
3. Ver "Logs" tab

### Analytics (Opcional)

Habilitar Vercel Analytics:
1. Dashboard → Project → Analytics
2. Enable Analytics
3. Instalar paquete:
```bash
npm install @vercel/analytics
```

4. Agregar en `src/main.tsx`:
```typescript
import { inject } from '@vercel/analytics';

inject();
```

---

## 🚨 Troubleshooting

### Error: "Build failed"

**Síntomas:** Deployment falla en etapa de build.

**Soluciones:**
1. **Verificar logs de build** en Vercel Dashboard
2. **Compilar localmente:**
   ```bash
   npm run build
   ```
3. **Errores comunes:**
   - TypeScript errors → Revisar y corregir
   - Missing dependencies → Verificar `package.json`
   - Environment variables → Verificar que estén configuradas

### Error: "Cannot connect to database"

**Síntomas:** App desplegada pero no conecta a Supabase.

**Soluciones:**
1. **Verificar variables de entorno:**
   - Dashboard → Settings → Environment Variables
   - Verificar que los 3 valores sean correctos
   - Re-deploy después de cambios

2. **Verificar CORS en Supabase:**
   - Dashboard → Settings → API
   - Agregar URL de Vercel a allowed origins

### Error: "Authentication redirect fails"

**Síntomas:** Login funciona pero redirect no.

**Soluciones:**
1. **Actualizar Redirect URLs en Supabase:**
   - Authentication → URL Configuration
   - Agregar URL de Vercel

2. **Verificar Site URL:**
   - Debe ser la URL de producción, no localhost

### Error: "Images not loading"

**Síntomas:** Imágenes de Supabase Storage no cargan.

**Soluciones:**
1. **Verificar que bucket sea público** (para product-images)
2. **Verificar RLS policies** en Storage
3. **Revisar URLs de imágenes** en código

### Performance Issues

**Síntomas:** App lenta o tarda en cargar.

**Soluciones:**
1. **Habilitar Edge Functions en Vercel** (si aplica)
2. **Optimizar imágenes:**
   - Usar WebP
   - Implementar lazy loading
   - Usar CDN de Supabase para imágenes

3. **Code splitting:**
   - Ya implementado con Vite
   - Verificar en build que chunks sean razonables

---

## 🔒 Seguridad en Producción

### Checklist de Seguridad:

- [ ] Variables de entorno configuradas correctamente
- [ ] NUNCA exponer `service_role` key en frontend
- [ ] Habilitar HTTPS (automático en Vercel)
- [ ] Configurar Redirect URLs correctamente en Supabase
- [ ] Habilitar email confirmations en Supabase (producción)
- [ ] Revisar políticas RLS antes de lanzar
- [ ] Configurar rate limiting (si necesario)
- [ ] Implementar CAPTCHA en formularios públicos (opcional)

---

## 📈 Optimizaciones Recomendadas

### 1. Vercel Speed Insights
```bash
npm install @vercel/speed-insights
```

### 2. Image Optimization
```typescript
// Usar Next/Image o componente optimizado
import Image from 'next/image';
```

### 3. Caching Headers
Configurar en `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## ✅ Checklist Final de Deployment

Antes de considerar el deployment completo:

- [ ] Build local exitoso (`npm run build`)
- [ ] Deploy en Vercel exitoso
- [ ] Variables de entorno configuradas
- [ ] Site URL actualizado en Supabase
- [ ] Redirect URLs configuradas
- [ ] Autenticación probada (signup, login, logout)
- [ ] Catálogo de productos cargando
- [ ] Imágenes cargando correctamente
- [ ] Órdenes funcionando end-to-end
- [ ] Notificaciones enviándose
- [ ] Panel de superadmin accesible
- [ ] Dominio personalizado configurado (si aplica)
- [ ] SSL habilitado (automático en Vercel)
- [ ] Analytics configurado (opcional)

---

## 📞 Recursos Adicionales

- [Documentación Vercel](https://vercel.com/docs)
- [Vercel + Vite](https://vercel.com/docs/frameworks/vite)
- [Deploying to Vercel](https://vercel.com/docs/deployments/overview)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/custom-domains)

---

**Última actualización:** Noviembre 2025
**Tiempo estimado de deployment:** 30-60 minutos
**Nivel de dificultad:** Intermedio

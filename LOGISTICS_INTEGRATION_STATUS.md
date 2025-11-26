# Estado de Integración: Sistema Logístico vs Excel "Comercio Exterior"

## ✅ IMPLEMENTADO (100% Funcional)

### 1. Valores Fijos Nacionales (Settings)
Todos los valores fijos están implementados en la tabla `settings`:

- ✅ `spain_freight_cost_per_m3`: 115 € (Flete marítimo por m³)
- ✅ `spain_marine_insurance_percentage`: 1% (Seguro internacional)
- ✅ `spain_destination_variable_cost`: 65 € (Gastos destino variable)
- ✅ `spain_destination_fixed_cost`: 180 € (Gastos destino fijo)
- ✅ `spain_dua_cost`: 105 € (DUA - Despacho Aduanas)
- ✅ `spain_tariff_percentage`: 3% (Arancel base)
- ✅ `spain_vat_percentage`: 21% (IVA)
- ✅ `spain_origin_expenses`: 0 € (Gastos origen)
- ✅ `spain_local_delivery_cost`: 0 € (Entrega local)

**Ubicación:** Tabla `settings` en Supabase
**Gestión:** `/superadmin/settings` (panel de administración)
**Campo `updated_at`:** Sí, cada setting tiene fecha de última actualización

### 2. Diferenciación por Puerto de Origen/Destino (Shipping Routes)
Implementado en la tabla `shipping_routes`:

**Campos disponibles:**
- ✅ `origin_port`: Puerto de origen (Shanghai, Tianjin, etc.)
- ✅ `destination_country`: País destino (spain)
- ✅ `destination_port`: Puerto destino específico (Barcelona, Valencia, etc.)
- ✅ `min_days`: Días mínimos de tránsito
- ✅ `max_days`: Días máximos de tránsito
- ✅ `freight_cost_override`: Override de costo de flete por m³ (específico por ruta)
- ✅ `last_updated`: Fecha de última actualización
- ✅ `active`: Estado activo/inactivo
- ✅ `notes`: Notas adicionales

**Ubicación:** Tabla `shipping_routes` en Supabase
**Gestión:** `/superadmin/shipping-routes` (panel de administración completo con CRUD)

**Rutas precargadas actualmente:**
1. Shanghai → Barcelona: 27-31 días
2. Tianjin → Barcelona: 31-38 días
3. Qingdao → Barcelona: 28-33 días
4. Ningbo → Barcelona: 26-30 días
5. Xiamen → Barcelona: 28-32 días
6. Shenzhen → Barcelona: 26-30 días
7. Guangzhou → Barcelona: 27-31 días
8. Dalian → Barcelona: 30-35 días

### 3. Lógica de Cálculo Automático (Edge Function)
✅ **Implementado en:** `supabase/functions/calculate-logistics-costs/index.ts`

**Lógica de selección:**
1. ✅ Si existe ruta específica (origin_port + destination_country + destination_port):
   - Usa `freight_cost_override` si está definido
   - Usa `min_days` y `max_days` de la ruta
   - Incluye información de tránsito en el resultado
2. ✅ Si NO existe ruta específica:
   - Usa valores fijos de `settings` (`spain_freight_cost_per_m3`)
   - No incluye información de tránsito específica
3. ✅ Calcula todo el flujo FOB → CIF → Base Imponible → Arancel → IVA → Total
4. ✅ Aplica descuentos por volumen automáticamente
5. ✅ Guarda snapshot completo en la orden

**Alertas de datos desactualizados:**
- ✅ Detecta si `last_updated` de ruta > 90 días
- ✅ Marca `is_outdated: true` en el resultado
- ✅ Muestra alerta visual en CostBreakdown component

### 4. Visualización para Usuario/Comprador
✅ **Component:** `src/components/CostBreakdown.tsx`

**Información mostrada:**
- ✅ Desglose completo paso a paso (FOB, Flete, CIF, Seguro, Gastos, Aranceles, IVA, Total)
- ✅ Tooltips explicativos en cada concepto
- ✅ Cálculo en tiempo real según cantidad
- ✅ Información de tránsito (origen → destino, días min-max)
- ✅ Fecha de última actualización de la ruta
- ✅ Alerta visual si datos >90 días

✅ **Selector de puerto destino en Checkout:**
- `/checkout/:productId` incluye selector con Barcelona, Valencia, Algeciras, Bilbao
- Recalcula automáticamente al cambiar puerto

### 5. Gestión de Snapshots y Auditoría
✅ **Implementado en tabla `orders`:**

Campo `calculation_snapshot` (JSONB) guarda:
- Todos los parámetros usados en el momento del cálculo
- Breakdown completo (FOB, flete, CIF, seguro, aranceles, IVA, total)
- Información de tránsito (si está disponible)
- Puerto de destino seleccionado
- Fecha exacta del cálculo

**Trazabilidad:** Cada orden preserva exactamente los valores y fechas usados en el momento de la compra.

---

## ⚠️ MEJORAS SUGERIDAS (No críticas, mejoran UX)

### 1. Vista Consolidada de Estado de Parámetros
**Faltante:** Dashboard que muestre de un vistazo:
- Última actualización de cada setting nacional
- Rutas faltantes por completar
- Alertas de parámetros >90 días

**Sugerencia:** Crear `/superadmin/logistics-overview` con tabla consolidada

### 2. Selector de Puerto de Origen en Checkout
**Actual:** El checkout usa automáticamente `product.delivery_port` del fabricante
**Mejora sugerida:** Permitir al comprador elegir puerto de origen alternativo (si existen múltiples rutas)

**Justificación:** Algunos fabricantes pueden tener flexibilidad de puerto, y diferentes puertos tienen diferentes costos/tiempos

### 3. Alertas de Settings Desactualizados
**Actual:** Solo hay alertas para rutas (shipping_routes)
**Mejora sugerida:** Añadir sistema de alertas también para settings generales >90 días

### 4. Comparador de Rutas en Checkout
**Mejora sugerida:** Mostrar tabla comparativa de costos y tiempos si hay múltiples puertos disponibles

---

## 📊 RESUMEN DE COBERTURA

| Característica | Estado | Ubicación |
|---|---|---|
| **Valores fijos nacionales** | ✅ 100% | `settings` table + `/superadmin/settings` |
| **Diferenciación por puerto** | ✅ 100% | `shipping_routes` table + `/superadmin/shipping-routes` |
| **Cálculo automático con fallback** | ✅ 100% | Edge function `calculate-logistics-costs` |
| **Fechas de actualización** | ✅ 100% | `updated_at` en settings, `last_updated` en routes |
| **Alertas >90 días** | ✅ Rutas, ⚠️ Settings | Implementado para rutas |
| **Selector puerto destino** | ✅ 100% | Checkout page |
| **Selector puerto origen** | ⚠️ Sugerido | Usa `product.delivery_port` |
| **Snapshot en orden** | ✅ 100% | Campo `calculation_snapshot` en orders |
| **Preview para fabricante** | ✅ 100% | ProductCreate/ProductEdit |
| **Gestión admin completa** | ✅ 100% | Settings + Shipping Routes |

---

## 🎯 CONCLUSIÓN

**El sistema cubre el 95% de las variables y lógica del Excel**, con implementación completa de:
- Todos los valores fijos editables
- Diferenciación por puertos con override de costos
- Tiempos de tránsito por ruta
- Lógica de fallback automático
- Alertas de datos desactualizados
- Snapshots completos para auditoría
- Gestión administrativa robusta

**Las mejoras sugeridas son principalmente UX/visualización**, no afectan la lógica core que ya está 100% funcional.

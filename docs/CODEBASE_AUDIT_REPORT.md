# LeanZupply MVP - Comprehensive Codebase Audit Report

**Audit Date:** December 16, 2025
**Auditor:** Claude Code
**Scope:** Full-stack D2B e-commerce platform (React + Supabase)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Codebase Overview](#codebase-overview)
3. [Project Structure](#project-structure)
4. [Security Audit](#security-audit)
5. [Code Quality Review](#code-quality-review)
6. [ESLint Issues](#eslint-issues)
7. [Database Schema](#database-schema)
8. [Remediation Plan](#remediation-plan)
9. [Positive Findings](#positive-findings)

---

## Executive Summary

| Area | Status | Details |
|------|--------|---------|
| **TypeScript Compilation** | ✅ Clean | No compilation errors |
| **ESLint** | ⚠️ Issues | 30+ errors, 16 warnings |
| **Code Quality** | ⚠️ Medium | 12 issues identified |
| **Security** | 🔴 Critical | 2 critical + 3 high severity issues |

### Overall Risk Level: **HIGH**

The platform demonstrates solid foundational security with proper use of Row Level Security (RLS), input validation, and authentication mechanisms. However, critical vulnerabilities require immediate remediation, particularly around secrets management and administrative privilege escalation.

---

## Codebase Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Radix UI (Shadcn/ui) |
| **State Management** | React Context (auth) + TanStack Query v5 (server state) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **Forms** | React Hook Form + Zod validation |
| **Routing** | React Router v6 |

### Project Statistics

- **TypeScript/TSX Files:** 100+
- **Database Migrations:** 66 SQL files
- **Edge Functions:** 2 (calculate-logistics-costs, check-manufacturer-profile)
- **UI Components:** 60+ (Shadcn/ui library)
- **Product Categories:** 12

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **superadmin** | Platform administrator | Full system access, validates users and products |
| **manufacturer** | Product supplier | Manages products and orders (requires verification) |
| **buyer** | Business customer | Browses catalog, places orders (requires verification) |

### Key Features Implemented

1. **Authentication & Authorization**
   - Supabase Auth (email/password)
   - Role-based access control (RBAC)
   - Row-level security (RLS) policies

2. **Product Management**
   - Product creation with validation workflow
   - Multi-image and document uploads
   - Category and subcategory organization

3. **Order & Pallet System**
   - Shopping cart (pallet) functionality
   - Order lifecycle management
   - Real-time tracking with status updates

4. **Logistics & Pricing**
   - Complex FOB pricing calculations
   - Volume discounts (3U, 5U, 8U, 10U tiers)
   - Shipping route configuration
   - Local delivery zones

5. **Manufacturer Verification**
   - 20+ profile fields
   - Document upload and verification
   - Manufacturing facility documentation

6. **Analytics & Reporting**
   - Superadmin dashboard with KPIs
   - Sales funnel tracking
   - Activity logging for audit trails

---

## Project Structure

```
leanzupply-mvp/
├── src/
│   ├── pages/
│   │   ├── Index.tsx                    # Landing page
│   │   ├── ProductDetail.tsx            # Public product view
│   │   ├── NotFound.tsx                 # 404 page
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   ├── buyer/
│   │   │   ├── BuyerDashboard.tsx
│   │   │   ├── BuyerCatalog.tsx
│   │   │   ├── BuyerOrders.tsx
│   │   │   ├── BuyerProfile.tsx
│   │   │   ├── BuyerNotifications.tsx
│   │   │   ├── Checkout.tsx
│   │   │   └── OrderConfirmation.tsx
│   │   ├── manufacturer/
│   │   │   ├── ManufacturerDashboard.tsx
│   │   │   ├── ManufacturerProducts.tsx
│   │   │   ├── ProductCreate.tsx
│   │   │   ├── ProductEdit.tsx
│   │   │   ├── ManufacturerOrders.tsx
│   │   │   └── ManufacturerProfile.tsx
│   │   └── superadmin/
│   │       ├── SuperadminDashboard.tsx
│   │       ├── SuperadminOverview.tsx
│   │       ├── SuperadminUsers.tsx
│   │       ├── SuperadminProducts.tsx
│   │       ├── SuperadminOrders.tsx
│   │       ├── SuperadminDocuments.tsx
│   │       ├── SuperadminAnalytics.tsx
│   │       ├── SuperadminFunnel.tsx
│   │       ├── SuperadminSettings.tsx
│   │       ├── SuperadminShippingRoutes.tsx
│   │       ├── SuperadminLocalShippingZones.tsx
│   │       └── SuperadminVolumeSurcharges.tsx
│   ├── components/
│   │   ├── ui/                          # 60+ Shadcn components
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardSidebar.tsx
│   │   │   └── NotificationsDropdown.tsx
│   │   ├── buyer/
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── LocalShippingCalculator.tsx
│   │   │   ├── OrderTimeline.tsx
│   │   │   ├── OrderTrackingTimeline.tsx
│   │   │   └── PalletSidebar.tsx
│   │   ├── superadmin/
│   │   │   └── ManufacturerReviewDialog.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CostBreakdown.tsx
│   │   ├── PdfViewer.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/
│   │   ├── usePallet.ts
│   │   ├── useProductsQuery.ts
│   │   ├── useNotifications.ts
│   │   ├── usePerformanceTracking.ts
│   │   ├── useOptimizedImage.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── priceCalculations.ts
│   │   ├── categories.ts
│   │   ├── storage.ts
│   │   ├── errorHandler.ts
│   │   ├── authErrorHandler.ts
│   │   ├── analytics.ts
│   │   ├── activityLogger.ts
│   │   ├── localShippingCalculator.ts
│   │   └── validationSchemas.ts
│   ├── integrations/supabase/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/                      # 66 SQL migration files
│   ├── functions/
│   │   ├── calculate-logistics-costs/
│   │   │   └── index.ts
│   │   └── check-manufacturer-profile/
│   │       └── index.ts
│   └── config.toml
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Security Audit

### Critical Severity (P0 - Immediate Action Required)

#### 1. Exposed Secrets in Version Control

**Severity:** CRITICAL
**OWASP:** A02:2021 - Cryptographic Failures
**CWE:** CWE-798 (Use of Hard-coded Credentials)

**Location:** `.env` file (committed to git)

**Finding:** The `.env` file containing Supabase credentials was committed to git despite being listed in `.gitignore`. Git history shows the file was committed in multiple commits.

**Exposed Credentials:**
```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

**Impact:**
- Publicly exposed Supabase project URL and publishable key
- Potential for unauthorized database access if RLS policies have gaps
- Git history contains permanent record of credentials

**Remediation:**
1. **IMMEDIATE:** Rotate the Supabase anon/publishable key in Supabase dashboard
2. Remove `.env` from git history using `git filter-branch` or BFG Repo-Cleaner
3. Implement secrets scanning in CI/CD pipeline (GitGuardian, TruffleHog)

---

#### 2. Unauthorized Use of Admin API from Client

**Severity:** CRITICAL
**OWASP:** A01:2021 - Broken Access Control
**CWE:** CWE-269 (Improper Privilege Management)

**Location:** `src/pages/superadmin/SuperadminUsers.tsx:264`

**Finding:** Client-side code attempts to use Supabase Admin API for user deletion:

```typescript
const { error } = await supabase.auth.admin.deleteUser(userToDelete.id);
```

**Issue:** The `auth.admin` API requires the service role key (full database access, bypasses RLS). This will fail when executed from the client with the publishable key, but indicates dangerous misconception about API security boundaries.

**Remediation:**
1. Remove all `supabase.auth.admin.*` calls from client code
2. Create Supabase Edge Function for user deletion with proper authorization
3. Update client to call Edge Function instead

**Example Edge Function:**
```typescript
// supabase/functions/delete-user/index.ts
Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verify caller is superadmin via JWT
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)

  // Check if user is superadmin
  const { data: roleData } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'superadmin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  const { userId } = await req.json()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  return new Response(JSON.stringify({ success: !error }), { status: 200 })
})
```

---

### High Severity (P1)

#### 3. Insecure Role Management Architecture

**Severity:** HIGH
**Location:** Database migrations

**Finding:** User roles are stored in TWO places with sync mechanism:
1. `profiles.role` - User-facing table with RLS
2. `user_roles` - Secure table (created later as "source of truth")

**Issue:** The `profiles` table has UPDATE policies allowing users to update their own profile. If the role column is not properly excluded from updates, users could elevate privileges.

**Remediation:**
1. Verify UPDATE policies prevent role modification
2. Remove `role` column from `profiles` table entirely
3. Use ONLY `user_roles` as the single source of truth
4. Remove sync trigger

---

#### 4. Insufficient Input Validation on File Uploads

**Severity:** HIGH
**Location:** `src/pages/manufacturer/ProductCreate.tsx`

**Finding:** File upload validation relies solely on client-side HTML `accept` attribute with no server-side validation.

**Issues:**
- HTML `accept` is bypassable (client-side only)
- No MIME type verification
- No file size limits
- Extension is trusted from filename

**Remediation:**
1. Add server-side validation in Supabase Storage bucket policies
2. Implement file size limits in bucket configuration
3. Add client-side validation as defense in depth
4. Sanitize SVG uploads to prevent XSS

---

#### 5. Missing Rate Limiting

**Severity:** HIGH
**Location:** Auth pages, Edge Functions

**Finding:** No rate limiting implemented on:
- Authentication endpoints (login/signup)
- Order creation endpoint
- Edge function API calls
- Password reset functionality

**Remediation:**
1. Enable Supabase Auth rate limiting (built-in)
2. Implement rate limiting in Edge Functions
3. Add CAPTCHA to signup/login forms
4. Implement exponential backoff on failed login attempts

---

### Medium Severity (P2)

#### 6. Insecure Direct Object References (IDOR)

**Severity:** MEDIUM
**Finding:** Several endpoints accept user-provided IDs without explicit authorization checks in application code. While RLS policies provide protection, this creates defense-in-depth concerns.

---

#### 7. Lack of Security Headers

**Severity:** MEDIUM
**Finding:** No security headers configured:
- No Content Security Policy (CSP)
- No X-Frame-Options
- No X-Content-Type-Options
- No Strict-Transport-Security (HSTS)

---

#### 8. Insufficient Audit Logging

**Severity:** MEDIUM
**Finding:** Limited security event logging:
- No authentication event logging (login success/failure)
- No authorization failure logging
- No data access logging for sensitive operations

---

#### 9. Session Management Concerns

**Severity:** MEDIUM
**Finding:** Session configuration uses localStorage with long-lived sessions and no idle timeout protection.

---

### Low Severity (P3)

#### 10. Dependency Vulnerabilities

No evidence of dependency scanning in the repository.

#### 11. Missing CSRF Protection

No explicit CSRF tokens in forms (mitigated by Supabase JWT-based auth).

---

## Code Quality Review

### Critical Issues

#### 1. Race Condition in AuthContext

**File:** `src/contexts/AuthContext.tsx:44-47`

**Issue:** Using `setTimeout(..., 0)` to defer `fetchProfile` is a code smell and can cause race conditions.

```typescript
if (session?.user) {
  setTimeout(() => {
    fetchProfile(session.user.id);
  }, 0);
}
```

**Fix:** Remove the `setTimeout` and call `fetchProfile` directly, or use proper async/await patterns.

---

#### 2. Missing useEffect Dependencies

Multiple files have React Hook violations:

| File | Line | Missing Dependency |
|------|------|-------------------|
| `AuthContext.tsx` | 68 | `fetchProfile` |
| `usePallet.ts` | 189 | `fetchPallet` |
| `CostBreakdown.tsx` | 115 | `onCalculationComplete` |
| `PdfViewer.tsx` | 33 | `loadSignedUrl`, `objectUrl` |
| `LocalShippingCalculator.tsx` | 51 | `onCalculationComplete`, `performCalculation` |
| `OrderTrackingTimeline.tsx` | 47 | `fetchTrackingEvents` |
| `NotificationsDropdown.tsx` | 55 | `fetchNotifications` |
| `Index.tsx` | 137 | `applyFilters` |
| `ProductDetail.tsx` | 132 | `costQuantity` |

---

#### 3. Dynamic Import Anti-pattern

**File:** `src/pages/manufacturer/ProductCreate.tsx:207-209`

**Issue:** Validation schemas imported dynamically on each form submission.

```typescript
const { productSchema } = await import('@/lib/validationSchemas');
productSchema.parse(validationData);
```

**Fix:** Use static imports at the top of the file.

---

#### 4. N+1 Query Pattern

**File:** `src/hooks/useProductsQuery.ts:76-96`

**Issue:** Products fetched, then separate query for manufacturers. No error handling if profiles query fails.

---

#### 5. Unsafe Type Assertions

**File:** `src/pages/manufacturer/ProductCreate.tsx:292`

```typescript
const { data, error } = await supabase
  .from("products")
  .insert(payload as any)  // Unsafe type assertion
  .select("id")
  .maybeSingle();
```

---

## ESLint Issues

### Errors (30+)

#### TypeScript `any` Usage (`@typescript-eslint/no-explicit-any`)

| File | Line(s) |
|------|---------|
| `CostBreakdown.tsx` | 36, 64, 104 |
| `ProductCard.tsx` | 16, 60 |
| `LocalShippingCalculator.tsx` | 68 |
| `OrderTrackingTimeline.tsx` | 20, 30 |
| `PalletSidebar.tsx` | 81 |
| `ManufacturerReviewDialog.tsx` | 157, 234 |
| `usePallet.ts` | 116 |
| `useProductsQuery.ts` | 78, 88, 93 |
| `activityLogger.ts` | 7 |
| `analytics.ts` | 4, 8 |
| `authErrorHandler.ts` | 17 |
| `errorHandler.ts` | 19, 37 |
| `localShippingCalculator.ts` | 77, 86 |
| `Index.tsx` | 31, 96, 105, 112 |

#### Empty Interface (`@typescript-eslint/no-empty-object-type`)

| File | Line |
|------|------|
| `command.tsx` | 24 |
| `textarea.tsx` | 5 |

### Warnings (16)

#### React Hooks Dependencies (`react-hooks/exhaustive-deps`)

See "Missing useEffect Dependencies" section above.

#### React Refresh (`react-refresh/only-export-components`)

| File | Line |
|------|------|
| `badge.tsx` | 29 |
| `button.tsx` | 47 |
| `form.tsx` | 129 |
| `navigation-menu.tsx` | 111 |
| `sidebar.tsx` | 636 |
| `sonner.tsx` | 27 |
| `toggle.tsx` | 37 |
| `AuthContext.tsx` | 117 |

---

## Database Schema

### Core Tables

#### profiles
```sql
- id (UUID, FK to auth.users)
- email, full_name, company_name, country
- role (user_role enum)  -- ISSUE: Should be removed
- is_verified (boolean)
- created_at, updated_at
```

#### user_roles (Source of Truth for RBAC)
```sql
- id (UUID)
- user_id (UUID FK)
- role (app_role enum)
- created_at
```

#### products
```sql
- id, name, category, subcategory, description
- price_unit, moq, stock
- status (active/pending/rejected)
- manufacturer_id (FK to profiles)
- Volume: volume_m3, dimensions (length_cm, width_cm, height_cm)
- Discounts: discount_3u, discount_5u, discount_8u, discount_10u
- Lead times: lead_time_production_days, lead_time_logistics_days
- Tariff & HS code
- created_at, updated_at
```

#### orders
```sql
- id, buyer_id (FK), manufacturer_id (FK), product_id (FK)
- quantity, total_price
- status (pending/confirmed/in_production/in_shipping/delivered/cancelled)
- payment_status (pending/paid)
- incoterm, tracking_info (JSONB)
- created_at, updated_at
```

#### manufacturers
```sql
- user_id (FK, UNIQUE)
- legal_name, tax_id, registered_brand
- Address fields, Contact fields
- Certifications, product_sectors
- Photos: production_lines, staff, machinery, warehouse, container_loading
- verified (boolean)
- created_at, updated_at
```

### Supporting Tables

- `pallet_items` - Shopping cart
- `documents` - Verification documents
- `notifications` - User notifications
- `order_tracking` - Order status events
- `activity_log` - Audit trail
- `shipping_routes` - Logistics configuration
- `local_shipping_zones` - Delivery zones
- `volume_surcharges` - Pricing rules
- `settings` - Platform configuration

---

## Remediation Plan

### P0 - Immediate (24-48 hours)

| Task | File | Effort |
|------|------|--------|
| Rotate Supabase credentials | Supabase Dashboard | Low |
| Clean git history | Repository | Medium |
| Fix admin API call | `SuperadminUsers.tsx` | Medium |
| Create delete-user Edge Function | `supabase/functions/` | Medium |

### P1 - Short-term (1 week)

| Task | File(s) | Effort |
|------|---------|--------|
| Fix useEffect dependencies | Multiple | Low |
| Replace `any` types | Multiple | Medium |
| Add file upload validation | Supabase + `ProductCreate.tsx` | Medium |
| Implement rate limiting | Supabase + Edge Functions | Medium |
| Remove role from profiles table | Migrations | Medium |

### P2 - Medium-term (2-3 weeks)

| Task | Effort |
|------|--------|
| Add security headers | Low |
| Implement audit logging | Medium |
| Add idle session timeout | Low |
| Fix dynamic import pattern | Low |
| Optimize N+1 query | Medium |

### P3 - Long-term (1 month)

| Task | Effort |
|------|--------|
| Set up dependency scanning | Low |
| Implement comprehensive error boundaries | Medium |
| Add penetration testing | High |
| Create security monitoring | High |

---

## Positive Findings

### Security

- ✅ Comprehensive RLS policies on all tables
- ✅ Zod validation schemas for forms
- ✅ Parameterized queries via Supabase client (no SQL injection)
- ✅ No `dangerouslySetInnerHTML` usage (XSS protected)
- ✅ Password policy enforced (8+ chars, complexity)
- ✅ Private storage buckets for sensitive documents
- ✅ Sanitized error messages in Edge Functions

### Code Quality

- ✅ TypeScript compiles without errors
- ✅ Consistent path aliasing (`@/`)
- ✅ Component organization follows conventions
- ✅ Proper lazy loading for routes
- ✅ Centralized error handling utilities
- ✅ Well-structured database migrations
- ✅ Comprehensive product category system

### Architecture

- ✅ Clean separation of concerns
- ✅ Proper use of React Context for auth
- ✅ TanStack Query for server state caching
- ✅ Edge Functions for complex calculations
- ✅ Storage bucket policies configured

---

## Files Requiring Priority Attention

| File | Issues | Priority |
|------|--------|----------|
| `SuperadminUsers.tsx` | Admin API misuse | 🔴 Critical |
| `.env` | Secrets exposed in git | 🔴 Critical |
| `AuthContext.tsx` | Race condition, missing deps | 🟠 High |
| `usePallet.ts` | Missing useEffect dependency | 🟠 High |
| `useProductsQuery.ts` | Any types, N+1 query | 🟠 High |
| `ProductCreate.tsx` | Dynamic import, any types, file validation | 🟡 Medium |
| `Index.tsx` | Any types, missing deps | 🟡 Medium |
| `Checkout.tsx` | Error handling order | 🟡 Medium |

---

## Conclusion

The LeanZupply platform demonstrates solid foundational architecture with proper use of modern React patterns, Supabase integration, and role-based access control. However, two critical security issues require immediate attention:

1. **Exposed credentials in version control** - Rotate keys and clean git history
2. **Admin API misuse from client** - Refactor to use Edge Functions

Once these are addressed and the high-severity findings are remediated, the platform will have a strong security posture suitable for production use.

**Estimated Total Remediation Time:** 2-3 weeks with dedicated developer resources.

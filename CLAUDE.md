# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LenzSupply is a D2B (Direct-to-Business) platform connecting certified manufacturers from Latin America with international business buyers. The platform handles product sourcing, logistics coordination, and export validation.

**This project is in production.** Take extra care when making changes - ensure backwards compatibility and avoid breaking changes.

## Development Commands

```bash
npm run dev        # Start dev server on port 8080
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI primitives (Shadcn/ui)
- **State**: React Context (auth) + TanStack Query v5 (server state)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Forms**: React Hook Form + Zod validation

### Key Directories
- `src/pages/` - Route pages organized by role (superadmin/, manufacturer/, buyer/, auth/)
- `src/components/ui/` - Shadcn/ui base components
- `src/components/dashboard/` - Shared dashboard layout components
- `src/contexts/AuthContext.tsx` - Authentication state and user profile
- `src/integrations/supabase/` - Supabase client and auto-generated types
- `src/hooks/` - Custom hooks (usePallet, useProductsQuery, useNotifications)
- `src/lib/` - Utilities (errorHandler, categories, priceCalculations, storage)
- `supabase/migrations/` - Database migrations
- `supabase/functions/` - Deno edge functions

### Path Alias
`@/` maps to `src/` (configured in tsconfig.json and vite.config.ts)

### User Roles
Three user roles with distinct permissions:
- **superadmin**: Full system access, validates users and products
- **manufacturer**: Manages products and orders (requires verification)
- **buyer**: Browses catalog, places orders (requires verification)

Role is stored in `user_roles` table and fetched in AuthContext alongside profile data.

### Authentication Flow
1. Supabase Auth handles signup/login
2. `profiles` table stores user info
3. `user_roles` table stores role (source of truth for RBAC)
4. `ProtectedRoute` component enforces role-based access
5. Dashboard pages lazy-loaded with `React.lazy()` and `Suspense`

### Database
- PostgreSQL with Row Level Security (RLS) policies
- Key tables: profiles, manufacturers, products, orders, notifications, pallet_items, order_tracking
- Migrations in `supabase/migrations/`

### Storage Buckets
- `product-images` - Public product images
- `product-docs` - Private technical documentation
- `manufacturer-docs` - Manufacturer verification photos

## Code Conventions

### TypeScript
- Path imports: `import { X } from "@/components/..."` not relative paths
- Types in `src/integrations/supabase/types.ts` are auto-generated

### Components
- Functional components with hooks
- UI components from `@/components/ui/` (Shadcn/ui pattern)
- Use semantic color tokens (bg-primary, text-foreground) not direct colors

### State Management
```tsx
// Auth context
const { user, profile, loading, signOut } = useAuth();

// Server state with TanStack Query
const { data, isLoading } = useProductsQuery({ status: 'active' });
```

### Error Handling
```tsx
import { handleError } from "@/lib/errorHandler";
try {
  // operation
} catch (error) {
  const message = handleError("Context", error);
  toast.error(message);
}
```

### Supabase Queries
```tsx
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase
  .from('products')
  .select('*, manufacturer:profiles!manufacturer_id(company_name)')
  .eq('status', 'active');
```

## Product Categories
Defined in `src/lib/categories.ts` - 12 categories with associated Lucide icons.

## Business Logic

### Product Lifecycle
1. Manufacturer creates product (status: 'pending')
2. Superadmin validates (status: 'active' or 'rejected')
3. Active products visible in public catalog

### Order Flow
1. Buyer adds to pallet (pallet_items table)
2. Checkout creates order (status: 'pending')
3. Manufacturer confirms/rejects
4. Tracking events logged in order_tracking table

### Pricing
- All prices in EUR (FOB)
- 12% platform commission on sales
- Cost breakdown includes logistics, insurance, customs

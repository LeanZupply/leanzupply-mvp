import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieBanner } from "@/components/CookieBanner";
import { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Lazy load dashboard pages
const SuperadminDashboard = lazy(() => import("./pages/superadmin/SuperadminDashboard"));
const SuperadminOverview = lazy(() => import("./pages/superadmin/SuperadminOverview"));
const SuperadminUsers = lazy(() => import("./pages/superadmin/SuperadminUsers"));
const SuperadminProducts = lazy(() => import("./pages/superadmin/SuperadminProducts"));
const SuperadminOrders = lazy(() => import("./pages/superadmin/SuperadminOrders"));
const SuperadminQuoteRequests = lazy(() => import("./pages/superadmin/SuperadminQuoteRequests"));
const SuperadminDocuments = lazy(() => import("./pages/superadmin/SuperadminDocuments"));
const SuperadminAnalytics = lazy(() => import("./pages/superadmin/SuperadminAnalytics"));
const SuperadminFunnel = lazy(() => import("./pages/superadmin/SuperadminFunnel"));
const SuperadminSettings = lazy(() => import("./pages/superadmin/SuperadminSettings"));
const SuperadminShippingRoutes = lazy(() => import("./pages/superadmin/SuperadminShippingRoutes"));
const SuperadminLocalShippingZones = lazy(() => import("./pages/superadmin/SuperadminLocalShippingZones"));
const SuperadminVolumeSurcharges = lazy(() => import("./pages/superadmin/SuperadminVolumeSurcharges"));
const ManufacturerDashboard = lazy(() => import("./pages/manufacturer/ManufacturerDashboard"));
const ManufacturerProducts = lazy(() => import("./pages/manufacturer/ManufacturerProducts"));
const ProductCreate = lazy(() => import("./pages/manufacturer/ProductCreate"));
const ProductEdit = lazy(() => import("./pages/manufacturer/ProductEdit"));
const ManufacturerOrders = lazy(() => import("./pages/manufacturer/ManufacturerOrders"));
const ManufacturerProfile = lazy(() => import("./pages/manufacturer/ManufacturerProfile"));
const BuyerDashboard = lazy(() => import("./pages/buyer/BuyerDashboard"));
const BuyerCatalog = lazy(() => import("./pages/buyer/BuyerCatalog"));
const BuyerOrders = lazy(() => import("./pages/buyer/BuyerOrders"));
const BuyerProfile = lazy(() => import("./pages/buyer/BuyerProfile"));
const BuyerNotifications = lazy(() => import("./pages/buyer/BuyerNotifications"));
const Checkout = lazy(() => import("./pages/buyer/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/buyer/OrderConfirmation"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CookieConsentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />

              {/* Legal Pages (Public Routes) */}
              <Route path="/legal/privacidad" element={<Suspense fallback={<LoadingScreen />}><PrivacyPolicy /></Suspense>} />
              <Route path="/legal/cookies" element={<Suspense fallback={<LoadingScreen />}><CookiePolicy /></Suspense>} />
            
            {/* Superadmin Routes */}
            <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><Suspense fallback={<LoadingScreen />}><SuperadminDashboard /></Suspense></ProtectedRoute>} />
            <Route path="/superadmin/overview" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminOverview /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/users" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminUsers /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/products" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminProducts /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/orders" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminOrders /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/quote-requests" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminQuoteRequests /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/documents" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminDocuments /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/analytics" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminAnalytics /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/funnel" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminFunnel /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/settings" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminSettings /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/shipping-routes" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminShippingRoutes /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/local-shipping-zones" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminLocalShippingZones /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/volume-surcharges" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><SuperadminVolumeSurcharges /></Suspense></DashboardLayout></ProtectedRoute>} />

            {/* Manufacturer Routes */}
            <Route path="/manufacturer" element={<ProtectedRoute allowedRoles={["manufacturer"]}><Suspense fallback={<LoadingScreen />}><ManufacturerDashboard /></Suspense></ProtectedRoute>} />
            <Route path="/manufacturer/products" element={<ProtectedRoute allowedRoles={["manufacturer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><ManufacturerProducts /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/manufacturer/products/create" element={<ProtectedRoute allowedRoles={["manufacturer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><ProductCreate /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/manufacturer/products/edit/:id" element={<ProtectedRoute allowedRoles={["manufacturer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><ProductEdit /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/manufacturer/orders" element={<ProtectedRoute allowedRoles={["manufacturer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><ManufacturerOrders /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/manufacturer/profile" element={<ProtectedRoute allowedRoles={["manufacturer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><ManufacturerProfile /></Suspense></DashboardLayout></ProtectedRoute>} />

            {/* Product Detail (Public Route) */}
            <Route path="/product/:id" element={<Suspense fallback={<LoadingScreen />}><ProductDetail /></Suspense>} />
            <Route path="/products/:id" element={<Suspense fallback={<LoadingScreen />}><ProductDetail /></Suspense>} />

            {/* Buyer Routes */}
            <Route path="/buyer" element={<ProtectedRoute allowedRoles={["buyer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><BuyerDashboard /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/buyer/catalog" element={<ProtectedRoute allowedRoles={["buyer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><BuyerCatalog /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/buyer/orders" element={<ProtectedRoute allowedRoles={["buyer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><BuyerOrders /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/buyer/profile" element={<ProtectedRoute allowedRoles={["buyer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><BuyerProfile /></Suspense></DashboardLayout></ProtectedRoute>} />
            <Route path="/buyer/notifications" element={<ProtectedRoute allowedRoles={["buyer"]}><DashboardLayout><Suspense fallback={<LoadingScreen />}><BuyerNotifications /></Suspense></DashboardLayout></ProtectedRoute>} />
            
            {/* Checkout Flow - handles auth internally (allows guests for quote mode) */}
            <Route path="/checkout/:productId" element={<Suspense fallback={<LoadingScreen />}><Checkout /></Suspense>} />
            <Route path="/order-confirmation" element={<Suspense fallback={<LoadingScreen />}><OrderConfirmation /></Suspense>} />

            <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieBanner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </CookieConsentProvider>
  </QueryClientProvider>
);

export default App;

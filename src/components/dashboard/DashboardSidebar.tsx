import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Bell,
  UserCircle,
  Store,
  LineChart,
  Settings,
  LogOut,
  ChevronUp,
  User,
  TrendingUp,
  Ship,
  MapPin,
  PackageCheck,
  MessageSquare,
} from "lucide-react";

const navigationMap = {
  superadmin: [
    { title: "Resumen", icon: BarChart3, url: "/superadmin/overview" },
    { title: "Usuarios", icon: Users, url: "/superadmin/users" },
    { title: "Productos", icon: Package, url: "/superadmin/products" },
    { title: "Órdenes", icon: ShoppingCart, url: "/superadmin/orders" },
    { title: "Solicitudes", icon: MessageSquare, url: "/superadmin/quote-requests" },
    { title: "Documentos", icon: FileText, url: "/superadmin/documents" },
    { title: "Análisis", icon: LineChart, url: "/superadmin/analytics" },
    { title: "Funnel", icon: TrendingUp, url: "/superadmin/funnel" },
    { title: "Rutas Internacionales", icon: Ship, url: "/superadmin/shipping-routes" },
    { title: "Zonas Locales", icon: MapPin, url: "/superadmin/local-shipping-zones" },
    { title: "Recargos Volumen", icon: PackageCheck, url: "/superadmin/volume-surcharges" },
    { title: "Configuración", icon: Settings, url: "/superadmin/settings" },
  ],
  manufacturer: [
    { title: "Dashboard", icon: BarChart3, url: "/manufacturer" },
    { title: "Productos", icon: Package, url: "/manufacturer/products" },
    { title: "Pedidos", icon: ShoppingCart, url: "/manufacturer/orders" },
    { title: "Perfil", icon: UserCircle, url: "/manufacturer/profile" },
  ],
  buyer: [
    { title: "Dashboard", icon: BarChart3, url: "/buyer" },
    { title: "Catálogo", icon: Store, url: "/buyer/catalog" },
    { title: "Mis Pedidos", icon: ShoppingCart, url: "/buyer/orders" },
  ],
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "buyer":
      return "Comprador";
    case "manufacturer":
      return "Fabricante";
    case "superadmin":
      return "Administrador";
    default:
      return role;
  }
};

export const DashboardSidebar = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const items = navigationMap[profile.role];

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-foreground">
            <Package className="h-5 w-5 text-sidebar-background" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-sidebar-foreground">LeanZupply</h2>
            <p className="text-xs text-sidebar-foreground/60">{getRoleLabel(profile.role)}</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9 px-3">
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-normal"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      <span className="text-sm font-normal">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-sidebar-accent h-auto py-2 px-2"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent flex-shrink-0">
                  <User className="h-4 w-4 text-sidebar-accent-foreground" />
                </div>
                <div className="flex flex-col items-start text-left flex-1 min-w-0 overflow-hidden">
                  <span className="text-sm font-normal text-sidebar-foreground truncate w-full block">
                    {profile.company_name || profile.full_name || "Usuario"}
                  </span>
                  <span className="text-xs text-sidebar-foreground/60 truncate w-full block">
                    {profile.email}
                  </span>
                </div>
              </div>
              <ChevronUp className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            className="w-72 bg-background border-border z-50 mb-2"
          >
            <DropdownMenuLabel className="pb-3">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-semibold text-foreground break-words">
                  {profile.company_name || profile.full_name || profile.email}
                </p>
                <p className="text-sm text-muted-foreground break-all">{profile.email}</p>
                {profile.full_name && (
                  <div className="pt-1 border-t border-border">
                    <p className="text-xs text-muted-foreground">Contacto</p>
                    <p className="text-sm text-foreground">{profile.full_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Rol</p>
                  <Badge variant="secondary" className="mt-1">
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {profile.role === "buyer" && (
              <>
                <DropdownMenuItem
                  onClick={() => navigate("/buyer/profile")}
                  className="cursor-pointer"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Configuración de perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {profile.role === "manufacturer" && (
              <>
                <DropdownMenuItem
                  onClick={() => navigate("/manufacturer/profile")}
                  className="cursor-pointer"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Configuración de perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

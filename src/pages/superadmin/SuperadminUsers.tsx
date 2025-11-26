import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, CheckCircle2, Clock, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/errorHandler";
import { logActivity } from "@/lib/activityLogger";
import { ManufacturerReviewDialog } from "@/components/superadmin/ManufacturerReviewDialog";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  country: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

interface ManufacturerProfile {
  id: string;
  user_id: string;
  legal_name: string;
  tax_id: string;
  registered_brand: string;
  brand_logo_url: string;
  country: string;
  province: string;
  city: string;
  postal_code?: string;
  address: string;
  official_website: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  english_level: string;
  certifications: string[];
  vacation_dates: string;
  product_sectors: string[];
  production_capacity?: string;
  machinery?: string;
  total_employees?: number;
  facility_area_m2?: number;
  factory_positioning: string;
  factory_history: string;
  photos_production_lines: string[];
  photos_staff: string[];
  photos_machinery: string[];
  photos_warehouse: string[];
  photos_container_loading: string[];
  terms_accepted: boolean;
  verified: boolean;
  verification_status?: string;
  verification_notes?: string;
  created_at?: string;
  updated_at?: string;
}

const SuperadminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [filteredManufacturers, setFilteredManufacturers] = useState<ManufacturerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [manufacturerSearch, setManufacturerSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedManufacturer, setSelectedManufacturer] = useState<ManufacturerProfile | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manufacturers");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchManufacturers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  useEffect(() => {
    filterManufacturers();
  }, [manufacturerSearch, manufacturers]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("role", "manufacturer")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      const message = handleError("Users fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturers = async () => {
    try {
      // Fetch manufacturers from profiles table instead of manufacturers table
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "manufacturer")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch manufacturer details if they exist
      const manufacturerIds = (profilesData || []).map(p => p.id);
      let manufacturerDetailsMap: Record<string, any> = {};
      
      if (manufacturerIds.length > 0) {
        const { data: detailsData, error: detailsError } = await supabase
          .from("manufacturers")
          .select("*")
          .in("user_id", manufacturerIds);

        if (!detailsError && detailsData) {
          manufacturerDetailsMap = Object.fromEntries(
            detailsData.map(d => [d.user_id, d])
          );
        }
      }

      // Combine profile data with manufacturer details
      const combined = (profilesData || []).map((profile: any) => {
        const details = manufacturerDetailsMap[profile.id] || {};
        return {
          id: details.id || profile.id,
          user_id: profile.id,
          legal_name: details.legal_name || profile.company_name || '',
          tax_id: details.tax_id || '',
          registered_brand: details.registered_brand || profile.company_name || '',
          brand_logo_url: details.brand_logo_url || '',
          country: details.country || profile.country || '',
          province: details.province || '',
          city: details.city || '',
          postal_code: details.postal_code || '',
          address: details.address || '',
          official_website: details.official_website || '',
          primary_contact_name: details.primary_contact_name || profile.full_name || '',
          primary_contact_email: details.primary_contact_email || profile.email || '',
          primary_contact_phone: details.primary_contact_phone || '',
          english_level: details.english_level || '',
          certifications: details.certifications || [],
          vacation_dates: details.vacation_dates || '',
          product_sectors: details.product_sectors || [],
          production_capacity: details.production_capacity || '',
          machinery: details.machinery || '',
          total_employees: details.total_employees || 0,
          facility_area_m2: details.facility_area_m2 || 0,
          factory_positioning: details.factory_positioning || '',
          factory_history: details.factory_history || '',
          photos_production_lines: details.photos_production_lines || [],
          photos_staff: details.photos_staff || [],
          photos_machinery: details.photos_machinery || [],
          photos_warehouse: details.photos_warehouse || [],
          photos_container_loading: details.photos_container_loading || [],
          terms_accepted: details.terms_accepted || false,
          verified: details.verified !== undefined ? details.verified : profile.is_verified || false,
          verification_status: details.verification_status || 'pending',
          verification_notes: details.verification_notes || '',
          created_at: profile.created_at,
          updated_at: details.updated_at || profile.updated_at,
        };
      });

      setManufacturers(combined);
      setFilteredManufacturers(combined);
    } catch (error) {
      const message = handleError("Manufacturers fetch", error);
      toast.error(message);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredUsers(
      users.filter(
        (user) =>
          user.full_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query) ||
          user.company_name.toLowerCase().includes(query)
      )
    );
  };

  const filterManufacturers = () => {
    if (!manufacturerSearch.trim()) {
      setFilteredManufacturers(manufacturers);
      return;
    }

    const query = manufacturerSearch.toLowerCase();
    setFilteredManufacturers(
      manufacturers.filter(
        (m) =>
          m.primary_contact_name.toLowerCase().includes(query) ||
          m.primary_contact_email.toLowerCase().includes(query) ||
          m.registered_brand.toLowerCase().includes(query) ||
          m.country.toLowerCase().includes(query)
      )
    );
  };

  const toggleVerified = async (manufacturerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("manufacturers")
        .update({ verified: !currentStatus })
        .eq("id", manufacturerId);

      if (error) throw error;

      setManufacturers((prev) =>
        prev.map((m) =>
          m.id === manufacturerId ? { ...m, verified: !currentStatus } : m
        )
      );

      // Log activity
      await logActivity({
        action: !currentStatus ? "Verified manufacturer" : "Unverified manufacturer",
        entity: "manufacturer",
        entity_id: manufacturerId,
        metadata: { verified: !currentStatus },
      });

      toast.success(`Fabricante ${!currentStatus ? "verificado" : "desverificado"} exitosamente`);
    } catch (error) {
      const message = handleError("Manufacturer update", error);
      toast.error(message);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete from auth.users which will cascade to profiles
      const { error } = await supabase.auth.admin.deleteUser(userToDelete.id);

      if (error) throw error;

      // Update local state
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setManufacturers((prev) => prev.filter((m) => m.id !== userToDelete.id));
      setFilteredUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setFilteredManufacturers((prev) => prev.filter((m) => m.id !== userToDelete.id));

      // Log activity
      await logActivity({
        action: "Deleted user",
        entity: "user",
        entity_id: userToDelete.id,
        metadata: { email: userToDelete.email, role: userToDelete.role },
      });

      toast.success("Usuario eliminado exitosamente");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      const message = handleError("User deletion", error);
      toast.error(message);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "default";
      case "manufacturer":
        return "secondary";
      case "buyer":
        return "outline";
      default:
        return "outline";
    }
  };

  const getVerificationStatusBadge = (isVerified?: boolean) => {
    if (isVerified) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verificado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  const getManufacturersByStatus = (isVerified: boolean) => {
    return filteredManufacturers.filter(m => m.verified === isVerified);
  };

  const pendingCount = manufacturers.filter(m => !m.verified).length;
  const changesRequestedCount = 0; // Placeholder for future implementation

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Gestión de Usuarios</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Administra y verifica usuarios de la plataforma</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manufacturers" className="relative">
            Fabricantes
            {(pendingCount > 0 || changesRequestedCount > 0) && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center" variant="destructive">
                {pendingCount + changesRequestedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Otros Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="manufacturers" className="space-y-4">
          {/* Fabricantes Pendientes */}
          {getManufacturersByStatus(false).length > 0 && (
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Fabricantes Pendientes de Revisión ({getManufacturersByStatus(false).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[140px]">Empresa</TableHead>
                        <TableHead className="hidden sm:table-cell min-w-[120px]">Nombre</TableHead>
                        <TableHead className="min-w-[180px]">Email</TableHead>
                        <TableHead className="hidden md:table-cell">País</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="min-w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {getManufacturersByStatus(false).map((manufacturer) => (
                      <TableRow key={manufacturer.id}>
                        <TableCell className="font-medium text-sm">{manufacturer.registered_brand}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{manufacturer.primary_contact_name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs sm:text-sm">{manufacturer.primary_contact_email}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{manufacturer.country}</TableCell>
                        <TableCell>
                          {manufacturer.legal_name && manufacturer.tax_id ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                              Completo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                              Incompleto
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getVerificationStatusBadge(manufacturer.verified)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setSelectedManufacturer(manufacturer);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Revisar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Todos los Fabricantes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Todos los Fabricantes ({filteredManufacturers.length})</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empresa, email o país..."
                  value={manufacturerSearch}
                  onChange={(e) => setManufacturerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManufacturers.map((manufacturer) => (
                    <TableRow key={manufacturer.id}>
                      <TableCell className="font-medium">{manufacturer.registered_brand}</TableCell>
                      <TableCell>{manufacturer.primary_contact_name}</TableCell>
                      <TableCell className="text-muted-foreground">{manufacturer.primary_contact_email}</TableCell>
                      <TableCell>{manufacturer.country}</TableCell>
                      <TableCell>
                        {manufacturer.legal_name && manufacturer.tax_id ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Completo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            Incompleto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getVerificationStatusBadge(manufacturer.verified)}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedManufacturer(manufacturer);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setUserToDelete(manufacturer as any);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredManufacturers.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No se encontraron fabricantes</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Todos los Fabricantes</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar fabricante..."
                  value={manufacturerSearch}
                  onChange={(e) => setManufacturerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManufacturers.map((manufacturer) => (
                    <TableRow key={manufacturer.id}>
                      <TableCell className="font-medium">{manufacturer.registered_brand}</TableCell>
                      <TableCell>{manufacturer.primary_contact_name}</TableCell>
                      <TableCell className="text-muted-foreground">{manufacturer.primary_contact_email}</TableCell>
                      <TableCell>{manufacturer.country}</TableCell>
                      <TableCell>{getVerificationStatusBadge(manufacturer.verified)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedManufacturer(manufacturer);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(manufacturer as any);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredManufacturers.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No se encontraron fabricantes</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Otros Usuarios (Compradores y Admins)</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Verificado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.company_name}</TableCell>
                      <TableCell>{user.country}</TableCell>
                      <TableCell>
                        <Switch
                          checked={user.is_verified || false}
                          onCheckedChange={() => toggleVerified(user.id, user.is_verified || false)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No se encontraron usuarios</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ManufacturerReviewDialog
        manufacturer={selectedManufacturer}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onUpdate={() => {
          fetchManufacturers();
          fetchUsers();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
              <span className="font-semibold">{userToDelete?.email}</span> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperadminUsers;

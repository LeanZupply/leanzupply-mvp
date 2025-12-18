import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, Package2 } from "lucide-react";
import loginIllustration from "@/assets/login-illustration.jpg";
import { getSafeAuthError } from "@/lib/authErrorHandler";
const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    country: "",
    role: "buyer" as "manufacturer" | "buyer"
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    user,
    profile
  } = useAuth();
  useEffect(() => {
    if (user && profile) {
      const dashboardMap = {
        superadmin: "/superadmin/overview",
        manufacturer: "/manufacturer/products",
        buyer: "/buyer/catalog"
      };
      navigate(dashboardMap[profile.role]);
    }
  }, [user, profile, navigate]);
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod schema
    try {
      const { signupSchema } = await import('@/lib/validationSchemas');
      signupSchema.parse({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        companyName: formData.companyName,
        country: formData.country,
      });
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error("Error de validación");
      }
      return;
    }
    
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            country: formData.country,
            role: formData.role
          }
        }
      });
      if (error) throw error;
      toast.success("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.");
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch (error: any) {
      toast.error(getSafeAuthError(error));
      // Log detailed error only in development
      if (import.meta.env.DEV) {
        console.error('[Auth] Signup error:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="flex min-h-screen">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-8 py-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-6">
              <Package2 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">LeanZupply</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Únete a LeanZupply
            </h1>
            <p className="text-muted-foreground">
              Crea tu cuenta empresarial y comienza a conectar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Nombre completo
                </Label>
                <Input id="fullName" value={formData.fullName} onChange={e => setFormData({
                ...formData,
                fullName: e.target.value
              })} required className="h-11 px-4 rounded-xl border-border focus:border-primary transition-colors" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-foreground">
                  País
                </Label>
                <Input id="country" value={formData.country} onChange={e => setFormData({
                ...formData,
                country: e.target.value
              })} required className="h-11 px-4 rounded-xl border-border focus:border-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electrónico
              </Label>
              <Input id="email" type="email" placeholder="tu@empresa.com" value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} required className="h-11 px-4 rounded-xl border-border focus:border-primary transition-colors" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </Label>
              <Input id="password" type="password" value={formData.password} onChange={e => setFormData({
              ...formData,
              password: e.target.value
            })} required className="h-11 px-4 rounded-xl border-border focus:border-primary transition-colors" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                Nombre de la empresa
              </Label>
              <Input id="companyName" value={formData.companyName} onChange={e => setFormData({
              ...formData,
              companyName: e.target.value
            })} required className="h-11 px-4 rounded-xl border-border focus:border-primary transition-colors" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-foreground">
                Tipo de cuenta
              </Label>
              <Select value={formData.role} onValueChange={(value: "manufacturer" | "buyer") => setFormData({
              ...formData,
              role: value
            })}>
                <SelectTrigger className="h-11 rounded-xl border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Fabricante</SelectItem>
                  <SelectItem value="buyer">Comprador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl font-medium text-base group mt-6" disabled={loading}>
              {loading ? "Creando cuenta..." : <>
                  Crear cuenta
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <button onClick={() => navigate("/auth/login")} className="font-medium text-primary hover:text-primary/80 transition-colors">
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#2C0405] via-[#4A0E0F] to-[#6A1E1E] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16 text-white bg-green-950">
          {/* Illustration */}
          <div className="relative w-full max-w-2xl mb-12">
            <img src={loginIllustration} alt="LeanZupply Platform Illustration" className="w-full h-auto rounded-2xl shadow-2xl" />
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl rotate-12 animate-pulse" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 backdrop-blur-sm rounded-full animate-pulse-delay" />
          </div>

          {/* Text Content */}
          <div className="text-center space-y-4 max-w-xl">
            <h2 className="text-4xl font-bold">
              Todo en un solo lugar
            </h2>
            <p className="text-xl text-white/80">
              Productos, métricas y acuerdos comerciales centralizados
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Red de<br />contactos</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Métricas en<br />tiempo real</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Transacciones<br />seguras</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
      </div>
    </div>;
};
export default Signup;
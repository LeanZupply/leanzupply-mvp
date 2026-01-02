import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Package2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import loginIllustration from "@/assets/login-illustration.jpg";
import { getSafeAuthError } from "@/lib/authErrorHandler";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if we have a valid session/token from the email link
    const checkToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // If there's a session, the token is valid
        setIsValidToken(!!session);
        
        // Also check URL hash for token (Supabase sometimes puts it there)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('access_token') || hashParams.get('type') === 'recovery') {
          setIsValidToken(true);
        }
      } catch (error) {
        setIsValidToken(false);
        if (import.meta.env.DEV) {
          console.error('[Auth] Token check error:', error);
        }
      }
    };

    checkToken();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod schema
    try {
      const { resetPasswordSchema } = await import('@/lib/validationSchemas');
      resetPasswordSchema.parse({ password, confirmPassword });
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("¡Contraseña restablecida exitosamente!");
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (error: any) {
      toast.error(getSafeAuthError(error));
      // Log detailed error only in development
      if (import.meta.env.DEV) {
        console.error('[Auth] Reset password error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (isValidToken === false) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 flex items-center justify-center bg-background px-4 sm:px-8 py-8 sm:py-12 lg:px-16">
          <div className="w-full max-w-md space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Package2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="text-xl sm:text-2xl font-bold text-foreground">LeanZupply</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Enlace inválido o expirado
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                El enlace de recuperación no es válido o ha expirado. Por favor, solicita uno nuevo.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => navigate("/auth/forgot-password")}
                className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base"
              >
                Solicitar nuevo enlace
              </Button>
              <button
                onClick={() => navigate("/auth/login")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 sm:px-8 py-8 sm:py-12 lg:px-16">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo & Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Package2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-xl sm:text-2xl font-bold text-foreground">LeanZupply</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Restablecer contraseña
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Ingresa tu nueva contraseña. Asegúrate de que sea segura y diferente a la anterior.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className="h-12 px-4 pr-10 rounded-xl border-border focus:border-primary transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, con mayúscula, minúscula y número
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                    className="h-12 px-4 pr-10 rounded-xl border-border focus:border-primary transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base group" 
              disabled={loading}
            >
              {loading ? "Restableciendo..." : (
                <>
                  Restablecer contraseña
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-4 sm:pt-6 border-t border-border">
            <button
              onClick={() => navigate("/auth/login")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#2C0405] via-[#4A0E0F] to-[#6A1E1E] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16 text-white bg-emerald-950">
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
              Crea una contraseña segura
            </h2>
            <p className="text-xl text-white/80">
              Protege tu cuenta con una contraseña fuerte y única
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Seguridad<br />garantizada</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Protección<br />avanzada</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Acceso<br />inmediato</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default ResetPassword;


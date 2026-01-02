import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Package2, ArrowLeft } from "lucide-react";
import loginIllustration from "@/assets/login-illustration.jpg";
import { getSafeAuthError } from "@/lib/authErrorHandler";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod schema
    try {
      const { forgotPasswordSchema } = await import('@/lib/validationSchemas');
      forgotPasswordSchema.parse({ email });
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      // Always show success message (security: prevent email enumeration)
      setEmailSent(true);
      toast.success("Si el email existe, recibirás un enlace para restablecer tu contraseña");
    } catch (error: any) {
      // Still show generic success to prevent email enumeration
      setEmailSent(true);
      if (import.meta.env.DEV) {
        console.error('[Auth] Forgot password error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

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
              {emailSent ? "Revisa tu correo" : "Recuperar contraseña"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {emailSent 
                ? "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña."
                : "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña"
              }
            </p>
          </div>

          {!emailSent ? (
            <>
              {/* Form */}
              <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Correo electrónico
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tu@empresa.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      className="h-12 px-4 rounded-xl border-border focus:border-primary transition-colors" 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base group" 
                  disabled={loading}
                >
                  {loading ? "Enviando..." : (
                    <>
                      Enviar enlace de recuperación
                      <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Revisa tu bandeja de entrada y la carpeta de spam. El enlace expira en 1 hora.
                </p>
              </div>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                variant="outline"
                className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base"
              >
                Enviar otro enlace
              </Button>
            </div>
          )}

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
              Recupera el acceso a tu cuenta
            </h2>
            <p className="text-xl text-white/80">
              Te ayudamos a restablecer tu contraseña de forma segura
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Proceso<br />seguro</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Enlace por<br />email</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mx-auto flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-white/70">Válido por<br />1 hora</p>
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

export default ForgotPassword;


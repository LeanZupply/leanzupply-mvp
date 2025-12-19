import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowLeft, Cookie, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

const CookiePolicy = () => {
  const { consent, acceptAnalytics, rejectAnalytics, resetConsent } = useCookieConsent();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">LeanZupply</span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Politica de Cookies</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            Ultima actualizacion: Diciembre 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Que son las Cookies</h2>
            <p className="text-muted-foreground">
              Las cookies son pequenos archivos de texto que los sitios web almacenan en tu navegador. Se utilizan para recordar tus preferencias, mantener tu sesion iniciada y recopilar informacion sobre como utilizas el sitio para mejorarlo.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Tipos de Cookies que Utilizamos</h2>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cookie className="h-5 w-5" />
                  Cookies Tecnicas (Esenciales)
                </CardTitle>
                <CardDescription>
                  Siempre activas - Necesarias para el funcionamiento del sitio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Autenticacion Supabase:</strong> Mantienen tu sesion iniciada y gestionan la seguridad de tu cuenta</li>
                  <li><strong>Preferencias de cookies:</strong> Recuerdan tu eleccion sobre cookies analiticas</li>
                  <li><strong>Seguridad:</strong> Protegen contra ataques CSRF y mantienen la integridad de las sesiones</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Estas cookies son necesarias para que la plataforma funcione correctamente y no pueden desactivarse.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cookies Analiticas
                </CardTitle>
                <CardDescription>
                  {consent.analytics ? "Activas" : "Inactivas"} - Requieren tu consentimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Google Analytics 4:</strong> Nos ayuda a entender como usas la plataforma, que paginas visitas y como podemos mejorar la experiencia</li>
                  <li><strong>Google Tag Manager:</strong> Gestiona la carga de scripts de analisis</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  La direccion IP se anonimiza para proteger tu privacidad. No utilizamos estos datos para identificarte personalmente.
                </p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">
                    Estado actual: {consent.analytics ? "Aceptadas" : "Rechazadas"}
                    {consent.timestamp && (
                      <span className="text-muted-foreground ml-2">
                        (desde {new Date(consent.timestamp).toLocaleDateString('es-ES')})
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    {consent.analytics ? (
                      <Button variant="outline" size="sm" onClick={rejectAnalytics}>
                        Rechazar cookies analiticas
                      </Button>
                    ) : (
                      <Button size="sm" onClick={acceptAnalytics}>
                        Aceptar cookies analiticas
                      </Button>
                    )}
                    {consent.hasResponded && (
                      <Button variant="ghost" size="sm" onClick={resetConsent}>
                        Restablecer preferencias
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Cookies de Terceros</h2>
            <p className="text-muted-foreground">
              Solo utilizamos cookies de terceros para analisis (Google Analytics). No utilizamos cookies de marketing, publicidad ni remarketing. No compartimos datos de cookies con redes sociales.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Como Gestionar las Cookies</h2>
            <p className="text-muted-foreground">Puedes gestionar tus preferencias de cookies de varias formas:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>En esta pagina:</strong> Usa los botones de arriba para aceptar o rechazar cookies analiticas</li>
              <li><strong>En tu navegador:</strong> La mayoria de navegadores permiten bloquear o eliminar cookies desde su configuracion</li>
              <li><strong>Herramientas de Google:</strong> Puedes optar por no participar en Google Analytics usando el{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  complemento de inhabilitacion
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Duracion de las Cookies</h2>
            <p className="text-muted-foreground">Las cookies que utilizamos tienen diferentes duraciones:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Cookies de sesion:</strong> Se eliminan al cerrar el navegador</li>
              <li><strong>Cookies de autenticacion:</strong> Hasta 7 dias o hasta que cierres sesion</li>
              <li><strong>Cookies de preferencias:</strong> Hasta 1 ano</li>
              <li><strong>Cookies de Google Analytics:</strong> Hasta 2 anos</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Actualizaciones de esta Politica</h2>
            <p className="text-muted-foreground">
              Podemos actualizar esta politica de cookies cuando sea necesario. Te recomendamos revisarla periodicamente. Los cambios significativos se comunicaran a traves de la plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Mas Informacion</h2>
            <p className="text-muted-foreground">
              Para obtener mas informacion sobre como tratamos tus datos, consulta nuestra{" "}
              <Link to="/legal/privacidad" className="text-primary hover:underline">
                Politica de Privacidad
              </Link>
              .
            </p>
            <p className="text-muted-foreground">
              Si tienes preguntas sobre las cookies, puedes contactarnos en:{" "}
              <a href="mailto:privacidad@leanzupply.com" className="text-primary hover:underline">
                privacidad@leanzupply.com
              </a>
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-border">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la pagina principal
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CookiePolicy;

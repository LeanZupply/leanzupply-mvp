import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Politica de Privacidad</h1>
        </div>

        <p className="text-lg text-muted-foreground mb-2">LeanZupply</p>
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Version:</strong> 1 | <strong>Ultima actualizacion:</strong> 07/01/2026
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">1. Responsable del Tratamiento</h2>
            <p className="text-muted-foreground">
              El responsable del tratamiento de los datos personales es:
            </p>
            <p className="text-muted-foreground">
              <strong>LeanZupply East Limited</strong><br />
              Jurisdiccion: Hong Kong<br />
              Correo de contacto:{" "}
              <a href="mailto:contacto@leanzupply.com" className="text-primary hover:underline">
                contacto@leanzupply.com
              </a>
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">2. Datos Personales que Recopilamos</h2>
            <p className="text-muted-foreground">
              LeanZupply puede recopilar los siguientes datos personales:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Datos identificativos y de contacto (nombre, email, empresa, cargo)</li>
              <li>Datos necesarios para el registro y uso de la plataforma</li>
              <li>Datos derivados del uso del sitio web (IP anonimizada, tipo de navegador, paginas visitadas)</li>
              <li>Informacion comercial basica necesaria para facilitar operaciones entre usuarios</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">3. Como se Obtienen los Datos</h2>
            <p className="text-muted-foreground">
              Los datos se obtienen a traves de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Formularios del sitio web</li>
              <li>Registro y uso de la plataforma</li>
              <li>Comunicaciones con LeanZupply</li>
              <li>Cookies analiticas</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">4. Finalidad del Tratamiento</h2>
            <p className="text-muted-foreground">
              Los datos personales se tratan con las siguientes finalidades:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Gestionar cuentas de usuario</li>
              <li>Facilitar la comunicacion entre compradores y fabricantes</li>
              <li>Gestionar solicitudes y operaciones dentro de la plataforma</li>
              <li>Enviar comunicaciones relacionadas con el servicio</li>
              <li>Mejorar la funcionalidad y experiencia del sitio</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">5. Base Legal del Tratamiento</h2>
            <p className="text-muted-foreground">
              El tratamiento se basa en:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>El consentimiento del usuario</li>
              <li>La ejecucion de los{" "}
                <Link to="/legal/terminos" className="text-primary hover:underline">
                  Terminos y Condiciones
                </Link>
              </li>
              <li>El interes legitimo de mejora del servicio</li>
              <li>El cumplimiento de obligaciones legales</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">6. Destinatarios y Transferencias Internacionales</h2>
            <p className="text-muted-foreground">
              Los datos podran ser compartidos con:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Proveedores tecnologicos necesarios para el funcionamiento de la plataforma</li>
              <li>Otros usuarios, cuando sea necesario para la operativa del servicio</li>
            </ul>
            <p className="text-muted-foreground">
              LeanZupply puede realizar transferencias internacionales de datos, adoptando medidas razonables de seguridad y proteccion.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">7. Conservacion de los Datos</h2>
            <p className="text-muted-foreground">
              Los datos se conservaran mientras la cuenta este activa o durante el tiempo necesario para cumplir obligaciones legales.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">8. Derechos del Usuario</h2>
            <p className="text-muted-foreground">
              El usuario puede ejercer los derechos de acceso, rectificacion, supresion, oposicion, limitacion y portabilidad enviando una solicitud a:
            </p>
            <p className="text-muted-foreground">
              <a href="mailto:contacto@leanzupply.com" className="text-primary hover:underline font-medium">
                contacto@leanzupply.com
              </a>
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">9. Seguridad</h2>
            <p className="text-muted-foreground">
              LeanZupply adopta medidas tecnicas y organizativas razonables para proteger los datos personales, sin poder garantizar una seguridad absoluta.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">10. Modificaciones</h2>
            <p className="text-muted-foreground">
              LeanZupply se reserva el derecho de modificar la presente Politica de Privacidad. Las modificaciones seran publicadas en el sitio web.
            </p>
          </section>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground italic">
              Ultima actualizacion: 07 de enero de 2026
            </p>
          </div>
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

export default PrivacyPolicy;

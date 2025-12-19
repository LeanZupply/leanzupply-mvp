import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowLeft } from "lucide-react";
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
        <h1 className="text-3xl font-bold mb-8">Politica de Privacidad</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            Ultima actualizacion: Diciembre 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Responsable del Tratamiento</h2>
            <p className="text-muted-foreground">
              LeanZupply (en adelante, "nosotros" o "la Plataforma") es responsable del tratamiento de los datos personales que nos proporciones. Nuestra plataforma conecta fabricantes certificados de Latinoamerica con compradores empresariales internacionales.
            </p>
            <p className="text-muted-foreground">
              Para cualquier consulta relacionada con la privacidad, puedes contactarnos en:{" "}
              <a href="mailto:privacidad@leanzupply.com" className="text-primary hover:underline">
                privacidad@leanzupply.com
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Datos que Recopilamos</h2>
            <p className="text-muted-foreground">Recopilamos los siguientes tipos de datos:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Datos de identificacion:</strong> nombre completo, correo electronico, telefono</li>
              <li><strong>Datos empresariales:</strong> nombre de la empresa, NIF/CIF, numero EORI, direccion fiscal</li>
              <li><strong>Datos de entrega:</strong> direccion de entrega, horarios de recepcion</li>
              <li><strong>Datos de uso:</strong> navegacion en la plataforma, productos visualizados, pedidos realizados</li>
              <li><strong>Datos tecnicos:</strong> direccion IP (anonimizada), tipo de navegador, dispositivo</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Finalidad del Tratamiento</h2>
            <p className="text-muted-foreground">Utilizamos tus datos para:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Gestionar tu cuenta y perfil en la plataforma</li>
              <li>Procesar y gestionar tus pedidos</li>
              <li>Facilitar la comunicacion entre compradores y fabricantes</li>
              <li>Verificar la identidad empresarial de los usuarios</li>
              <li>Mejorar nuestros servicios mediante analisis de uso</li>
              <li>Enviarte comunicaciones relacionadas con tus pedidos</li>
              <li>Cumplir con obligaciones legales y fiscales</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Base Legal</h2>
            <p className="text-muted-foreground">El tratamiento de tus datos se basa en:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Ejecucion de contrato:</strong> para prestarte nuestros servicios</li>
              <li><strong>Consentimiento:</strong> para cookies analiticas y comunicaciones opcionales</li>
              <li><strong>Interes legitimo:</strong> para mejorar nuestros servicios y prevenir fraudes</li>
              <li><strong>Obligacion legal:</strong> para cumplir con normativas fiscales y de comercio exterior</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Destinatarios de los Datos</h2>
            <p className="text-muted-foreground">Tus datos pueden ser compartidos con:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Fabricantes/Compradores:</strong> datos necesarios para completar transacciones</li>
              <li><strong>Proveedores de servicios:</strong> hosting (Supabase), pagos, logistica</li>
              <li><strong>Autoridades:</strong> cuando sea requerido por ley</li>
            </ul>
            <p className="text-muted-foreground">
              No vendemos ni alquilamos tus datos personales a terceros para fines de marketing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Transferencias Internacionales</h2>
            <p className="text-muted-foreground">
              Dado que operamos conectando empresas de diferentes paises, algunos datos pueden transferirse internacionalmente. Utilizamos proveedores que cumplen con las garantias adecuadas (como clausulas contractuales tipo de la UE) para proteger tus datos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Tus Derechos</h2>
            <p className="text-muted-foreground">Conforme al RGPD, tienes derecho a:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Acceso:</strong> conocer que datos tenemos sobre ti</li>
              <li><strong>Rectificacion:</strong> corregir datos inexactos</li>
              <li><strong>Supresion:</strong> solicitar la eliminacion de tus datos</li>
              <li><strong>Limitacion:</strong> restringir el tratamiento en ciertos casos</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado</li>
              <li><strong>Oposicion:</strong> oponerte al tratamiento basado en interes legitimo</li>
            </ul>
            <p className="text-muted-foreground">
              Para ejercer estos derechos, contactanos en{" "}
              <a href="mailto:privacidad@leanzupply.com" className="text-primary hover:underline">
                privacidad@leanzupply.com
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Plazo de Conservacion</h2>
            <p className="text-muted-foreground">
              Conservamos tus datos mientras mantengas una cuenta activa en la plataforma. Tras la cancelacion, mantenemos los datos necesarios para cumplir obligaciones legales (tipicamente 5-10 anos para documentacion fiscal y comercial).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Seguridad</h2>
            <p className="text-muted-foreground">
              Implementamos medidas tecnicas y organizativas apropiadas para proteger tus datos, incluyendo cifrado en transito y en reposo, control de accesos, y auditorias periodicas de seguridad.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Cambios en esta Politica</h2>
            <p className="text-muted-foreground">
              Podemos actualizar esta politica periodicamente. Te notificaremos cambios significativos a traves de la plataforma o por correo electronico.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Contacto</h2>
            <p className="text-muted-foreground">
              Si tienes preguntas sobre esta politica o el tratamiento de tus datos, puedes contactarnos en:{" "}
              <a href="mailto:privacidad@leanzupply.com" className="text-primary hover:underline">
                privacidad@leanzupply.com
              </a>
            </p>
            <p className="text-muted-foreground">
              Tambien puedes presentar una reclamacion ante la autoridad de proteccion de datos de tu pais si consideras que no hemos atendido adecuadamente tus derechos.
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

export default PrivacyPolicy;

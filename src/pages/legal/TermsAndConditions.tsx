import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowLeft, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsAndConditions = () => {
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
        <div className="flex items-center gap-3 mb-8">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Terminos y Condiciones Generales</h1>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            Ultima actualizacion: Enero 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Informacion General</h2>
            <p className="text-muted-foreground">
              LeanZupply es una plataforma D2B (Direct-to-Business) que conecta empresas profesionales europeas con fabricantes certificados. Al utilizar nuestra plataforma, aceptas estos Terminos y Condiciones en su totalidad.
            </p>
            <p className="text-muted-foreground">
              Estos terminos regulan el uso de la plataforma web www.leanzupply.com y todos los servicios asociados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Definiciones</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Plataforma:</strong> El sitio web y servicios de LeanZupply</li>
              <li><strong>Usuario:</strong> Cualquier persona o empresa que utilice la plataforma</li>
              <li><strong>Comprador:</strong> Usuario registrado que adquiere productos a traves de la plataforma</li>
              <li><strong>Fabricante:</strong> Usuario registrado que ofrece productos en la plataforma</li>
              <li><strong>Pedido:</strong> Solicitud de compra realizada a traves de la plataforma</li>
              <li><strong>FOB:</strong> Free On Board, incoterm que define el punto de entrega y transferencia de riesgo</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Registro y Cuenta de Usuario</h2>
            <p className="text-muted-foreground">
              Para utilizar los servicios de LeanZupply, es necesario crear una cuenta. El usuario se compromete a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Proporcionar informacion veraz, completa y actualizada</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
              <li>Ser responsable de todas las actividades realizadas desde su cuenta</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Uso de la Plataforma</h2>
            <p className="text-muted-foreground">
              Los usuarios se comprometen a utilizar la plataforma de manera responsable y a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>No utilizar la plataforma para fines ilegales o no autorizados</li>
              <li>No intentar acceder a areas restringidas del sistema</li>
              <li>No interferir con el funcionamiento normal de la plataforma</li>
              <li>Cumplir con todas las leyes y regulaciones aplicables</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Productos y Precios</h2>
            <p className="text-muted-foreground">
              Los precios mostrados en la plataforma son precios FOB (Free On Board) expresados en Euros (EUR). El precio FOB incluye el coste del producto hasta su carga en el puerto de origen.
            </p>
            <p className="text-muted-foreground">
              Los costes adicionales como transporte maritimo, seguros, aranceles e IVA se calculan y muestran de forma separada antes de confirmar cualquier pedido.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Pedidos y Pagos</h2>
            <p className="text-muted-foreground">
              Al realizar un pedido a traves de LeanZupply, el comprador acepta las condiciones especificas del pedido, incluyendo cantidades, precios y plazos de entrega.
            </p>
            <p className="text-muted-foreground">
              LeanZupply actua como intermediario facilitando la transaccion entre compradores y fabricantes. Los pagos se gestionan de forma segura a traves de la plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Garantias</h2>
            <p className="text-muted-foreground">
              Las garantias de los productos son proporcionadas directamente por los fabricantes. LeanZupply facilita la comunicacion entre las partes y acompana el proceso de reclamacion cuando sea necesario.
            </p>
            <p className="text-muted-foreground">
              Cada producto puede tener condiciones de garantia especificas que se detallan en su ficha de producto.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Responsabilidad</h2>
            <p className="text-muted-foreground">
              LeanZupply no se hace responsable de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Defectos en los productos suministrados por los fabricantes</li>
              <li>Retrasos causados por terceros (transportistas, aduanas, etc.)</li>
              <li>Danos derivados del uso inadecuado de los productos</li>
              <li>Perdidas indirectas o consecuentes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Propiedad Intelectual</h2>
            <p className="text-muted-foreground">
              Todos los contenidos de la plataforma, incluyendo textos, graficos, logos, iconos, imagenes y software, son propiedad de LeanZupply o de sus licenciantes y estan protegidos por las leyes de propiedad intelectual.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Proteccion de Datos</h2>
            <p className="text-muted-foreground">
              El tratamiento de datos personales se rige por nuestra{" "}
              <Link to="/legal/privacidad" className="text-primary hover:underline">
                Politica de Privacidad
              </Link>
              , que forma parte integrante de estos Terminos y Condiciones.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Modificaciones</h2>
            <p className="text-muted-foreground">
              LeanZupply se reserva el derecho de modificar estos Terminos y Condiciones en cualquier momento. Los cambios entraran en vigor desde su publicacion en la plataforma. Se recomienda revisar periodicamente estos terminos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Ley Aplicable y Jurisdiccion</h2>
            <p className="text-muted-foreground">
              Estos Terminos y Condiciones se rigen por la legislacion espanola. Para cualquier controversia que pudiera surgir, las partes se someten a los Juzgados y Tribunales de la ciudad de Madrid, con renuncia expresa a cualquier otro fuero.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">13. Contacto</h2>
            <p className="text-muted-foreground">
              Para cualquier consulta relacionada con estos Terminos y Condiciones, puedes contactarnos en:{" "}
              <a href="mailto:legal@leanzupply.com" className="text-primary hover:underline">
                legal@leanzupply.com
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

export default TermsAndConditions;

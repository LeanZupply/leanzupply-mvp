import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowLeft, Scale } from "lucide-react";
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
        <div className="flex items-center gap-3 mb-4">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Terminos y Condiciones Generales de Uso</h1>
        </div>

        <p className="text-lg text-muted-foreground mb-2">Plataforma LeanZupply</p>
        <p className="text-sm text-muted-foreground mb-8">
          <strong>Version:</strong> 1.0 | <strong>Fecha de entrada en vigor:</strong> 07/01/2026
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">1. Disposiciones Generales</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">1.1. Objeto y Ambito de Aplicacion</h3>
              <p className="text-muted-foreground">
                Los presentes Terminos y Condiciones Generales (en adelante, "TyC") regulan el acceso y uso de la plataforma digital LeanZupply (en adelante, la "Plataforma"), operada por LeanZupply Limited con jurisdiccion en Hong Kong, (en adelante, "LeanZupply" o el "Operador").
              </p>
              <p className="text-muted-foreground">
                La Plataforma actua como intermediaria digital facilitando la conexion entre:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Usuarios Compradores:</strong> Empresas profesionales activas y registradas como personas fisicas o juridicas que buscan adquirir productos a traves de la Plataforma.</li>
                <li><strong>Usuarios Fabricantes/Proveedores:</strong> Personas fisicas o juridicas que fabrican productos para su comercializacion a traves de la Plataforma.</li>
              </ul>
              <p className="text-muted-foreground font-medium">
                LeanZupply NO es parte en las transacciones comerciales entre Compradores y Fabricantes, actuando unicamente como plataforma de intermediacion tecnologica.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">1.2. Aceptacion de los Terminos</h3>
              <p className="text-muted-foreground">
                El acceso y uso de la Plataforma implica la aceptacion plena y sin reservas de estos TyC. Si el Usuario no acepta estos terminos, debe abstenerse de utilizar la Plataforma.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">1.3. Modificaciones</h3>
              <p className="text-muted-foreground">
                LeanZupply se reserva el derecho de modificar estos TyC en cualquier momento. Las modificaciones entraran en vigor desde su publicacion en la Plataforma. El uso continuado de los servicios tras la publicacion de cambios constituye la aceptacion de los mismos.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">2. Registro y Cuenta de Usuario</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">2.1. Requisitos de Registro</h3>
              <p className="text-muted-foreground">
                Para acceder a las funcionalidades completas de la Plataforma, los Usuarios deben completar el proceso de registro proporcionando informacion veraz, precisa, completa y actualizada.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">2.2. Obligaciones del Usuario</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                <li>Ser responsable de todas las actividades realizadas bajo su cuenta</li>
                <li>Cumplir con toda la legislacion aplicable en su jurisdiccion</li>
                <li>No utilizar la Plataforma para fines ilicitos o no autorizados</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">2.3. Verificacion de Identidad</h3>
              <p className="text-muted-foreground">
                LeanZupply se reserva el derecho de solicitar documentacion adicional para verificar la identidad y capacidad legal de los Usuarios, especialmente en el caso de Fabricantes/Proveedores.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">3. Uso de la Plataforma</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">3.1. Servicios Ofrecidos</h3>
              <p className="text-muted-foreground">
                La Plataforma proporciona herramientas tecnologicas para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Busqueda y comparacion de productos</li>
                <li>Comunicacion entre Compradores y Fabricantes</li>
                <li>Gestion de solicitudes de cotizacion (RFQ - Request for Quotation)</li>
                <li>Seguimiento de pedidos y logistica</li>
                <li>Sistema de valoraciones y resenas</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">3.2. Prohibiciones Expresas</h3>
              <p className="text-muted-foreground">
                Queda estrictamente prohibido:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Utilizar la Plataforma para actividades fraudulentas o ilegales</li>
                <li>Publicar contenido falso, enganoso o que infrinja derechos de terceros</li>
                <li>Intentar acceder a areas restringidas del sistema</li>
                <li>Utilizar robots, scrapers o herramientas automatizadas sin autorizacion</li>
                <li>Circunvalar la Plataforma para realizar transacciones directas eludiendo comisiones</li>
                <li>Compartir informacion de contacto en etapas tempranas con intencion elusiva</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">4. Relacion Comercial entre Compradores y Fabricantes</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">4.1. Naturaleza de la Relacion</h3>
              <p className="text-muted-foreground">
                Las transacciones comerciales se establecen directamente entre el Comprador y el Fabricante. LeanZupply actua exclusivamente como plataforma facilitadora y NO es parte en dichas transacciones.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">4.2. Responsabilidades del Comprador</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Estar registrada como empresa activa con numero de identificacion fiscal vigente</li>
                <li>Tener capacidad legal y regularizacion fiscal tributaria para realizar importaciones</li>
                <li>Realizar el pago de cada operacion acorde a lo convenido en la Plataforma</li>
                <li>Cumplir con todas las obligaciones aduaneras y regulatorias de importacion</li>
                <li>Verificar la conformidad de los productos recibidos</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">4.3. Responsabilidades del Fabricante</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Proporcionar informacion veraz y completa sobre sus productos</li>
                <li>Cumplir con las especificaciones acordadas en la publicacion de sus productos</li>
                <li>Garantizar la calidad y conformidad de los productos ofertados</li>
                <li>Cumplir con los plazos de entrega acordados</li>
                <li>Proporcionar documentacion necesaria para exportacion</li>
                <li>Cumplir con todas las normativas aplicables en su jurisdiccion</li>
                <li>Mantener actualizada la informacion de productos y disponibilidad</li>
                <li>Cumplir con las normas de integridad humana dentro sus establecimientos de manufactura</li>
                <li>Cumplir con los Terminos y Condiciones de Garantia previstos en la publicacion de los productos en la jurisdiccion del domicilio de entrega de los Usuarios Compradores</li>
                <li>Todos los costes que se incurran por desperfectos de fabrica dentro del plazo explicitado de garantia, seran a cuenta del fabricante</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">4.4. Incoterms y Condiciones de Entrega</h3>
              <p className="text-muted-foreground">
                Las partes son libres de acordar los terminos de entrega segun los INCOTERMS® vigentes de la Camara de Comercio Internacional (ICC). LeanZupply recomienda la formalizacion por escrito de todos los terminos acordados.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">5. Precios, Pagos y Comisiones</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">5.1. Determinacion de Precios</h3>
              <p className="text-muted-foreground">
                Los precios son establecidos libremente por los Fabricantes y aceptado por los Compradores. LeanZupply no interviene en la negociacion de precios.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">5.2. Metodos de Pago</h3>
              <p className="text-muted-foreground">
                Los pagos se realizan segun lo acordado entre las partes. LeanZupply puede ofrecer servicios opcionales de gestion de pagos (escrow) sujetos a terminos adicionales especificos con aclaracion del comprador para realizar pagos a su nombre.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">5.3. Comisiones de la Plataforma</h3>
              <p className="text-muted-foreground">
                LeanZupply cobra comisiones por los servicios de facilitacion segun las tarifas publicadas en la Plataforma. Las comisiones de cada parte seran claramente comunicadas antes de la confirmacion de cualquier transaccion por separado a cada una de ellas.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">5.4. Impuestos</h3>
              <p className="text-muted-foreground">
                Cada parte es responsable del cumplimiento de sus obligaciones fiscales en su respectiva jurisdiccion, incluyendo pero no limitado a IVA, aranceles aduaneros y otros impuestos aplicables.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">6. Propiedad Intelectual</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">6.1. Derechos de LeanZupply</h3>
              <p className="text-muted-foreground">
                Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo diseno, software, contenido, marcas y logotipos, son propiedad exclusiva de LeanZupply o sus licenciantes.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">6.2. Contenido del Usuario</h3>
              <p className="text-muted-foreground">
                Los Usuarios conservan todos los derechos sobre el contenido que publican, pero otorgan a LeanZupply una licencia mundial, no exclusiva, libre de regalias para usar, reproducir y mostrar dicho contenido en la Plataforma.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">6.3. Uso Autorizado</h3>
              <p className="text-muted-foreground">
                El Usuario recibe una licencia limitada, revocable y no transferible para acceder y utilizar la Plataforma exclusivamente para los fines previstos.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">7. Proteccion de Datos y Privacidad</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">7.1. Cumplimiento del RGPD</h3>
              <p className="text-muted-foreground">
                El tratamiento de datos personales se realiza conforme al Reglamento (UE) 2016/679 (RGPD) y la legislacion espanola aplicable. Para mas informacion, consulte nuestra{" "}
                <Link to="/legal/privacidad" className="text-primary hover:underline">
                  Politica de Privacidad
                </Link>.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">7.2. Finalidad del Tratamiento</h3>
              <p className="text-muted-foreground">
                Los datos personales se recopilan para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Gestion de cuentas de usuario</li>
                <li>Facilitacion de transacciones comerciales</li>
                <li>Comunicaciones relacionadas con el servicio</li>
                <li>Mejora de la Plataforma y experiencia del usuario</li>
                <li>Cumplimiento de obligaciones legales</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">7.3. Derechos del Usuario</h3>
              <p className="text-muted-foreground">
                Los Usuarios tienen derecho a acceder, rectificar, suprimir, limitar el tratamiento, portabilidad y oposicion respecto a sus datos personales, contactando a{" "}
                <a href="mailto:contacto@leanzupply.com" className="text-primary hover:underline">
                  contacto@leanzupply.com
                </a>.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">8. Limitacion de Responsabilidad</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">8.1. Responsabilidad de LeanZupply</h3>
              <p className="text-muted-foreground">
                LeanZupply, en su calidad de plataforma facilitadora, NO es responsable de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>La calidad, seguridad, legalidad o conformidad de los productos ofertados por los Usuarios Fabricantes</li>
                <li>La veracidad de la informacion proporcionada por los Usuarios</li>
                <li>El cumplimiento de las obligaciones contractuales entre Compradores y Fabricantes</li>
                <li>Disputas comerciales, incumplimientos o danos derivados de las transacciones</li>
                <li>Perdidas, retrasos o danos en el transporte de mercancias</li>
                <li>Incumplimientos de normativas aduaneras o regulatorias por parte de los Usuarios</li>
                <li>Perdidas economicas derivadas de decisiones comerciales de los Usuarios</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">8.2. Exclusion de Garantias</h3>
              <p className="text-muted-foreground">
                La Plataforma se proporciona "tal cual" (as is) y "segun disponibilidad" (as available). LeanZupply no garantiza que el servicio sea ininterrumpido, seguro o libre de errores.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">8.3. Limitacion Cuantitativa</h3>
              <p className="text-muted-foreground">
                En ningun caso la responsabilidad total de LeanZupply excedera el importe de las comisiones pagadas por el Usuario en los 12 meses anteriores al evento que origina la reclamacion.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">8.4. Danos Excluidos</h3>
              <p className="text-muted-foreground">
                LeanZupply no sera responsable de danos indirectos, consecuenciales, punitivos o lucro cesante, incluso si ha sido advertida de su posibilidad.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">9. Fuerza Mayor</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">9.1. Definicion</h3>
              <p className="text-muted-foreground">
                Se entiende por fuerza mayor cualquier evento imprevisto, inevitable y fuera del control razonable de las partes, incluyendo pero no limitado a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Desastres naturales (terremotos, inundaciones, pandemias)</li>
                <li>Conflictos armados, terrorismo, disturbios civiles</li>
                <li>Huelgas generales, bloqueos portuarios</li>
                <li>Fallos graves de infraestructura de telecomunicaciones</li>
                <li>Cambios regulatorios o restricciones gubernamentales</li>
                <li>Ciberataques de gran escala</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">9.2. Efectos</h3>
              <p className="text-muted-foreground">
                En caso de fuerza mayor, las obligaciones afectadas quedaran suspendidas durante el periodo de duracion del evento. LeanZupply comunicara la situacion a los Usuarios afectados en la mayor brevedad posible.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">10. Resolucion de Disputas</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">10.1. Negociacion Directa</h3>
              <p className="text-muted-foreground">
                Los Usuarios se comprometen a intentar resolver cualquier disputa mediante negociacion directa de buena fe antes de iniciar procedimientos formales.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">10.2. Mediacion</h3>
              <p className="text-muted-foreground">
                Si la negociacion directa no prospera, las partes acuerdan someter la controversia a mediacion segun las reglas de la institucion de mediacion comun para casos de comercio internacional en Europa.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">10.3. Jurisdiccion y Ley Aplicable</h3>
              <p className="text-muted-foreground font-medium">
                Para Usuarios residentes en Espana o la Union Europea:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Ley aplicable: Legislacion Hong Kong</li>
                <li>Jurisdiccion: Tribunales de Hong Kong, con renuncia expresa a cualquier otro fuero que pudiera corresponder</li>
              </ul>
              <p className="text-muted-foreground font-medium mt-4">
                Para transacciones internacionales (fuera de la UE):
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Ley aplicable: Convencion de las Naciones Unidas sobre los Contratos de Compraventa Internacional de Mercaderias (Convencion de Viena, 1980)</li>
                <li>Arbitraje: Las controversias se someteran a arbitraje internacional bajo las reglas de la Camara de Comercio Internacional (ICC), con sede en Hong Kong</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">10.4. Idioma</h3>
              <p className="text-muted-foreground">
                Para disputas internacionales, el idioma del arbitraje sera el ingles, salvo acuerdo expreso en contrario.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">11. Suspension y Terminacion</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">11.1. Suspension de Cuenta</h3>
              <p className="text-muted-foreground">
                LeanZupply se reserva el derecho de suspender o cancelar cuentas de Usuario en caso de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Incumplimiento de estos TyC</li>
                <li>Actividades fraudulentas o ilegales</li>
                <li>Impago de comisiones adeudadas</li>
                <li>Reiteradas quejas fundadas de otros Usuarios</li>
                <li>Inactividad prolongada (superior a 12 meses)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">11.2. Terminacion por el Usuario</h3>
              <p className="text-muted-foreground">
                El Usuario puede cancelar su cuenta en cualquier momento siguiendo el procedimiento establecido en la Plataforma. Las obligaciones pendientes subsistiran tras la terminacion.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">11.3. Efectos de la Terminacion</h3>
              <p className="text-muted-foreground">
                Tras la terminacion, el Usuario perdera acceso a su cuenta y contenido asociado. LeanZupply conservara datos segun requerimientos legales.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">12. Comunicaciones</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">12.1. Notificaciones de la Plataforma</h3>
              <p className="text-muted-foreground">
                LeanZupply puede comunicarse con los Usuarios a traves de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Correo electronico registrado</li>
                <li>Notificaciones en la Plataforma</li>
                <li>Mensajes SMS (para asuntos urgentes)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">12.2. Notificaciones al Operador</h3>
              <p className="text-muted-foreground">
                Las comunicaciones dirigidas a LeanZupply deben enviarse a:{" "}
                <a href="mailto:contacto@leanzupply.com" className="text-primary hover:underline">
                  contacto@leanzupply.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">13. Disposiciones Finales</h2>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">13.1. Integridad del Acuerdo</h3>
              <p className="text-muted-foreground">
                Estos TyC, junto con la Politica de Privacidad y demas documentos referenciados, constituyen el acuerdo completo entre el Usuario y LeanZupply.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">13.2. Divisibilidad</h3>
              <p className="text-muted-foreground">
                Si alguna disposicion de estos TyC fuera declarada invalida o inaplicable, las demas disposiciones permaneceran en pleno vigor y efecto.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">13.3. Cesion</h3>
              <p className="text-muted-foreground">
                El Usuario no podra ceder sus derechos u obligaciones sin el consentimiento previo y por escrito de LeanZupply. LeanZupply podra ceder estos TyC en caso de fusion, adquisicion o venta de activos.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">13.4. Renuncia</h3>
              <p className="text-muted-foreground">
                La falta de ejercicio de cualquier derecho no constituira renuncia al mismo, salvo manifestacion expresa y por escrito.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">13.5. Relacion entre las Partes</h3>
              <p className="text-muted-foreground">
                Nada en estos TyC constituye una relacion de agencia, asociacion, joint venture o relacion laboral entre el Usuario y LeanZupply.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">13.6. Idiomas</h3>
              <p className="text-muted-foreground">
                En caso de conflicto entre versiones en distintos idiomas de estos TyC, prevalecera la version en espanol.
              </p>
            </div>
          </section>

          {/* Section 14 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">14. Contacto</h2>
            <p className="text-muted-foreground">
              Para cualquier consulta relacionada con estos Terminos y Condiciones, por favor contacte:
            </p>
            <p className="text-muted-foreground">
              <strong>LeanZupply</strong><br />
              Correo electronico:{" "}
              <a href="mailto:contacto@leanzupply.com" className="text-primary hover:underline">
                contacto@leanzupply.com
              </a>
            </p>
          </section>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground italic">
              Ultima actualizacion: 07 de enero de 2026
            </p>
            <p className="text-sm text-muted-foreground mt-4 font-medium">
              Al utilizar la Plataforma LeanZupply, usted reconoce haber leido, comprendido y aceptado estos Terminos y Condiciones Generales en su totalidad.
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

export default TermsAndConditions;

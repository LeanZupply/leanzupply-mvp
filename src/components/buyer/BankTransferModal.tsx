import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Copy,
  CheckCircle,
  Download,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/formatters";

// Hardcoded bank details for Next Trade Global Limited
const BANK_DETAILS = {
  accountHolder: "Next Trade Global Limited",
  taxId: "77231298",
  bankName: "DBS Bank (Hong Kong) Limited",
  accountNumber: "478798114212",
  swift: "DHBKHKHH",
  currency: "EUR / USD",
};

interface BankTransferModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderReference: string;
  totalAmount: number;
  clientName?: string;
}

export function BankTransferModal({
  open,
  onClose,
  onConfirm,
  orderReference,
  totalAmount,
  clientName = "",
}: BankTransferModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Error al copiar");
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Por favor permite las ventanas emergentes para descargar el PDF");
      return;
    }

    const formattedAmount = formatNumber(totalAmount);

    const currentDate = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Instrucciones de Pago - ${orderReference}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            :root {
              --primary: #437056;
              --primary-dark: #366349;
              --primary-light: #50956d;
              --primary-soft: #e8f3ee;
              --primary-border: #cfe4d7;
            }
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              padding: 40px 50px;
              max-width: 800px;
              margin: 0 auto;
              color: #1a1a1a;
              line-height: 1.6;
              font-size: 14px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid var(--primary);
            }
            .logo-image {
              height: 44px;
              width: auto;
              object-fit: contain;
            }
            .subtitle {
              color: #64748b;
              font-size: 15px;
              margin-top: 8px;
              font-style: italic;
            }
            h1 {
              font-size: 22px;
              margin: 25px 0 20px;
              color: #1e293b;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-number {
              background: var(--primary);
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 600;
            }
            .info-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              color: #64748b;
              font-weight: 500;
              flex: 0 0 40%;
            }
            .info-value {
              font-weight: 600;
              color: #1e293b;
              text-align: right;
              flex: 0 0 55%;
            }
            .highlight {
              color: var(--primary);
            }
            .amount-box {
              background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 15px 0;
            }
            .amount-label {
              font-size: 14px;
              opacity: 0.9;
            }
            .amount-value {
              font-size: 28px;
              font-weight: 700;
              margin-top: 5px;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-left: 4px solid #f59e0b;
              border-radius: 6px;
              padding: 15px 20px;
              margin: 20px 0;
            }
            .warning-title {
              font-weight: 600;
              color: #92400e;
              margin-bottom: 5px;
            }
            .warning-text {
              color: #78350f;
              font-size: 13px;
            }
            .next-steps {
              background: #f0fdf4;
              border: 1px solid #22c55e;
              border-radius: 8px;
              padding: 20px;
            }
            .step {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              margin-bottom: 12px;
            }
            .step:last-child {
              margin-bottom: 0;
            }
            .step-number {
              background: #22c55e;
              color: white;
              min-width: 22px;
              height: 22px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
            }
            .step-text {
              color: #166534;
              font-size: 13px;
            }
            .legal {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 11px;
              color: #64748b;
              line-height: 1.7;
            }
            .legal p {
              margin-bottom: 10px;
            }
            .legal a {
              color: var(--primary);
              text-decoration: none;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              color: #64748b;
              font-size: 12px;
            }
            .footer-logo {
              font-weight: 600;
              color: var(--primary);
            }
            .close-button {
              display: inline-block;
              margin-top: 10px;
              padding: 8px 14px;
              border-radius: 6px;
              border: 1px solid var(--primary-border);
              background: var(--primary-soft);
              color: var(--primary-dark);
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
            }
            @media print {
              body { padding: 20px 30px; }
              .info-card, .next-steps, .warning { break-inside: avoid; }
              .close-button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo-image" src="${window.location.origin}/logo.png" alt="LeanZupply" />
            <div class="subtitle">Operacion gestionada a traves de LeanZupply</div>
          </div>

          <h1>INSTRUCCIONES DE PAGO</h1>

          <div class="section">
            <div class="section-title">
              <span class="section-number">1</span>
              Datos clave de la operacion
            </div>
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Operation ID*</span>
                <span class="info-value highlight">${orderReference}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cliente</span>
                <span class="info-value">${clientName || "—"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Concepto del pago</span>
                <span class="info-value">Gestion de compra internacional de equipamiento industrial</span>
              </div>
            </div>
            <div class="amount-box">
              <div class="amount-label">Importe a transferir</div>
              <div class="amount-value">EUR ${formattedAmount}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-number">2</span>
              Datos Bancarios para efectuar el Pago
            </div>
            <p style="margin-bottom: 15px; color: #64748b; font-size: 13px;">TRANSFERENCIA INTERNACIONAL (SWIFT)</p>
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Titular de la cuenta</span>
                <span class="info-value">${BANK_DETAILS.accountHolder}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Numero de ID Fiscal</span>
                <span class="info-value">${BANK_DETAILS.taxId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Banco</span>
                <span class="info-value">${BANK_DETAILS.bankName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">N de cuenta</span>
                <span class="info-value highlight">${BANK_DETAILS.accountNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">SWIFT</span>
                <span class="info-value highlight">${BANK_DETAILS.swift}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Moneda</span>
                <span class="info-value">${BANK_DETAILS.currency}</span>
              </div>
            </div>
            <div class="warning">
              <div class="warning-title">Aclaracion importante</div>
              <div class="warning-text">
                Debe informar el ID de la Operacion* <strong>${orderReference}</strong> en el concepto o detalle de la operacion bancaria.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-number">3</span>
              Proximo paso (accion requerida)
            </div>
            <div class="next-steps">
              <div class="step">
                <span class="step-number">1</span>
                <span class="step-text">Realizar la transferencia por una de las opciones indicadas.</span>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <span class="step-text">Subir el comprobante de pago desde su panel de usuario en LeanZupply.</span>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <span class="step-text">Seguir el estado y avances de la operacion desde la plataforma.</span>
              </div>
            </div>
          </div>

          <div class="legal">
            <p><strong>*Informacion adicional contractual:</strong></p>
            <p>El pago se realiza a Next Trade Global Limited, entidad designada para recibir y administrar los fondos de la operacion, y efectuar los pagos correspondientes al fabricante, logistica y demas proveedores intervinientes por cuenta y orden del cliente, conforme a la presente operacion. LeanZupply coordina la presente operacion por cuenta y orden del cliente, actuando como plataforma de facilitacion, gestion y coordinacion y no como vendedor de la mercaderia.</p>
            <p><em>Esta modalidad es habitual y ampliamente utilizada en operaciones de importacion internacional.</em></p>
            <p>El cliente recibira todas las facturas finales emitidas a nombre de la empresa importadora, incluyendo DUA e IVA de importacion, los cuales seran plenamente deducibles conforme a la normativa vigente.</p>
            <p>Al realizar el pago el cliente usuario comprador acepta los Terminos y Condiciones de la plataforma <a href="https://www.leanzupply.com/legal/terminos">www.leanzupply.com/legal/terminos</a></p>
          </div>

          <div class="footer">
            <p>Documento generado el ${currentDate}</p>
            <p style="margin-top: 6px;">Al terminar de descargar, cierre esta ventana.</p>
            <button class="close-button" onclick="window.close()">Cerrar ventana</button>
            <p class="footer-logo">LeanZupply</p>
            <p>www.leanzupply.com</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Instrucciones de Pago
          </DialogTitle>
          <DialogDescription>
            Operacion gestionada a traves de LeanZupply
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Section 1: Key Operation Data */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
              Datos clave de la operacion
            </h3>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Operation ID*</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-primary">{orderReference}</span>
                    <CopyButton text={orderReference} field="reference" />
                  </div>
                </div>
                {clientName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cliente</span>
                    <span className="font-medium text-right">{clientName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Concepto del pago</span>
                  <span className="text-sm text-right max-w-[250px]">
                    Gestion de compra internacional de equipamiento industrial
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Amount Box */}
            <div className="bg-primary rounded-lg p-4 text-center mt-3">
              <p className="text-sm text-primary-foreground/80">Importe a transferir</p>
              <p className="text-2xl font-bold text-primary-foreground">
                EUR {formatNumber(totalAmount)}
              </p>
            </div>
          </div>

          {/* Section 2: Bank Details */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
              Datos Bancarios para efectuar el Pago
            </h3>
            <p className="text-xs text-muted-foreground mb-2">TRANSFERENCIA INTERNACIONAL (SWIFT)</p>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Titular de la cuenta</span>
                  <span className="font-medium">{BANK_DETAILS.accountHolder}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Numero de ID Fiscal</span>
                  <span className="font-mono text-sm">{BANK_DETAILS.taxId}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Banco</span>
                  <span className="font-medium text-right">{BANK_DETAILS.bankName}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">N de cuenta</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-semibold text-primary">{BANK_DETAILS.accountNumber}</span>
                    <CopyButton text={BANK_DETAILS.accountNumber} field="account" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">SWIFT</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-semibold text-primary">{BANK_DETAILS.swift}</span>
                    <CopyButton text={BANK_DETAILS.swift} field="swift" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Moneda</span>
                  <span className="font-medium">{BANK_DETAILS.currency}</span>
                </div>
              </CardContent>
            </Card>

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-3">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Aclaracion importante
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Debe informar el ID de la Operacion <strong className="text-amber-900 dark:text-amber-100">{orderReference}</strong> en el concepto o detalle de la operacion bancaria.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Next Steps */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
              Proximo paso (accion requerida)
            </h3>
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span className="text-sm text-green-800 dark:text-green-200">Realizar la transferencia por una de las opciones indicadas.</span>
                </div>
                <div className="flex gap-3">
                  <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span className="text-sm text-green-800 dark:text-green-200">Subir el comprobante de pago desde su panel de usuario en LeanZupply.</span>
                </div>
                <div className="flex gap-3">
                  <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span className="text-sm text-green-800 dark:text-green-200">Seguir el estado y avances de la operacion desde la plataforma.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legal Disclaimer */}
          <div className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
            <p><strong>*Informacion adicional contractual:</strong></p>
            <p>El pago se realiza a Next Trade Global Limited, entidad designada para recibir y administrar los fondos de la operacion, y efectuar los pagos correspondientes al fabricante, logistica y demas proveedores intervinientes por cuenta y orden del cliente, conforme a la presente operacion. LeanZupply coordina la presente operacion por cuenta y orden del cliente, actuando como plataforma de facilitacion, gestion y coordinacion y no como vendedor de la mercaderia.</p>
            <p className="italic">Esta modalidad es habitual y ampliamente utilizada en operaciones de importacion internacional.</p>
            <p>El cliente recibira todas las facturas finales emitidas a nombre de la empresa importadora, incluyendo DUA e IVA de importacion, los cuales seran plenamente deducibles conforme a la normativa vigente.</p>
            <p>Al realizar el pago el cliente usuario comprador acepta los <a href="/legal/terminos" className="text-primary hover:underline">Terminos y Condiciones</a> de la plataforma.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar que realizare la transferencia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

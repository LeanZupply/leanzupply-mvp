import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { getSignedUrl, downloadFile } from "@/lib/storage";
import { toast } from "sonner";

interface PdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileName?: string;
}

export function PdfViewer({ open, onOpenChange, filePath, fileName }: PdfViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open && filePath) {
      loadSignedUrl();
    } else {
      // Cleanup when modal closes
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setObjectUrl(null);
      setSignedUrl(null);
      setError(false);
    }
  }, [open, filePath]);

  const loadSignedUrl = async () => {
    setLoading(true);
    setError(false);
    try {
      const url = await getSignedUrl(filePath);
      if (!url) {
        throw new Error("No se pudo generar URL firmada");
      }
      // Revoke previous object URL if any
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
      // Fetch as blob to avoid Chrome/extension blocking and embed as same-origin blob URL
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('No se pudo obtener el archivo');
      const blob = await resp.blob();
      const obj = URL.createObjectURL(blob);
      setSignedUrl(url);
      setObjectUrl(obj);
    } catch (err) {
      console.error("[PdfViewer] Error loading signed URL", err);
      setError(true);
      toast.error("No se pudo cargar el documento");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const success = await downloadFile(filePath, fileName);
    if (!success) {
      toast.error("No se pudo descargar el documento");
    } else {
      toast.success("Documento descargado");
    }
  };

  const handleOpenExternal = () => {
    const targetUrl = signedUrl || objectUrl;
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">
              {fileName || "Documento"}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading || error}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                disabled={loading || error || (!signedUrl && !objectUrl)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir en nueva pestaña
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 px-6 pb-6 overflow-hidden">
          {loading && (
            <div className="h-full flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando documento...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="h-full flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <p className="text-sm text-destructive">No se pudo cargar el documento</p>
                <Button variant="outline" size="sm" onClick={loadSignedUrl}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {objectUrl && !loading && !error && (
            <iframe
              src={objectUrl}
              className="w-full h-full rounded-lg border border-border bg-background"
              title={fileName || "Document viewer"}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Trash2 } from "lucide-react";
import { useOrderDocuments, type OrderDocument } from "@/hooks/useOrderDocuments";
import { downloadOrderDocument } from "@/lib/storage";
import { DOCUMENT_TYPE_LABELS, type OrderDocumentType } from "@/lib/orderConstants";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface OrderDocumentSectionProps {
  orderId: string;
  documentType: OrderDocumentType;
  canUpload: boolean;
  canDelete: boolean;
  maxFiles?: number;
}

export const OrderDocumentSection = ({
  orderId,
  documentType,
  canUpload,
  canDelete,
  maxFiles = 5,
}: OrderDocumentSectionProps) => {
  const { getByType, upload, remove, loading } = useOrderDocuments(orderId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docs = getByType(documentType);
  const label = DOCUMENT_TYPE_LABELS[documentType];
  const canUploadMore = canUpload && docs.length < maxFiles;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload(file, documentType);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = (doc: OrderDocument) => {
    downloadOrderDocument(doc.file_url, doc.file_name);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {label}
          </CardTitle>
          {canUploadMore && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="h-3 w-3 mr-1" />
                Subir
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No hay documentos de este tipo
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 border border-border"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{doc.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => remove(doc)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

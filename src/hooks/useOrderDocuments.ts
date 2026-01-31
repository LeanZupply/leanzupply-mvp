import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadOrderDocument, deleteOrderDocument } from "@/lib/storage";
import { logOrderActivity } from "@/lib/orderActivityLogger";
import type { OrderDocumentType } from "@/lib/orderConstants";
import { DOCUMENT_TYPE_LABELS } from "@/lib/orderConstants";
import { toast } from "sonner";

export interface OrderDocument {
  id: string;
  order_id: string;
  type: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
}

export function useOrderDocuments(orderId: string | null) {
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_documents")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("[useOrderDocuments] fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const upload = async (file: File, type: OrderDocumentType): Promise<boolean> => {
    if (!orderId) return false;
    try {
      const { filePath } = await uploadOrderDocument(orderId, file, type);

      const { error } = await supabase.from("order_documents").insert({
        order_id: orderId,
        type,
        file_url: filePath,
        file_name: file.name,
        uploaded_by: (await supabase.auth.getUser()).data.user!.id,
      });

      if (error) throw error;

      await logOrderActivity({
        orderId,
        action: "document_uploaded",
        message: `Documento subido: ${DOCUMENT_TYPE_LABELS[type]} - ${file.name}`,
        metadata: { document_type: type, file_name: file.name },
      });

      toast.success("Documento subido correctamente");
      await fetchDocuments();
      return true;
    } catch (error) {
      console.error("[useOrderDocuments] upload error:", error);
      toast.error("Error al subir el documento");
      return false;
    }
  };

  const remove = async (doc: OrderDocument): Promise<boolean> => {
    try {
      await deleteOrderDocument(doc.file_url);

      const { error } = await supabase
        .from("order_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      await logOrderActivity({
        orderId: doc.order_id,
        action: "document_deleted",
        message: `Documento eliminado: ${doc.file_name}`,
        metadata: { document_type: doc.type, file_name: doc.file_name },
      });

      toast.success("Documento eliminado");
      await fetchDocuments();
      return true;
    } catch (error) {
      console.error("[useOrderDocuments] delete error:", error);
      toast.error("Error al eliminar el documento");
      return false;
    }
  };

  const getByType = (type: OrderDocumentType) =>
    documents.filter((d) => d.type === type);

  return { documents, loading, upload, remove, getByType, refetch: fetchDocuments };
}

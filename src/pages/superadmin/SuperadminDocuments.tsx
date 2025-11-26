import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { logActivity } from "@/lib/activityLogger";
import { downloadFile, normalizeProductDocPath } from "@/lib/storage";

interface Document {
  id: string;
  type: string;
  file_url: string;
  verified: boolean;
  created_at: string;
  user: {
    full_name: string;
    company_name: string;
  };
}

const SuperadminDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [typeFilter, verifiedFilter, documents]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          user:profiles!documents_user_id_fkey(full_name, company_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
      setFilteredDocuments(data || []);
    } catch (error) {
      const message = handleError("Documents fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (typeFilter !== "all") {
      filtered = filtered.filter((d) => d.type === typeFilter);
    }

    if (verifiedFilter !== "all") {
      const isVerified = verifiedFilter === "verified";
      filtered = filtered.filter((d) => d.verified === isVerified);
    }

    setFilteredDocuments(filtered);
  };

  const toggleVerified = async (documentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ verified: !currentStatus })
        .eq("id", documentId);

      if (error) throw error;

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, verified: !currentStatus } : doc
        )
      );

      // Log activity
      await logActivity({
        action: !currentStatus ? "Verified document" : "Unverified document",
        entity: "document",
        entity_id: documentId,
        metadata: { verified: !currentStatus },
      });

      toast.success(`Document ${!currentStatus ? "verified" : "unverified"}`);
    } catch (error) {
      const message = handleError("Document update", error);
      toast.error(message);
    }
  };

  const uniqueTypes = Array.from(new Set(documents.map((d) => d.type)));

  const openDocument = async (fileUrl: string, fileName?: string) => {
    if (!fileUrl) return;
    const filePath = normalizeProductDocPath(fileUrl);
    if (!filePath) {
      toast.error("Ruta de archivo inválida");
      return;
    }
    const success = await downloadFile(filePath, fileName || "documento.pdf");
    if (!success) {
      toast.error("No se pudo descargar el documento");
    } else {
      toast.success("Descarga iniciada");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Verificación de Documentos</h1>
        <p className="text-muted-foreground mt-1">Revisa y verifica documentos de usuarios</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-foreground">Todos los Documentos</CardTitle>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Subido</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.user?.full_name}</TableCell>
                  <TableCell>{doc.user?.company_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={doc.verified}
                      onCheckedChange={() => toggleVerified(doc.id, doc.verified)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDocument(doc.file_url, `${doc.type}-${doc.user?.company_name || 'documento'}.pdf`)}
                    >
                      Descargar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDocuments.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No se encontraron documentos</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperadminDocuments;

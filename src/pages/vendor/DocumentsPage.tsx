import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Trash2, Download, AlertTriangle, Loader2 } from "lucide-react";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDocuments, useUploadDocument, useDeleteDocument, type VendorDocument } from "@/hooks/use-documents";
import { EmptyState } from "@/components/vendor/EmptyState";

const DOC_TYPES = ["W-9", "Insurance", "Contract", "License", "Certification", "ID", "Other"];

export default function DocumentsPage() {
  const { data: docs = [], isLoading } = useDocuments();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [docType, setDocType] = useState("Other");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    if (!fileRef.current?.files?.[0]) return;
    const file = fileRef.current.files[0];
    uploadDoc.mutate({ file, docType, expiresAt, notes }, {
      onSuccess: () => {
        setDialogOpen(false);
        setDocType("Other");
        setExpiresAt("");
        setNotes("");
      },
    });
  };

  const downloadDoc = async (doc: VendorDocument) => {
    const { data, error } = await supabase.storage.from("vendor-uploads").createSignedUrl(doc.file_path, 300);
    if (error) { toast.error(error.message || "Failed to generate download link"); return; }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Failed to generate download link");
  };

  const isExpiring = (d: VendorDocument) => d.expires_at && isBefore(parseISO(d.expires_at), addDays(new Date(), 30));
  const isExpired = (d: VendorDocument) => d.expires_at && isBefore(parseISO(d.expires_at), new Date());

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between"><div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72 mt-2" /></div><Skeleton className="h-10 w-28" /></div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const expiring = docs.filter((d) => isExpiring(d) && !isExpired(d));
  const expired = docs.filter((d) => isExpired(d));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your vendor documents.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Upload className="h-4 w-4 mr-1.5" /> Upload</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>File</Label><Input type="file" ref={fileRef} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" /></div>
              <div className="space-y-2"><Label>Expiration Date (optional)</Label><Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></div>
              <div className="space-y-2"><Label>Notes (optional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button onClick={handleUpload} disabled={uploadDoc.isPending} className="w-full">
                {uploadDoc.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Uploading...</> : "Upload Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(expired.length > 0 || expiring.length > 0) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                {expired.length > 0 && <p className="font-medium text-destructive">{expired.length} document(s) expired</p>}
                {expiring.length > 0 && <p className="text-muted-foreground">{expiring.length} document(s) expiring within 30 days</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Your Documents</CardTitle>
          <CardDescription>{docs.length} document(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <EmptyState icon={FileText} title="No documents uploaded" description="Upload your W-9, insurance, contracts, and certifications." />
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">{doc.file_name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{doc.document_type}</Badge>
                      {isExpired(doc) && <Badge variant="destructive" className="text-xs shrink-0">Expired</Badge>}
                      {isExpiring(doc) && !isExpired(doc) && <Badge variant="outline" className="text-xs shrink-0 border-destructive/50 text-destructive">Expiring</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ""}
                      {doc.expires_at ? ` · Expires ${format(parseISO(doc.expires_at), "MMM d, yyyy")}` : ""}
                      {doc.notes ? ` · ${doc.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadDoc(doc)} aria-label="Download"><Download className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteDoc.mutate(doc)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useVendorDocuments,
  useDownloadVendorDocument,
  getDocumentStatus,
  getMissingDocuments,
  DOCUMENT_TYPES,
} from '@/hooks/useVendorDocuments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AdminVendorDocumentsProps {
  vendorId: string;
}

export function AdminVendorDocuments({ vendorId }: AdminVendorDocumentsProps) {
  const { data: documents, isLoading } = useVendorDocuments(vendorId);
  const downloadMutation = useDownloadVendorDocument();

  const handleDownload = (filePath: string, fileName: string) => {
    downloadMutation.mutate({ filePath, fileName });
  };

  const getStatusBadge = (expiresAt: string | null) => {
    const status = getDocumentStatus(expiresAt);
    
    if (status === 'valid') {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Valid
        </Badge>
      );
    }
    if (status === 'expiring') {
      return (
        <Badge className="bg-yellow-500">
          <Clock className="h-3 w-3 mr-1" />
          Expiring Soon
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500">
        <AlertCircle className="h-3 w-3 mr-1" />
        Expired
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  const missingDocs = getMissingDocuments(documents || []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Vendor Documents</h3>
        <p className="text-sm text-muted-foreground">
          Business documents and certifications
        </p>
      </div>

      {missingDocs.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Missing required documents: {missingDocs.map(d => d.label).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{doc.file_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                    </p>
                    {doc.uploaded_at && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">
                          Uploaded: {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                        </p>
                      </>
                    )}
                    {doc.expires_at && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(doc.expires_at), 'MMM d, yyyy')}
                        </p>
                      </>
                    )}
                  </div>
                  {doc.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{doc.notes}</p>
                  )}
                </div>
                {getStatusBadge(doc.expires_at)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownload(doc.file_path, doc.file_name)}
                className="ml-4"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No documents uploaded</p>
        </div>
      )}
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorDocument {
  id: string;
  vendor_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  expires_at: string | null;
  notes: string | null;
  uploaded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const DOCUMENT_TYPES = [
  { value: 'w9', label: 'W9 Tax Form', requiresExpiration: false },
  { value: 'insurance', label: 'Insurance Certificate', requiresExpiration: true },
  { value: 'license', label: 'Business License', requiresExpiration: true },
  { value: 'contract_template', label: 'Contract Template', requiresExpiration: false },
  { value: 'portfolio', label: 'Portfolio/Demo Reel', requiresExpiration: false },
  { value: 'certification', label: 'Certification', requiresExpiration: true },
  { value: 'other', label: 'Other', requiresExpiration: false },
];

export function useVendorDocuments(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-documents', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as VendorDocument[];
    },
  });
}

export function useUploadVendorDocument(vendorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      documentType,
      expiresAt,
      notes,
    }: {
      file: File;
      documentType: string;
      expiresAt?: string;
      notes?: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${vendorId}/documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert document record
      const { data, error: insertError } = await supabase
        .from('vendor_documents')
        .insert({
          vendor_id: vendorId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          expires_at: expiresAt || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', vendorId] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload document');
    },
  });
}

export function useUpdateVendorDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      vendorId,
      expiresAt,
      notes,
    }: {
      documentId: string;
      vendorId: string;
      expiresAt?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('vendor_documents')
        .update({
          expires_at: expiresAt || null,
          notes: notes || null,
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', variables.vendorId] });
      toast.success('Document updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update document');
    },
  });
}

export function useDeleteVendorDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, vendorId, filePath }: { documentId: string; vendorId: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('vendor-uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record
      const { error: deleteError } = await supabase
        .from('vendor_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', variables.vendorId] });
      toast.success('Document deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });
}

export function useDownloadVendorDocument() {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from('vendor-uploads')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to download document');
    },
  });
}

export const REQUIRED_DOCUMENTS = ['w9', 'insurance'] as const;

export function getDocumentStatus(expiresAt: string | null): 'valid' | 'expiring' | 'expired' {
  if (!expiresAt) return 'valid';

  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'valid';
}

export function getMissingDocuments(documents: VendorDocument[]): typeof DOCUMENT_TYPES[number][] {
  const uploadedTypes = new Set((documents || []).map(d => d.document_type));
  return REQUIRED_DOCUMENTS
    .filter(req => !uploadedTypes.has(req))
    .map(req => DOCUMENT_TYPES.find(t => t.value === req)!)
    .filter(Boolean);
}

export function getExpiredDocuments(documents: VendorDocument[]): { doc: VendorDocument; status: 'expired' | 'expiring' }[] {
  if (!documents) return [];
  return documents
    .map(doc => ({ doc, status: getDocumentStatus(doc.expires_at) }))
    .filter(({ status }) => status === 'expired' || status === 'expiring') as { doc: VendorDocument; status: 'expired' | 'expiring' }[];
}

export function getComplianceStatus(documents: VendorDocument[]): 'compliant' | 'attention' | 'non-compliant' {
  const missing = getMissingDocuments(documents || []);
  if (missing.length > 0) return 'non-compliant';

  const expiredDocs = getExpiredDocuments(documents || []);
  const hasExpired = expiredDocs.some(({ status }) => status === 'expired');
  if (hasExpired) return 'non-compliant';

  const hasExpiring = expiredDocs.some(({ status }) => status === 'expiring');
  if (hasExpiring) return 'attention';

  return 'compliant';
}

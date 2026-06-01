import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface VendorDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  expires_at: string | null;
  notes: string | null;
  uploaded_at: string | null;
  created_at: string | null;
}

export function useDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["vendor-documents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("vendor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VendorDocument[];
    },
  });
}

export function useUploadDocument() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, docType, expiresAt, notes }: { file: File; docType: string; expiresAt: string; notes: string }) => {
      if (file.size > 10 * 1024 * 1024) throw new Error("File must be under 10MB");
      const path = `vendor-documents/${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("vendor-uploads").upload(path, file);
      if (uploadError) throw uploadError;
      const { data, error } = await supabase
        .from("vendor_documents")
        .insert({
          vendor_id: user!.id,
          document_type: docType,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          expires_at: expiresAt || null,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      qc.invalidateQueries({ queryKey: ["vendor-documents"] });
    },
    onError: (e: any) => toast.error(e.message || "Upload failed"),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: VendorDocument) => {
      // Delete DB row first to avoid orphaned storage files if DB delete fails
      const { error } = await supabase.from("vendor_documents").delete().eq("id", doc.id);
      if (error) throw error;
      // Best-effort storage cleanup — DB row is already gone
      await supabase.storage.from("vendor-uploads").remove([doc.file_path]).catch(() => {});
    },
    onSuccess: () => {
      toast.success("Document deleted");
      qc.invalidateQueries({ queryKey: ["vendor-documents"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete document."),
  });
}

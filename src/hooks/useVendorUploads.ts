import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VendorUpload } from '@/types/vendorInvite';
import { toast } from 'sonner';

export const useVendorUploads = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-uploads', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('No event ID');

      const { data, error } = await supabase
        .from('vendor_event_uploads')
        .select('*')
        .eq('event_id', eventId)
        .order('uploaded_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as VendorUpload[];
    },
    enabled: !!eventId,
  });
};

export const useUploadVendorFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      assignmentId,
      file,
      category,
      notes,
    }: {
      eventId: string;
      assignmentId?: string;
      file: File;
      category: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `${user.id}/${eventId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('vendor_event_uploads')
        .insert({
          event_id: eventId,
          vendor_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          category,
          notes,
        });

      if (dbError) throw dbError;

      // Update assignment to mark files uploaded
      if (assignmentId) {
        await supabase
          .from('event_dj_assignments')
          .update({ vendor_files_uploaded: true })
          .eq('id', assignmentId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-uploads', variables.eventId] });
      if (variables.assignmentId) {
        queryClient.invalidateQueries({ queryKey: ['vendor-assignments'] });
      }
      toast.success('File uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });
};

export const useDeleteVendorFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      filePath,
      eventId,
    }: {
      fileId: string;
      filePath: string;
      eventId: string;
    }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('vendor-uploads')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('vendor_event_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-uploads', eventId] });
      toast.success('File deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete file');
    },
  });
};

export const useDownloadVendorFile = () => {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('vendor-uploads')
        .download(filePath);

      if (error) throw error;
      return { data, filePath };
    },
    onSuccess: ({ data, filePath }) => {
      const fileName = filePath.split('/').pop() || 'download';
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to download file');
    },
  });
};

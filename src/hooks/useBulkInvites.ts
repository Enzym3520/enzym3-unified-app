import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BulkInviteRow, BulkInviteResult } from '@/types/vendorInvite';
import { toast } from 'sonner';

export const useProcessBulkInvites = () => {
  return useMutation({
    mutationFn: async (invites: BulkInviteRow[]) => {
      const { data, error } = await supabase.functions.invoke(
        'process-bulk-vendor-invites',
        {
          body: { invites },
        }
      );

      if (error) throw error;
      return data as BulkInviteResult;
    },
    onSuccess: (data) => {
      const { successful, failed, skipped } = data;
      toast.success(
        `Processed ${successful.length} invites successfully. ${
          failed.length > 0 ? `${failed.length} failed.` : ''
        } ${skipped.length > 0 ? `${skipped.length} skipped.` : ''}`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process bulk invites');
    },
  });
};

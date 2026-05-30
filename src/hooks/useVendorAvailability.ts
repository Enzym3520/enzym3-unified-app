import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AvailabilityBlock {
  id: string;
  vendor_id: string;
  start_date: string;
  end_date: string;
  reason: 'vacation' | 'booked_elsewhere' | 'seasonal_closure' | 'personal' | 'other';
  is_flexible: boolean;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CreateAvailabilityBlock {
  vendor_id: string;
  start_date: string;
  end_date: string;
  reason: AvailabilityBlock['reason'];
  is_flexible: boolean;
  notes?: string;
}

export const useVendorAvailability = (vendorId?: string) => {
  const queryClient = useQueryClient();

  const { data: blocks, isLoading } = useQuery({
    queryKey: ['vendor-availability', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_availability_blocks')
        .select('*')
        .eq('vendor_id', vendorId!)
        .order('start_date', { ascending: true })
        .limit(200);

      if (error) throw error;
      return data as AvailabilityBlock[];
    },
  });

  const addBlock = useMutation({
    mutationFn: async (block: CreateAvailabilityBlock) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('vendor_availability_blocks')
        .insert({
          ...block,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-availability'] });
      toast.success('Availability block added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add availability block');
    },
  });

  const updateBlock = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateAvailabilityBlock> }) => {
      const { error } = await supabase
        .from('vendor_availability_blocks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-availability'] });
      toast.success('Availability block updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update availability block');
    },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vendor_availability_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-availability'] });
      toast.success('Availability block removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove availability block');
    },
  });

  return {
    blocks: blocks || [],
    isLoading,
    addBlock,
    updateBlock,
    deleteBlock,
  };
};

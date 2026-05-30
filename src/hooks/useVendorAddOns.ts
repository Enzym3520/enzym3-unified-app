import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorAddOn {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useVendorAddOns = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-add-ons', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');
      const { data, error } = await supabase
        .from('vendor_add_ons')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('sort_order', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as VendorAddOn[];
    },
    enabled: !!vendorId,
  });
};

export const usePublicVendorAddOns = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['public-vendor-add-ons', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');
      const { data, error } = await supabase
        .from('vendor_add_ons')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as VendorAddOn[];
    },
    enabled: !!vendorId,
  });
};

export const useCreateAddOn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (addOn: Omit<VendorAddOn, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('vendor_add_ons')
        .insert(addOn)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-add-ons', variables.vendor_id] });
      toast.success('Add-on added');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to add add-on'),
  });
};

export const useUpdateAddOn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendorAddOn> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendor_add_ons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-add-ons', data.vendor_id] });
      toast.success('Add-on updated');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update add-on'),
  });
};

export const useDeleteAddOn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vendorId }: { id: string; vendorId: string }) => {
      const { error } = await supabase.from('vendor_add_ons').delete().eq('id', id);
      if (error) throw error;
      return vendorId;
    },
    onSuccess: (vendorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-add-ons', vendorId] });
      toast.success('Add-on deleted');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to delete add-on'),
  });
};

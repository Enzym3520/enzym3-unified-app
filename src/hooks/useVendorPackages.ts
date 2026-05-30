import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorPackage {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useVendorPackages = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-packages', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');
      const { data, error } = await supabase
        .from('vendor_packages')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('sort_order', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as VendorPackage[];
    },
    enabled: !!vendorId,
  });
};

export const usePublicVendorPackages = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['public-vendor-packages', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');
      const { data, error } = await supabase
        .from('vendor_packages')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as VendorPackage[];
    },
    enabled: !!vendorId,
  });
};

export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pkg: Omit<VendorPackage, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('vendor_packages')
        .insert(pkg)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-packages', variables.vendor_id] });
      toast.success('Package added');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to add package'),
  });
};

export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendorPackage> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendor_packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-packages', data.vendor_id] });
      toast.success('Package updated');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update package'),
  });
};

export const useDeletePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vendorId }: { id: string; vendorId: string }) => {
      const { error } = await supabase.from('vendor_packages').delete().eq('id', id);
      if (error) throw error;
      return vendorId;
    },
    onSuccess: (vendorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-packages', vendorId] });
      toast.success('Package deleted');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to delete package'),
  });
};

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Check if vendor has active assignments
export const useVendorAssignmentsCheck = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-assignments-check', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      if (!vendorId) return { hasActiveAssignments: false, assignments: [] };

      const { data, error } = await supabase
        .from('event_dj_assignments')
        .select(`
          id,
          status,
          event_id,
          event_notification_history!event_dj_assignments_event_id_fkey (
            couple_name,
            event_date,
            event_type
          )
        `)
        .eq('dj_user_id', vendorId)
        .in('status', ['assigned', 'confirmed'])
        .limit(500);

      if (error) throw error;

      return {
        hasActiveAssignments: data && data.length > 0,
        assignments: data || [],
      };
    },
  });
};

// Delete vendor via edge function
export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-vendor', {
        body: { vendorId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete vendor');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-invites'] });
      queryClient.invalidateQueries({ queryKey: ['active-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      
      if (data?.warning) {
        toast.success('Vendor deleted (with warning)', {
          description: data.warning,
        });
      } else {
        toast.success('Vendor deleted successfully');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete vendor');
    },
  });
};

// Deactivate vendor
export const useDeactivateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          vendor_status: 'inactive',
        })
        .eq('id', vendorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['active-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      toast.success('Vendor deactivated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deactivate vendor');
    },
  });
};

// Activate vendor
export const useActivateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: true,
          vendor_status: 'active',
        })
        .eq('id', vendorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['active-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      toast.success('Vendor activated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to activate vendor');
    },
  });
};

// Toggle Do Not Use status
export const useToggleDoNotUse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, markAsDoNotUse }: { vendorId: string; markAsDoNotUse: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          vendor_status: markAsDoNotUse ? 'do_not_use' : 'active',
          is_active: !markAsDoNotUse,
        })
        .eq('id', vendorId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['active-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      toast.success(variables.markAsDoNotUse ? 'Vendor marked as Do Not Use' : 'Do Not Use status removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update vendor status');
    },
  });
};

// Update vendor profile
export const useUpdateVendorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      updates,
    }: {
      vendorId: string;
      updates: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        company_name?: string;
        vendor_type?: string;
        service_area?: string[];
        starting_price?: number;
        price_type?: string;
      };
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', vendorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-full-profile'] });
      queryClient.invalidateQueries({ queryKey: ['active-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      toast.success('Vendor profile updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update vendor profile');
    },
  });
};

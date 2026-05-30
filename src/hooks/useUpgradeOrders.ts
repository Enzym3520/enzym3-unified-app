import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UpgradeOrderWithWedding, PaymentStatus } from '@/types/upgradeOrder';
import { useToast } from '@/hooks/use-toast';

export function useUpgradeOrders(filters?: {
  paymentStatus?: PaymentStatus;
  packageType?: string;
  searchQuery?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: upgradeOrders = [], isLoading, error } = useQuery({
    queryKey: ['upgrade-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('upgrade_orders')
        .select(`
          *,
          event_notification_history!inner(
            couple_name,
            event_date,
            venue,
            contact_email,
            contact_phone,
            coordinator_name,
            dj_name,
            package_type,
            guest_count
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      if (filters?.packageType) {
        query = query.eq('selected_package', filters.packageType);
      }

      if (filters?.searchQuery) {
        const sanitized = filters.searchQuery.replace(/[,.()"'\\]/g, '');
        if (sanitized.trim()) {
          query = query.ilike('event_notification_history.couple_name', `%${sanitized}%`);
        }
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      return data as UpgradeOrderWithWedding[];
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentStatus }) => {
      const { data, error } = await supabase
        .from('upgrade_orders')
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upgrade-orders'] });
      toast({
        title: 'Payment status updated',
        description: 'The upgrade order payment status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating payment status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    upgradeOrders,
    isLoading,
    error,
    updatePaymentStatus: updatePaymentStatusMutation.mutate,
  };
}

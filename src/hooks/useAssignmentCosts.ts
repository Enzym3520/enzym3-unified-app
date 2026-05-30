import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AssignmentCost {
  id: string;
  assignment_id: string;
  vendor_rate: number;
  admin_markup_percent: number;
  client_price: number;
  hours_booked?: number;
  overtime_hours?: number;
  total_vendor_cost: number;
  total_client_price: number;
  payment_status: 'unpaid' | 'paid_to_vendor' | 'collected_from_client' | 'fully_paid';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useAssignmentCost = (assignmentId: string | undefined) => {
  return useQuery({
    queryKey: ['assignment-cost', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('No assignment ID');

      const { data, error } = await supabase
        .from('assignment_costs')
        .select('*')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (error) throw error;
      return data as AssignmentCost | null;
    },
    enabled: !!assignmentId,
  });
};

export const useVendorEarnings = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-earnings', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');

      // Step 1: Get cost data from the safe view (masks admin_markup_percent, client_price, total_client_price)
      const { data: costRows, error: costError } = await supabase
        .from('vendor_assignment_costs_safe' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (costError) throw costError;
      if (!costRows || costRows.length === 0) {
        return { assignments: [], totalEarnings: 0, pendingPayments: 0, paidAmount: 0 };
      }

      // Step 2: Get the vendor's assignments to filter and enrich with event data
      const assignmentIds = costRows.map((c: any) => c.assignment_id);
      const { data: assignments, error: assignError } = await supabase
        .from('event_dj_assignments')
        .select(`
          id,
          dj_user_id,
          status,
          event:event_notification_history(
            couple_name,
            event_date,
            event_type
          )
        `)
        .eq('dj_user_id', vendorId)
        .in('id', assignmentIds)
        .limit(2000);

      if (assignError) throw assignError;

      // Step 3: Merge cost data with assignment/event data
      const assignmentMap = new Map((assignments || []).map((a: any) => [a.id, a]));
      const merged = costRows
        .filter((c: any) => assignmentMap.has(c.assignment_id))
        .map((c: any) => ({
          ...c,
          assignment: assignmentMap.get(c.assignment_id),
        }));

      const totalEarnings = merged.reduce((sum: number, cost: any) => sum + Number(cost.total_vendor_cost), 0);
      const pendingPayments = merged.filter((c: any) => c.payment_status === 'unpaid' || c.payment_status === 'collected_from_client').length;
      const paidAmount = merged
        .filter((c: any) => c.payment_status === 'paid_to_vendor' || c.payment_status === 'fully_paid')
        .reduce((sum: number, cost: any) => sum + Number(cost.total_vendor_cost), 0);

      return {
        assignments: merged,
        totalEarnings,
        pendingPayments,
        paidAmount,
      };
    },
    enabled: !!vendorId,
  });
};

export const useCreateAssignmentCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cost: Omit<AssignmentCost, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('assignment_costs')
        .insert(cost)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-cost', variables.assignment_id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-earnings'] });
      toast.success('Cost details saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save cost details');
    },
  });
};

export const useUpdateAssignmentCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AssignmentCost> & { id: string }) => {
      const { data, error } = await supabase
        .from('assignment_costs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-cost', data.assignment_id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-earnings'] });
      toast.success('Cost details updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update cost details');
    },
  });
};

export const useAllAssignmentCosts = () => {
  return useQuery({
    queryKey: ['all-assignment-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_costs')
        .select(`
          *,
          assignment:event_dj_assignments!inner(
            id,
            status,
            dj_user_id,
            event:event_notification_history(
              couple_name,
              event_date,
              event_type
            ),
            vendor:profiles!dj_user_id(
              first_name,
              last_name,
              company_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const totalVendorCosts = data?.reduce((sum, cost) => sum + Number(cost.total_vendor_cost), 0) || 0;
      const totalClientPrices = data?.reduce((sum, cost) => sum + Number(cost.total_client_price), 0) || 0;
      const totalProfit = totalClientPrices - totalVendorCosts;

      return {
        assignments: data,
        totalVendorCosts,
        totalClientPrices,
        totalProfit,
      };
    },
  });
};

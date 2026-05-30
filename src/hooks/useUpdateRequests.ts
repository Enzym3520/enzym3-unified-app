import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSubmitUpdateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      event_id: string;
      field_name: string;
      suggested_value?: string;
      reason: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('event_update_requests' as any)
        .insert({
          event_id: data.event_id,
          vendor_id: user.user.id,
          field_name: data.field_name,
          suggested_value: data.suggested_value || null,
          reason: data.reason,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Update request submitted');
      queryClient.invalidateQueries({ queryKey: ['update-requests'] });
    },
    onError: (err: any) => {
      toast.error('Failed to submit request: ' + (err.message || 'Unknown error'));
    },
  });
}

export function useMyUpdateRequests(eventId: string | undefined) {
  return useQuery({
    queryKey: ['update-requests', 'mine', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_update_requests' as any)
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!eventId,
  });
}

export function useAllPendingUpdateRequests() {
  return useQuery({
    queryKey: ['update-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_update_requests' as any)
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with vendor and event names
      const enriched = await Promise.all(
        (data as any[]).map(async (req: any) => {
          const [vendorRes, eventRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('first_name, last_name, company_name')
              .eq('id', req.vendor_id)
              .single(),
            supabase
              .from('event_notification_history')
              .select('couple_name, event_date, event_type')
              .eq('id', req.event_id)
              .single(),
          ]);

          const v = vendorRes.data;
          const e = eventRes.data;

          return {
            ...req,
            vendor_name: v?.company_name || `${v?.first_name || ''} ${v?.last_name || ''}`.trim() || 'Unknown',
            couple_name: e?.couple_name || 'Unknown Event',
            event_date: e?.event_date,
            event_type: e?.event_type,
          };
        })
      );

      return enriched;
    },
  });
}

export function useReviewUpdateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      status: 'approved' | 'rejected';
      reviewer_notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('event_update_requests' as any)
        .update({
          status: data.status,
          reviewed_by: user.user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: data.reviewer_notes || null,
        })
        .eq('id', data.requestId);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Request ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ['update-requests'] });
    },
    onError: (err: any) => {
      toast.error('Failed to review request: ' + (err.message || 'Unknown error'));
    },
  });
}

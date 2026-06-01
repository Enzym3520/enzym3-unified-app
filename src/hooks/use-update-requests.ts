import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SubmitUpdateRequestParams {
  eventId: string;
  fieldName: string;
  suggestedValue?: string;
  reason: string;
}

export function useSubmitUpdateRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId, fieldName, suggestedValue, reason }: SubmitUpdateRequestParams) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('event_update_requests')
        .insert({
          event_id: eventId,
          vendor_id: user.id,
          field_name: fieldName,
          suggested_value: suggestedValue || null,
          reason,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success('Update request submitted', {
        description: 'Your coordinator will review this shortly.',
      });
      queryClient.invalidateQueries({ queryKey: ['update-requests', variables.eventId] });
    },
    onError: (error: any) => {
      toast.error('Failed to submit request', { description: error.message });
    },
  });
}

export function useMyUpdateRequests(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['update-requests', eventId],
    queryFn: async () => {
      if (!eventId || !user) return [];
      const { data, error } = await supabase
        .from('event_update_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!user,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VendorAssignment } from '@/types/vendorInvite';
import { toast } from 'sonner';

export const useVendorAssignments = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-assignments', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');

      // Use vendor_event_details view which masks PII for non-admin users
      const { data, error } = await supabase
        .from('event_dj_assignments')
        .select(`
          *,
          event:vendor_event_details(*)
        `)
        .eq('dj_user_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Resolve venue addresses (best-effort) so vendors can navigate to the gig
      const assignments = (data || []) as any[];
      const uniqueVenues = Array.from(
        new Set(
          assignments
            .map((a) => a.event?.venue)
            .filter((v): v is string => !!v && typeof v === 'string')
        )
      );
      if (uniqueVenues.length > 0) {
        const addressMap = new Map<string, string>();
        await Promise.all(
          uniqueVenues.map(async (venue) => {
            const { data: addr } = await supabase.rpc('get_venue_address', { venue_name: venue });
            if (addr) addressMap.set(venue.toLowerCase().trim(), addr as string);
          })
        );
        assignments.forEach((a) => {
          if (a.event?.venue) {
            const addr = addressMap.get(a.event.venue.toLowerCase().trim());
            if (addr) a.event.venue_address = addr;
          }
        });
      }

      return assignments as VendorAssignment[];
    },
    enabled: !!vendorId,
  });
};

export const useConfirmAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('event_dj_assignments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-assignments'] });
      toast.success('Event confirmed!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to confirm event');
    },
  });
};

export const useDeclineAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, reason }: { assignmentId: string; reason: string }) => {
      const { error } = await supabase
        .from('event_dj_assignments')
        .update({
          status: 'declined',
          declined_reason: reason,
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-assignments'] });
      toast.info('Event declined');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to decline event');
    },
  });
};

export const useCompleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      notes,
    }: {
      assignmentId: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('event_dj_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          completion_notes: notes,
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-assignments'] });
      toast.success('Event marked as complete!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete event');
    },
  });
};

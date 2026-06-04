import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VendorAssignment } from '@/types/vendorInvite';
import { toast } from 'sonner';

interface AssignmentWithDetails extends VendorAssignment {
  vendor?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    vendor_type: string | null;
  };
  event?: {
    id: string;
    couple_name: string;
    event_date: string;
    event_type: string;
    venue: string | null;
  };
}

interface AssignmentFilters {
  status?: string;
  vendorType?: string;
  search?: string;
}

export const useAllAssignments = (filters?: AssignmentFilters) => {
  return useQuery({
    queryKey: ['admin-assignments', filters],
    queryFn: async () => {
      let query = supabase
        .from('event_dj_assignments')
        .select(`
          *,
          vendor:profiles!event_dj_assignments_dj_user_id_fkey(
            id,
            first_name,
            last_name,
            company_name,
            vendor_type
          ),
          event:event_notification_history!event_dj_assignments_event_id_fkey(
            id,
            couple_name,
            event_date,
            event_type,
            venue
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.vendorType) {
        query = query.eq('vendor.vendor_type', filters.vendorType);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;

      let assignments = data as AssignmentWithDetails[];

      // Apply search filter on client side
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        assignments = assignments.filter(
          (a) =>
            a.event?.couple_name?.toLowerCase().includes(searchLower) ||
            a.vendor?.first_name?.toLowerCase().includes(searchLower) ||
            a.vendor?.last_name?.toLowerCase().includes(searchLower) ||
            a.vendor?.company_name?.toLowerCase().includes(searchLower)
        );
      }

      return assignments;
    },
  });
};

export const useAssignmentStats = () => {
  return useQuery({
    queryKey: ['assignment-stats'],
    queryFn: async () => {
      const [totalRes, assignedRes, confirmedRes, completedRes, declinedRes] = await Promise.all([
        supabase.from('event_dj_assignments').select('*', { count: 'exact', head: true }),
        supabase.from('event_dj_assignments').select('*', { count: 'exact', head: true }).eq('status', 'assigned'),
        supabase.from('event_dj_assignments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('event_dj_assignments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('event_dj_assignments').select('*', { count: 'exact', head: true }).eq('status', 'declined'),
      ]);

      if (totalRes.error) throw totalRes.error;

      return {
        total: totalRes.count ?? 0,
        assigned: assignedRes.count ?? 0,
        confirmed: confirmedRes.count ?? 0,
        completed: completedRes.count ?? 0,
        declined: declinedRes.count ?? 0,
      };
    },
  });
};

export const useEventAssignments = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event-assignments', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('No event ID');

      const { data, error } = await supabase
        .from('event_dj_assignments')
        .select(`
          *,
          vendor:profiles!event_dj_assignments_dj_user_id_fkey(
            id,
            first_name,
            last_name,
            company_name,
            vendor_type,
            phone,
            email
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AssignmentWithDetails[];
    },
    enabled: !!eventId,
  });
};

// Helper: build a combined dj_name string from all vendors assigned to an event
const buildDjNameForEvent = async (eventId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('event_dj_assignments')
    .select('dj_user_id, vendor:profiles!event_dj_assignments_dj_user_id_fkey(first_name, last_name, company_name)')
    .eq('event_id', eventId)
    .limit(100);

  if (!data || data.length === 0) return null;

  return data
    .map((a: any) => {
      const v = a.vendor;
      if (!v) return null;
      const fullName = [v.first_name, v.last_name].filter(Boolean).join(' ');
      return fullName || v.company_name || null;
    })
    .filter(Boolean)
    .join(', ') || null;
};

const syncDjName = async (eventId: string) => {
  const djName = await buildDjNameForEvent(eventId);
  await supabase
    .from('event_notification_history')
    .update({ dj_name: djName })
    .eq('id', eventId);
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      vendorId,
      notes,
    }: {
      eventId: string;
      vendorId: string;
      notes?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: inserted, error } = await supabase.from('event_dj_assignments').insert({
        event_id: eventId,
        event_notification_id: eventId,
        dj_user_id: vendorId,
        assignment_notes: notes,
        assigned_by: user.id,
        status: 'assigned',
      }).select('id').single();

      if (error) throw error;

      // Sync dj_name on the notification record
      await syncDjName(eventId);

      return { assignmentId: inserted?.id, eventId, vendorId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['event-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['event-notifications'] });
      toast.success('Vendor assigned successfully!');

      // Fire-and-forget vendor notification — non-fatal if it fails
      if (data?.assignmentId && data?.eventId && data?.vendorId) {
        supabase.functions.invoke('send-vendor-assignment-email', {
          body: {
            assignment_id: data.assignmentId,
            dj_user_id: data.vendorId,
            event_id: data.eventId,
          },
        }).catch((err) => console.error('vendor assignment email failed (non-fatal):', err));
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign vendor');
    },
  });
};

export const useCancelAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      // Get the event_id before deleting
      const { data: assignment } = await supabase
        .from('event_dj_assignments')
        .select('event_id')
        .eq('id', assignmentId)
        .maybeSingle();

      const { error } = await supabase
        .from('event_dj_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      // Sync dj_name after removal
      if (assignment?.event_id) {
        await syncDjName(assignment.event_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['event-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['event-notifications'] });
      toast.success('Assignment cancelled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel assignment');
    },
  });
};

export const useReassignVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      newVendorId,
      notes,
    }: {
      assignmentId: string;
      newVendorId: string;
      notes?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get event_id before updating
      const { data: assignment } = await supabase
        .from('event_dj_assignments')
        .select('event_id')
        .eq('id', assignmentId)
        .maybeSingle();

      const { error } = await supabase
        .from('event_dj_assignments')
        .update({
          dj_user_id: newVendorId,
          assignment_notes: notes,
          assigned_by: user.id,
          status: 'assigned',
          confirmed_at: null,
          declined_reason: null,
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Sync dj_name after reassignment
      if (assignment?.event_id) {
        await syncDjName(assignment.event_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['event-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['event-notifications'] });
      toast.success('Vendor reassigned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reassign vendor');
    },
  });
};

export const useUpdateAssignmentNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      notes,
    }: {
      assignmentId: string;
      notes: string;
    }) => {
      const { error } = await supabase
        .from('event_dj_assignments')
        .update({ assignment_notes: notes })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['event-assignments'] });
      toast.success('Notes updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update notes');
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorMeeting {
  id: string;
  wedding_id: string;
  booking_date: string;
  booking_time: string;
  meeting_type: string;
  meeting_format: string | null;
  meeting_link: string | null;
  status: string;
  customer_notes: string | null;
  vendor_rsvp: string | null;
  vendor_rsvp_at: string | null;
  vendor_notes: string | null;
  couple_name: string;
  venue: string | null;
  event_date: string;
}

export function useVendorMeetings(vendorId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['vendor-meetings', vendorId],
    queryFn: async (): Promise<VendorMeeting[]> => {
      if (!vendorId) return [];

      const { data: assignments, error: assignErr } = await supabase
        .from('event_dj_assignments')
        .select('event_id')
        .eq('dj_user_id', vendorId)
        .in('status', ['assigned', 'confirmed'])
        .limit(500);

      if (assignErr) throw assignErr;
      if (!assignments || assignments.length === 0) return [];

      const eventIds = assignments.map((a) => a.event_id);

      const { data: bookings, error: bookErr } = await supabase
        .from('bookings')
        .select('id, wedding_id, booking_date, booking_time, meeting_type, meeting_format, meeting_link, status, customer_notes, vendor_rsvp, vendor_rsvp_at, vendor_notes')
        .in('wedding_id', eventIds)
        .order('booking_date', { ascending: true })
        .limit(500);

      if (bookErr) throw bookErr;
      if (!bookings || bookings.length === 0) return [];

      const weddingIds = [...new Set(bookings.map((b) => b.wedding_id))];
      const { data: events } = await supabase
        .from('event_notification_history')
        .select('id, couple_name, venue, event_date')
        .in('id', weddingIds)
        .limit(500);

      const eventMap = new Map(events?.map((e) => [e.id, e]) ?? []);

      return bookings.map((b) => {
        const ev = eventMap.get(b.wedding_id);
        return {
          ...b,
          vendor_rsvp: b.vendor_rsvp ?? null,
          vendor_rsvp_at: b.vendor_rsvp_at ?? null,
          vendor_notes: b.vendor_notes ?? null,
          couple_name: ev?.couple_name ?? 'Unknown',
          venue: ev?.venue ?? null,
          event_date: ev?.event_date ?? '',
        };
      });
    },
    enabled: !!vendorId,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ bookingId, rsvp }: { bookingId: string; rsvp: 'accepted' | 'declined' }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          vendor_rsvp: rsvp,
          vendor_rsvp_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-meetings', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useVendorMeetings] RSVP failed:', error.message);
      import('sonner').then(({ toast }) => toast.error('Failed to update RSVP. Please try again.'));
    },
  });

  const notesMutation = useMutation({
    mutationFn: async ({ bookingId, notes }: { bookingId: string; notes: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          vendor_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-meetings', vendorId] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useVendorMeetings] Notes save failed:', error.message);
      import('sonner').then(({ toast }) => toast.error('Failed to save notes. Please try again.'));
    },
  });

  return { ...query, rsvpMutation, notesMutation };
}

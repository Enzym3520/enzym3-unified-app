import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

export interface VendorCalendarEvent {
  id: string;
  event_id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
  venue_address?: string | null;
  status: string;
  guest_count: number | null;
  assignment_status: string;
  confirmed_at: string | null;
  completed_at: string | null;
}

export interface VendorAvailabilityBlock {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_flexible: boolean | null;
  notes: string | null;
}

export const useVendorCalendarEvents = (
  vendorId: string | undefined,
  currentDate: Date,
  viewType: 'month' | 'week' | 'day' | 'schedule'
) => {
  return useQuery({
    // Use date-granular key for week/day/schedule to avoid stale cache within the same month
    queryKey: ['vendor-calendar-events', vendorId, viewType === 'month' ? format(currentDate, 'yyyy-MM') : format(currentDate, 'yyyy-MM-dd'), viewType],
    queryFn: async () => {
      if (!vendorId) return { events: [], blocks: [] };

      let startDate: Date;
      let endDate: Date;

      if (viewType === 'month') {
        startDate = startOfWeek(startOfMonth(currentDate));
        endDate = endOfWeek(endOfMonth(currentDate));
      } else if (viewType === 'week') {
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
      } else { // 'day' or 'schedule'
        startDate = currentDate;
        endDate = currentDate;
      }

      // Fetch vendor's assigned events using secure view (masks PII)
      const { data: assignments, error: assignmentsError } = await supabase
        .from('event_dj_assignments')
        .select(`
          id,
          status,
          confirmed_at,
          completed_at,
          event:vendor_event_details(
            id,
            couple_name,
            event_date,
            event_type,
            venue,
            status,
            guest_count
          )
        `)
        .eq('dj_user_id', vendorId)
        .gte('event.event_date', format(startDate, 'yyyy-MM-dd'))
        .lte('event.event_date', format(endDate, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })
        .limit(500);

      if (assignmentsError) throw assignmentsError;

      // Resolve venue addresses for navigation
      const filtered = (assignments || []).filter((a: any) => a.event);
      const uniqueVenues = Array.from(
        new Set(filtered.map((a: any) => a.event.venue).filter((v): v is string => !!v))
      );
      const addressMap = new Map<string, string>();
      if (uniqueVenues.length > 0) {
        await Promise.all(
          uniqueVenues.map(async (venue) => {
            const { data: addr } = await supabase.rpc('get_venue_address', { venue_name: venue });
            if (addr) addressMap.set(venue.toLowerCase().trim(), addr as string);
          })
        );
      }

      const events: (VendorCalendarEvent & { venue_address?: string | null })[] = filtered
        .map((assignment: any) => ({
          id: assignment.id,
          event_id: assignment.event.id,
          couple_name: assignment.event.couple_name,
          event_date: assignment.event.event_date,
          event_type: assignment.event.event_type,
          venue: assignment.event.venue,
          venue_address: assignment.event.venue
            ? addressMap.get(assignment.event.venue.toLowerCase().trim()) ?? null
            : null,
          status: assignment.event.status,
          guest_count: assignment.event.guest_count,
          assignment_status: assignment.status,
          confirmed_at: assignment.confirmed_at,
          completed_at: assignment.completed_at,
        }));

      // Fetch vendor's availability blocks
      // Proper overlap: block overlaps window when start_date <= windowEnd AND end_date >= windowStart
      const { data: blocks, error: blocksError } = await supabase
        .from('vendor_availability_blocks')
        .select('id, start_date, end_date, reason, is_flexible, notes')
        .eq('vendor_id', vendorId)
        .lte('start_date', format(endDate, 'yyyy-MM-dd'))
        .gte('end_date', format(startDate, 'yyyy-MM-dd'))
        .limit(200);

      if (blocksError) throw blocksError;

      return {
        events,
        blocks: blocks || [],
      };
    },
    enabled: !!vendorId,
  });
};

export const useVendorCalendarStats = (vendorId: string | undefined, currentDate: Date) => {
  return useQuery({
    queryKey: ['vendor-calendar-stats', vendorId, format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      if (!vendorId) return { eventsThisMonth: 0, needingConfirmation: 0 };

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data: assignments } = await supabase
        .from('event_dj_assignments')
        .select('id, status, event:vendor_event_details!inner(event_date)')
        .eq('dj_user_id', vendorId)
        .gte('event.event_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('event.event_date', format(monthEnd, 'yyyy-MM-dd'))
        .limit(500);

      const eventsThisMonth = assignments?.length || 0;
      const needingConfirmation = assignments?.filter((a: any) => a.status === 'assigned').length || 0;

      return {
        eventsThisMonth,
        needingConfirmation,
      };
    },
    enabled: !!vendorId,
  });
};

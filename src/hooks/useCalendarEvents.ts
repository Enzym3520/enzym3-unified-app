import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';
import type { CalendarMeeting } from '@/types/calendarItem';

export interface CalendarEvent {
  id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
  status: string;
  coordinator_name: string | null;
  guest_count: number | null;
  contact_email: string;
  contact_phone: string | null;
  assigned_vendors: {
    id: string;
    vendor_id: string;
    vendor_name: string;
    vendor_type: string;
    status: string;
  }[];
}

interface CalendarFilters {
  itemType?: 'all' | 'events' | 'meetings';
  eventType?: string;
  meetingType?: string;
  vendorId?: string;
  status?: string;
  search?: string;
}

export const useCalendarEvents = (
  currentDate: Date,
  viewType: 'month' | 'week' | 'day' | 'schedule',
  filters?: CalendarFilters
) => {
  return useQuery({
    // Use date-granular key for week/day/schedule to avoid stale cache within the same month
    queryKey: ['calendar-events', viewType === 'month' ? format(currentDate, 'yyyy-MM') : format(currentDate, 'yyyy-MM-dd'), viewType, filters],
    queryFn: async () => {
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

      let query = supabase
        .from('event_notification_history')
        .select(`
          id,
          couple_name,
          event_date,
          event_type,
          venue,
          status,
          coordinator_name,
          guest_count,
          contact_email,
          contact_phone,
          event_dj_assignments!event_dj_assignments_event_id_fkey (
            id,
            status,
            dj_user_id,
            profiles:dj_user_id (
              first_name,
              last_name,
              company_name,
              vendor_type
            )
          )
        `)
        .gte('event_date', format(startDate, 'yyyy-MM-dd'))
        .lte('event_date', format(endDate, 'yyyy-MM-dd'))
        .order('event_date', { ascending: true })
        .limit(500);

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        // Sanitize search input: strip commas, periods, and parens to prevent
        // PostgREST filter injection via .or() string interpolation
        const safeSearch = filters.search.replace(/[,.()"'\\]/g, '');
        if (safeSearch.trim()) {
          query = query.or(
            `couple_name.ilike.%${safeSearch}%,venue.ilike.%${safeSearch}%`
          );
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      let events: CalendarEvent[] = (data || []).map((event: any) => ({
        id: event.id,
        couple_name: event.couple_name,
        event_date: event.event_date,
        event_type: event.event_type,
        venue: event.venue,
        status: event.status,
        coordinator_name: event.coordinator_name,
        guest_count: event.guest_count,
        contact_email: event.contact_email,
        contact_phone: event.contact_phone,
        assigned_vendors: (event.event_dj_assignments || []).map((assignment: any) => ({
          id: assignment.id,
          vendor_id: assignment.dj_user_id,
          vendor_name: assignment.profiles?.company_name ||
            `${assignment.profiles?.first_name || ''} ${assignment.profiles?.last_name || ''}`.trim(),
          vendor_type: assignment.profiles?.vendor_type || 'Unknown',
          status: assignment.status,
        })),
      }));

      // Filter by vendor if specified
      if (filters?.vendorId) {
        events = events.filter(event =>
          event.assigned_vendors.some(v => v.vendor_id === filters.vendorId)
        );
      }

      // Fetch meetings if not filtering for events only
      let meetings: CalendarMeeting[] = [];
      if (filters?.itemType !== 'events') {
        let meetingsQuery = supabase
          .from('bookings')
          .select(`
            id,
            wedding_id,
            booking_date,
            booking_time,
            meeting_type,
            meeting_format,
            meeting_link,
            status,
            customer_notes,
            event_notification_history:wedding_id (
              couple_name,
              contact_email,
              venue
            )
          `)
          .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
          .lte('booking_date', format(endDate, 'yyyy-MM-dd'))
          .order('booking_date', { ascending: true })
          .limit(500);

        if (filters?.meetingType) {
          meetingsQuery = meetingsQuery.eq('meeting_type', filters.meetingType);
        }

        if (filters?.status) {
          meetingsQuery = meetingsQuery.eq('status', filters.status);
        }

        const { data: meetingsData, error: meetingsError } = await meetingsQuery;

        if (meetingsError) throw meetingsError;

        meetings = (meetingsData || [])
          .filter((m: any) => m.event_notification_history)
          .map((meeting: any) => ({
            id: meeting.id,
            wedding_id: meeting.wedding_id,
            booking_date: meeting.booking_date,
            booking_time: meeting.booking_time,
            meeting_type: meeting.meeting_type,
            meeting_format: meeting.meeting_format,
            meeting_link: meeting.meeting_link || null,
            status: meeting.status,
            customer_notes: meeting.customer_notes,
            couple_name: meeting.event_notification_history.couple_name,
            contact_email: meeting.event_notification_history.contact_email,
            venue: meeting.event_notification_history.venue,
          }));

        // Filter meetings by search if specified
        if (filters?.search) {
          meetings = meetings.filter((meeting) =>
            (meeting.couple_name || '').toLowerCase().includes(filters.search!.toLowerCase()) ||
            meeting.venue?.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
      }

      // Return based on itemType filter
      if (filters?.itemType === 'events') {
        return { events, meetings: [] };
      } else if (filters?.itemType === 'meetings') {
        return { events: [], meetings };
      } else {
        return { events, meetings };
      }
    },
  });
};

export const useCalendarStats = (currentDate: Date) => {
  return useQuery({
    queryKey: ['calendar-stats', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);

      const { data: weekEvents } = await supabase
        .from('event_notification_history')
        .select('id, event_dj_assignments!event_dj_assignments_event_id_fkey(id, status)')
        .gte('event_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('event_date', format(weekEnd, 'yyyy-MM-dd'))
        .limit(500);

      const { data: weekMeetings } = await supabase
        .from('bookings')
        .select('id')
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .limit(500);

      const eventsThisWeek = weekEvents?.length || 0;
      const meetingsThisWeek = weekMeetings?.length || 0;
      const unassigned = weekEvents?.filter(
        (e: any) => !e.event_dj_assignments || e.event_dj_assignments.length === 0
      ).length || 0;
      const pendingConfirmation = weekEvents?.filter(
        (e: any) => e.event_dj_assignments?.some((a: any) => a.status === 'pending')
      ).length || 0;

      return {
        eventsThisWeek,
        meetingsThisWeek,
        unassigned,
        pendingConfirmation,
      };
    },
  });
};

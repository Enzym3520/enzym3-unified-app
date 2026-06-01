import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from "date-fns";

export interface VendorCalendarEvent {
  id: string;
  event_id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
  status: string;
  guest_count: number | null;
  assignment_status: string;
  confirmed_at: string | null;
  completed_at: string | null;
  start_time: string | null;
  hours_booked: number | null;
}

export interface VendorAvailabilityBlock {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_flexible: boolean | null;
  notes: string | null;
}

export function useVendorCalendarEvents(
  vendorId: string | undefined,
  currentDate: Date,
  viewType: "month" | "week" | "day" | "schedule"
) {
  return useQuery({
    queryKey: ["vendor-calendar-events", vendorId, format(currentDate, "yyyy-MM"), viewType],
    queryFn: async () => {
      if (!vendorId) return { events: [], blocks: [] };

      let startDate: Date;
      let endDate: Date;

      if (viewType === "month") {
        startDate = startOfWeek(startOfMonth(currentDate));
        endDate = endOfWeek(endOfMonth(currentDate));
      } else if (viewType === "week") {
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
      } else {
        startDate = currentDate;
        endDate = currentDate;
      }

      const { data: assignments, error: assignmentsError } = await supabase
        .from("event_dj_assignments")
        .select(`
          id, status, confirmed_at, completed_at,
          event:vendor_event_details_secure!event_dj_assignments_event_id_fkey(id, couple_name, event_date, event_type, venue, status, guest_count, start_time, hours_booked)
        `)
        .eq("dj_user_id", vendorId)
        .gte("event.event_date", format(startDate, "yyyy-MM-dd"))
        .lte("event.event_date", format(endDate, "yyyy-MM-dd"))
        .order("created_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      const events: VendorCalendarEvent[] = (assignments || [])
        .filter((a: any) => a.event)
        .map((a: any) => ({
          id: a.id,
          event_id: a.event.id,
          couple_name: a.event.couple_name,
          event_date: a.event.event_date,
          event_type: a.event.event_type,
          venue: a.event.venue,
          status: a.event.status,
          guest_count: a.event.guest_count,
          assignment_status: a.status,
          confirmed_at: a.confirmed_at,
          completed_at: a.completed_at,
          start_time: a.event.start_time ?? null,
          hours_booked: a.event.hours_booked ?? null,
        }));

      const { data: blocks, error: blocksError } = await supabase
        .from("vendor_availability_blocks")
        .select("id, start_date, end_date, reason, is_flexible, notes")
        .eq("vendor_id", vendorId)
        .lte("start_date", format(endDate, "yyyy-MM-dd"))
        .gte("end_date", format(startDate, "yyyy-MM-dd"));

      if (blocksError) throw blocksError;

      return { events, blocks: blocks || [] };
    },
    enabled: !!vendorId,
  });
}

export function useVendorCalendarStats(vendorId: string | undefined, currentDate: Date) {
  return useQuery({
    queryKey: ["vendor-calendar-stats", vendorId, format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      if (!vendorId) return { eventsThisMonth: 0, needingConfirmation: 0 };

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data: assignments } = await supabase
        .from("event_dj_assignments")
        .select("id, status, event:vendor_event_details_secure!inner!event_dj_assignments_event_id_fkey(event_date)")
        .eq("dj_user_id", vendorId)
        .gte("event.event_date", format(monthStart, "yyyy-MM-dd"))
        .lte("event.event_date", format(monthEnd, "yyyy-MM-dd"));

      return {
        eventsThisMonth: assignments?.length || 0,
        needingConfirmation: assignments?.filter((a: any) => a.status === "assigned").length || 0,
      };
    },
    enabled: !!vendorId,
  });
}

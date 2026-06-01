import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CalendarEvent {
  id: string;
  status: string | null;
  event_id: string;
  couple_name: string;
  event_type: string;
  event_date: string;
  venue: string | null;
  guest_count: number | null;
  package_type: string | null;
  notes: string | null;
}

export interface BlackoutDate {
  id: string;
  blackout_date: string;
}

export interface AvailabilityBlock {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export function useCalendarData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["calendar-data", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { events: [], blackouts: [], blocks: [] };
      const [eventsRes, blackoutsRes, blocksRes] = await Promise.all([
        supabase
          .from("event_dj_assignments")
          .select(`
            id, status, event_id,
            event:vendor_event_details_secure!event_dj_assignments_event_id_fkey (
              couple_name, event_type, event_date, venue, guest_count, package_type, notes, start_time
            )
          `)
          .eq("dj_user_id", user!.id)
          .not("status", "eq", "declined")
          .limit(1000),
        supabase
          .from("vendor_blackout_dates")
          .select("id, blackout_date")
          .eq("vendor_id", user!.id),
        supabase
          .from("vendor_availability_blocks")
          .select("id, start_date, end_date, reason")
          .eq("vendor_id", user!.id),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (blackoutsRes.error) throw blackoutsRes.error;
      if (blocksRes.error) throw blocksRes.error;

      const events: CalendarEvent[] = (eventsRes.data ?? []).map((d: any) => ({
        id: d.id,
        status: d.status,
        event_id: d.event_id,
        couple_name: d.event?.couple_name ?? "—",
        event_type: d.event?.event_type ?? "",
        event_date: d.event?.event_date ?? "",
        venue: d.event?.venue,
        guest_count: d.event?.guest_count,
        package_type: d.event?.package_type,
        notes: d.event?.notes,
      }));

      return {
        events,
        blackouts: (blackoutsRes.data ?? []) as BlackoutDate[],
        blocks: (blocksRes.data ?? []) as AvailabilityBlock[],
      };
    },
  });
}

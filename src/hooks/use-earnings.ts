import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EarningRecord {
  id: string;
  vendor_rate: number;
  total_vendor_cost: number;
  hours_booked: number | null;
  overtime_hours: number | null;
  payment_status: string;
  created_at: string;
  event_couple_name: string | null;
  event_date: string | null;
  event_type: string | null;
  event_venue: string | null;
}

export function useEarnings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["earnings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get assignment IDs for this vendor
      const { data: assignments, error: assignError } = await supabase
        .from("event_dj_assignments")
        .select("id, event_id, status")
        .eq("dj_user_id", user.id)
        .limit(2000);
      if (assignError) throw assignError;

      if (!assignments?.length) return [];

      const assignmentIds = assignments.map((a) => a.id);

      // Batch .in() calls for large datasets (Supabase 1000-row filter limit)
      const allCosts: any[] = [];
      for (let i = 0; i < assignmentIds.length; i += 500) {
        const batch = assignmentIds.slice(i, i + 500);
        const { data, error } = await supabase
          .from("assignment_costs")
          .select("id, vendor_rate, total_vendor_cost, hours_booked, overtime_hours, payment_status, created_at, assignment_id")
          .in("assignment_id", batch);
        if (error) throw error;
        allCosts.push(...(data ?? []));
      }
      allCosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const eventIds = [...new Set(assignments.map((a) => a.event_id))];
      const allEvents: any[] = [];
      for (let i = 0; i < eventIds.length; i += 500) {
        const batch = eventIds.slice(i, i + 500);
        const { data, error } = await supabase
          .from("vendor_event_details_secure")
          .select("id, couple_name, event_date, event_type, venue")
          .in("id", batch);
        if (error) throw error;
        allEvents.push(...(data ?? []));
      }

      const eventMap = new Map(allEvents.map((e: any) => [e.id, e]));
      const assignMap = new Map(assignments.map((a) => [a.id, a]));

      return allCosts.map((c: any) => {
        const assignment = assignMap.get(c.assignment_id);
        const event = assignment ? eventMap.get(assignment.event_id) : null;
        return {
          ...c,
          event_couple_name: event?.couple_name ?? null,
          event_date: event?.event_date ?? null,
          event_type: event?.event_type ?? null,
          event_venue: event?.venue ?? null,
        } as EarningRecord;
      });
    },
    enabled: !!user,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VendorEventHistory {
  event_id: string;
  couple_name: string;
  event_type: string;
  event_date: string;
  venue: string | null;
  status: string;
  contact_email: string;
  guest_count: number | null;
  package_type: string | null;
  resend_count: number | null;
  last_resent_at: string | null;
  assignment_status: string;
  assignment_id: string;
  hours_booked: number | null;
  booking_source: string | null;
  dress_code: string | null;
  bride_email: string | null;
  groom_email: string | null;
  notes: string | null;
}

export function useEventHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["vendor-event-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc("get_vendor_event_history", {
        p_vendor_id: user.id,
      });
      if (error) throw error;
      return (data ?? []) as VendorEventHistory[];
    },
    enabled: !!user?.id,
  });
}

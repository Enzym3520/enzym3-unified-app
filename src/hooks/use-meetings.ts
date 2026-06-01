import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Meeting {
  id: string;
  booking_date: string;
  booking_time: string;
  meeting_type: string;
  meeting_format: string | null;
  meeting_link: string | null;
  status: string;
  vendor_rsvp: string | null;
  vendor_notes: string | null;
  admin_notes: string | null;
  customer_notes: string | null;
  couple_name: string;
  event_date: string | null;
}

export function useMeetings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["meetings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, booking_date, booking_time, meeting_type, meeting_format, meeting_link, status,
          vendor_rsvp, vendor_notes, admin_notes, customer_notes,
          event:vendor_event_details_secure!bookings_wedding_id_fkey (couple_name, event_date)
        `)
        .eq("vendor_id", user!.id)
        .order("booking_date", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        ...d,
        couple_name: d.event?.couple_name ?? "—",
        event_date: d.event?.event_date,
      })) as Meeting[];
    },
  });
}

export function useRsvpMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rsvp }: { id: string; rsvp: "accepted" | "declined" }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ vendor_rsvp: rsvp, vendor_rsvp_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { rsvp }) => {
      toast.success(rsvp === "accepted" ? "Meeting accepted!" : "Meeting declined.");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (error: any) => toast.error(error?.message || "Failed to update RSVP."),
  });
}

export function useSaveMeetingNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ vendor_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notes saved!");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (error: any) => toast.error(error?.message || "Failed to save notes."),
  });
}

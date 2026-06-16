import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { invalidateAssignmentCaches } from "@/lib/query-keys";

export interface BookingRequest {
  id: string;
  vendor_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  event_date: string | null;
  event_type: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useBookingRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["booking-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as BookingRequest[];
    },
  });
}

export function useUpdateBookingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase
        .from("booking_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(`Request ${status}`);
      qc.invalidateQueries({ queryKey: ["booking-requests"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update request."),
  });
}

export function useSubmitBookingRequest() {
  return useMutation({
    mutationFn: async (req: {
      vendor_id: string;
      client_name: string;
      client_email: string;
      client_phone?: string;
      event_date?: string;
      event_type?: string;
      message?: string;
    }) => {
      const { error } = await supabase
        .from("booking_requests")
        .insert(req);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Booking request sent!"),
    onError: (e: any) => {
      if (e?.message?.includes("Rate limit")) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error("Failed to send request.");
      }
    },
  });
}

export function useCreateBooking() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: {
      couple_name: string;
      contact_email: string;
      event_date?: string;
      event_type?: string;
      venue?: string;
      guest_count?: number;
      notes?: string;
      start_time?: string;
      bride_name?: string;
      groom_name?: string;
      bride_email?: string;
      groom_email?: string;
      bride_phone?: string;
      groom_phone?: string;
      honoree_name?: string;
      primary_contact_name?: string;
      primary_contact_email?: string;
      primary_contact_phone?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("va_vendor_create_booking", {
        p_couple_name: req.couple_name,
        p_contact_email: req.contact_email,
        p_client_phone: req.bride_phone || req.primary_contact_phone || undefined,
        p_event_date: req.event_date || undefined,
        p_event_type: req.event_type || undefined,
        p_venue: req.venue || undefined,
        p_guest_count: req.guest_count || undefined,
        p_notes: req.notes || undefined,
        p_start_time: req.start_time || undefined,
        p_bride_name: req.bride_name || undefined,
        p_groom_name: req.groom_name || undefined,
        p_bride_email: req.bride_email || undefined,
        p_groom_email: req.groom_email || undefined,
        p_bride_phone: req.bride_phone || undefined,
        p_groom_phone: req.groom_phone || undefined,
        p_honoree_name: req.honoree_name || undefined,
        p_primary_contact_name: req.primary_contact_name || undefined,
        p_primary_contact_email: req.primary_contact_email || undefined,
        p_primary_contact_phone: req.primary_contact_phone || undefined,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      toast.success("Booking created!");
      invalidateAssignmentCaches(qc);
      qc.invalidateQueries({ queryKey: ["booking-requests"] });
      qc.invalidateQueries({ queryKey: ["vendor-event-history"] });
      qc.invalidateQueries({ queryKey: ["calendar-data"] });
      qc.invalidateQueries({ queryKey: ["vendor-calendar-events"] });
      qc.invalidateQueries({ queryKey: ["event-threads"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create booking."),
  });
}

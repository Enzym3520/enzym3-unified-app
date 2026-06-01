import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { queryKeys, invalidateAssignmentCaches } from "@/lib/query-keys";
import type { VendorAssignment } from "@/types";

export type { VendorAssignment };

/**
 * Fetches all assignments for the authenticated vendor.
 * Includes realtime subscription for live updates.
 */
export function useAssignments() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    supabase.getChannels().forEach((channel) => {
      if (channel.topic.startsWith("realtime:assignments-rt")) {
        supabase.removeChannel(channel);
      }
    });

    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`vendor-assignments-${user.id}-${suffix}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "event_dj_assignments",
        filter: `dj_user_id=eq.${user.id}`,
      }, () => {
        invalidateAssignmentCaches(qc);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: queryKeys.assignments.all(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("event_dj_assignments")
        .select(`*, event:vendor_event_details_secure!event_dj_assignments_event_id_fkey(*)`)
        .eq("dj_user_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as VendorAssignment[];
    },
    enabled: !!user,
  });
}

/** @deprecated Use useAssignments() instead */
export const useVendorAssignments = useAssignments;

export function useConfirmAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("event_dj_assignments")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAssignmentCaches(qc);
      toast.success("Event confirmed!");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to confirm event"),
  });
}

export function useDeclineAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, reason }: { assignmentId: string; reason: string }) => {
      const { error } = await supabase
        .from("event_dj_assignments")
        .update({ status: "declined", declined_reason: reason })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAssignmentCaches(qc);
      toast.info("Event declined");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to decline event"),
  });
}

export function useCompleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, notes }: { assignmentId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("event_dj_assignments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          completion_notes: notes,
        })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAssignmentCaches(qc);
      toast.success("Event marked as complete!");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to complete event"),
  });
}

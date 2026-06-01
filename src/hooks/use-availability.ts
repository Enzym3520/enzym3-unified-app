import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BlackoutDate {
  id: string;
  blackout_date: string;
}

export interface AvailabilityBlock {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string | null;
  is_flexible: boolean | null;
}

export function useBlackoutDates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blackout-dates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("vendor_blackout_dates")
        .select("*")
        .eq("vendor_id", user!.id)
        .order("blackout_date");
      if (error) throw error;
      return data as BlackoutDate[];
    },
  });
}

export function useAvailabilityBlocks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["availability-blocks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("vendor_availability_blocks")
        .select("*")
        .eq("vendor_id", user!.id)
        .order("start_date");
      if (error) throw error;
      return data as AvailabilityBlock[];
    },
  });
}

export function useAddBlackout() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      const { data, error } = await supabase
        .from("vendor_blackout_dates")
        .insert({ vendor_id: user!.id, blackout_date: date })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Blackout date added");
      qc.invalidateQueries({ queryKey: ["blackout-dates"] });
      qc.invalidateQueries({ queryKey: ["calendar-data"] });
      qc.invalidateQueries({ queryKey: ["vendor-calendar-events"] });
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast.error("This date is already blocked");
      } else {
        toast.error("Failed to add blackout date");
      }
    },
  });
}

export function useRemoveBlackout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_blackout_dates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Blackout date removed");
      qc.invalidateQueries({ queryKey: ["blackout-dates"] });
      qc.invalidateQueries({ queryKey: ["calendar-data"] });
      qc.invalidateQueries({ queryKey: ["vendor-calendar-events"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove blackout date"),
  });
}

export function useAddBlock() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (block: { start_date: string; end_date: string; reason: string; notes: string; is_flexible: boolean }) => {
      const { data, error } = await supabase
        .from("vendor_availability_blocks")
        .insert({ vendor_id: user!.id, created_by: user!.id, ...block })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Availability block added");
      qc.invalidateQueries({ queryKey: ["availability-blocks"] });
      qc.invalidateQueries({ queryKey: ["calendar-data"] });
      qc.invalidateQueries({ queryKey: ["vendor-calendar-events"] });
    },
    onError: (error: any) => toast.error(error?.message || "Failed to add availability block"),
  });
}

export function useRemoveBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_availability_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Availability block removed");
      qc.invalidateQueries({ queryKey: ["availability-blocks"] });
      qc.invalidateQueries({ queryKey: ["calendar-data"] });
      qc.invalidateQueries({ queryKey: ["vendor-calendar-events"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove availability block"),
  });
}

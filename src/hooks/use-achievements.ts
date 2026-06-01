import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/query-keys";
import type { Achievement } from "@/types";
export type { Achievement };
export { ACHIEVEMENT_ICONS, ACHIEVEMENT_COLORS } from "@/types";

/**
 * Fetches achievements for a given vendor.
 * Defaults to the authenticated user if no vendorId is provided.
 */
export function useAchievements(vendorId?: string) {
  const { user } = useAuth();
  const id = vendorId ?? user?.id;

  return useQuery({
    queryKey: queryKeys.achievements.all(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_achievements")
        .select("id, achievement_name, achievement_type, description, earned_at, year")
        .eq("vendor_id", id!)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Achievement[];
    },
  });
}

/** @deprecated Use useAchievements(vendorId) instead */
export const useVendorAchievements = useAchievements;

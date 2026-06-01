import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VendorReview {
  id: string;
  vendor_id: string;
  assignment_id: string;
  reviewer_id: string;
  rating: number;
  professionalism_rating: number | null;
  punctuality_rating: number | null;
  communication_rating: number | null;
  quality_rating: number | null;
  would_hire_again: boolean;
  review_text: string | null;
  reviewed_at: string;
}

export function useVendorReviews(vendorId: string | undefined) {
  return useQuery({
    queryKey: ["vendor-reviews", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_reviews")
        .select(`
          *,
          assignment:event_dj_assignments(
            event:vendor_event_details_secure!event_dj_assignments_event_id_fkey(couple_name, event_date, event_type, venue)
          ),
          reviewer:profiles!vendor_reviews_reviewer_id_fkey(first_name, last_name)
        `)
        .eq("vendor_id", vendorId)
        .order("reviewed_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });
}

export function useVendorPerformance(vendorId: string | undefined) {
  return useQuery({
    queryKey: ["vendor-performance", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("average_rating, total_reviews, events_completed")
        .eq("id", vendorId!)
        .single();
      if (error) throw error;
      return {
        average_rating: profile.average_rating || 0,
        total_reviews: profile.total_reviews || 0,
        events_completed: profile.events_completed || 0,
      };
    },
  });
}

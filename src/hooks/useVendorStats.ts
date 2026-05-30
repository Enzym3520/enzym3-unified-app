import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorStats {
  id: string;
  vendor_id: string;
  total_events: number;
  total_weddings: number;
  total_corporate: number;
  total_quinces: number;
  total_birthdays: number;
  total_other: number;
  perfect_5star_count: number;
  five_star_count: number;
  decline_count: number;
  avg_confirmation_hours: number;
  confirmation_count: number;
  current_event_streak: number;
  longest_event_streak: number;
  current_5star_streak: number;
  longest_5star_streak: number;
  first_event_date: string | null;
  last_event_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useVendorStats(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-stats', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;

      const { data, error } = await supabase
        .from('vendor_stats')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (error) throw error;
      return data as VendorStats | null;
    },
    enabled: !!vendorId,
  });
}

export function useVendorStatsWithProfile(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-stats-with-profile', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;

      // Fetch stats and profile in parallel
      const [statsResult, profileResult] = await Promise.all([
        supabase
          .from('vendor_stats')
          .select('*')
          .eq('vendor_id', vendorId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('first_name, last_name, company_name, average_rating, total_reviews, events_completed')
          .eq('id', vendorId)
          .maybeSingle(),
      ]);

      if (statsResult.error) throw statsResult.error;
      if (profileResult.error) throw profileResult.error;

      return {
        stats: statsResult.data as VendorStats | null,
        profile: profileResult.data,
      };
    },
    enabled: !!vendorId,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LeaderboardMetric = 'events' | 'rating' | 'streak' | 'reviews';

interface LeaderboardEntry {
  vendor_id: string;
  vendor_name: string;
  company_name: string | null;
  value: number;
  rank: number;
}

export function useLeaderboard(metric: LeaderboardMetric, limit = 10) {
  return useQuery({
    queryKey: ['vendor-leaderboard', metric, limit],
    queryFn: async () => {
      // Get stats with profile info
      const { data: statsData, error: statsError } = await supabase
        .from('vendor_stats')
        .select(`
          vendor_id,
          total_events,
          current_event_streak,
          longest_event_streak,
          five_star_count,
          vendor:profiles!vendor_id(
            first_name,
            last_name,
            company_name,
            average_rating,
            total_reviews
          )
        `)
        .order(
          metric === 'events' ? 'total_events' :
          metric === 'streak' ? 'current_event_streak' :
          'total_events', // Default
          { ascending: false }
        )
        .limit(limit * 2); // Fetch more to filter

      if (statsError) throw statsError;

      // Map and rank
      const entries: LeaderboardEntry[] = (statsData || [])
        .filter((s) => s.vendor)
        .map((s) => {
          const vendor = s.vendor as { first_name?: string; last_name?: string; company_name?: string; average_rating?: number; total_reviews?: number };
          let value: number;
          
          switch (metric) {
            case 'events':
              value = s.total_events;
              break;
            case 'rating':
              value = vendor.average_rating || 0;
              break;
            case 'streak':
              value = s.current_event_streak;
              break;
            case 'reviews':
              value = vendor.total_reviews || 0;
              break;
            default:
              value = s.total_events;
          }

          return {
            vendor_id: s.vendor_id,
            vendor_name: [vendor.first_name, vendor.last_name].filter(Boolean).join(' ') || 'Unknown',
            company_name: vendor.company_name || null,
            value,
            rank: 0,
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return entries;
    },
  });
}

export function useTopVendorsByEvents(limit = 10) {
  return useLeaderboard('events', limit);
}

export function useTopVendorsByRating(limit = 10) {
  return useLeaderboard('rating', limit);
}

export function useTopVendorsByStreak(limit = 10) {
  return useLeaderboard('streak', limit);
}

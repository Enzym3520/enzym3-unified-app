import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorAchievement {
  id: string;
  vendor_id: string;
  achievement_type: string;
  achievement_name: string;
  description: string | null;
  earned_at: string;
  year: number | null;
  metadata: Record<string, unknown>;
}

export const ACHIEVEMENT_ICONS: Record<string, string> = {
  rookie_rising: '🌟',
  club_10: '🎯',
  quarter_century: '🏅',
  half_century: '🏆',
  century_club: '💯',
  five_star_general: '⭐',
  iron_man: '🔥',
  perfect_season: '👑',
  fan_favorite: '❤️',
  quick_draw: '⚡',
  mvp: '🏆',
  most_improved: '📈',
  rookie_of_year: '🌱',
  workhorse: '💪',
};

export const ACHIEVEMENT_COLORS: Record<string, string> = {
  rookie_rising: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  club_10: 'bg-green-500/20 text-green-400 border-green-500/30',
  quarter_century: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  half_century: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  century_club: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
  five_star_general: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  iron_man: 'bg-red-500/20 text-red-400 border-red-500/30',
  perfect_season: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
  fan_favorite: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  quick_draw: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export function useVendorAchievements(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-achievements', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];

      const { data, error } = await supabase
        .from('vendor_achievements')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('earned_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as VendorAchievement[];
    },
    enabled: !!vendorId,
  });
}

export function useRecentAchievements(limit = 10) {
  return useQuery({
    queryKey: ['recent-achievements', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_achievements')
        .select(`
          *,
          vendor:profiles!vendor_id(first_name, last_name, company_name)
        `)
        .order('earned_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

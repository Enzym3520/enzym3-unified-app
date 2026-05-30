import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UpgradeOrder } from '@/types/upgradeOrder';

export const useContactUpgrades = (weddingId?: string) => {
  return useQuery({
    queryKey: ['contact-upgrades', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];

      const { data, error } = await supabase
        .from('upgrade_orders')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as UpgradeOrder[];
    },
    enabled: !!weddingId,
    staleTime: 5 * 60 * 1000,
  });
};

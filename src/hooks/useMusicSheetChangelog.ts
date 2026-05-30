import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MusicSheetChange {
  id: string;
  music_sheet_id: string;
  wedding_id: string;
  changed_by: string | null;
  change_type: 'created' | 'updated';
  changes_summary: Record<string, any>;
  created_at: string;
}

export const useMusicSheetChangelog = (changeLogId?: string) => {
  return useQuery({
    queryKey: ['music-sheet-changelog', changeLogId],
    queryFn: async () => {
      if (!changeLogId) return null;

      const { data, error } = await supabase
        .from('music_sheet_changes')
        .select('*')
        .eq('id', changeLogId)
        .maybeSingle();

      if (error) throw error;
      return data as MusicSheetChange;
    },
    enabled: !!changeLogId,
  });
};

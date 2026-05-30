import React, { useEffect } from 'react';
import { Music, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContactMusicSheet } from '@/hooks/useContactMusicSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface EventMusicSummaryProps {
  weddingId: string;
}

export const EventMusicSummary: React.FC<EventMusicSummaryProps> = ({ weddingId }) => {
  const { data: musicSheet, isLoading } = useContactMusicSheet(weddingId);
  const { isAdmin, isModerator } = useUserRole();
  const queryClient = useQueryClient();

  // Realtime subscription: refresh when the couple submits or updates from Vibe Planner
  useEffect(() => {
    if (!weddingId) return;
    const channel = supabase
      .channel(`music-sheet-${weddingId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vibe_sheets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['contact-music-sheet', weddingId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'music_sheets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['contact-music-sheet', weddingId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [weddingId, queryClient]);

  if (isLoading) return <Card><CardContent className="py-6"><Skeleton className="h-20" /></CardContent></Card>;

  if (!musicSheet) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Music className="w-4 h-4" /> Music Sheet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">No music sheet on file yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                The couple has not submitted their music selections in the Vibe Planner.
                This page will update automatically when they do.
              </p>
            </div>
          </div>
          {(isAdmin || isModerator) && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">Diagnostics (admin)</summary>
              <div className="mt-2 p-2 rounded bg-muted font-mono break-all">
                wedding_id: {weddingId}
              </div>
              <p className="mt-1">
                If the couple says they submitted, cross-check this id in the Vibe Planner's <code>music_sheets</code> table.
              </p>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  const songs = [
    { label: 'First Dance', value: musicSheet.first_dance },
    { label: 'Last Dance', value: musicSheet.last_dance },
    { label: 'Grand Entrance', value: musicSheet.grand_entrance },
    { label: 'Processional', value: musicSheet.processional },
    { label: 'Bride Entrance', value: musicSheet.bride_entrance },
    { label: 'Recessional', value: musicSheet.recessional },
  ].filter(s => s.value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Music className="w-4 h-4" /> Music Sheet
          </CardTitle>
          <Badge variant="secondary">Submitted</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {songs.map((s) => (
            <div key={s.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium truncate ml-4 max-w-[60%] text-right">{s.value}</span>
            </div>
          ))}
          {(musicSheet.extra_songs?.length ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              + {musicSheet.extra_songs!.length} extra song{musicSheet.extra_songs!.length > 1 ? 's' : ''}
            </p>
          )}
          {(musicSheet.music_preferences?.length ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              {musicSheet.music_preferences!.filter(p => p.type === 'must_play').length} must-play,{' '}
              {musicSheet.music_preferences!.filter(p => p.type === 'do_not_play').length} do-not-play
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCalendarRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`calendar-realtime-${suffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_notification_history' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
        }
      )
      .subscribe((status, err) => {
        if (import.meta.env.DEV && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
          console.warn('Calendar realtime channel error:', status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

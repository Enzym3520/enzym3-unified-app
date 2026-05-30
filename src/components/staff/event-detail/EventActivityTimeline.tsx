import React from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { safeFormatDate } from '@/utils/dateHelpers';
import { Skeleton } from '@/components/ui/skeleton';

interface EventActivityTimelineProps {
  weddingId: string;
}

export const EventActivityTimeline: React.FC<EventActivityTimelineProps> = ({ weddingId }) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['action-logs', weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_logs')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('logged_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!weddingId,
  });

  if (isLoading) return <Card><CardContent className="py-6"><Skeleton className="h-20" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" /> Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!logs || logs.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">No activity recorded</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium capitalize">{log.step.replace(/_/g, ' ')}</p>
                  {log.user_name && (
                    <p className="text-xs text-muted-foreground">by {log.user_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {safeFormatDate(log.logged_at, 'MMM d, h:mm a', '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

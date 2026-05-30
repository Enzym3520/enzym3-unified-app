import React from 'react';
import { CalendarDays, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { safeFormatDate } from '@/utils/dateHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranscriptionCheck } from '@/hooks/useMeetingTranscription';

interface EventMeetingsSectionProps {
  weddingId: string;
}

export const EventMeetingsSection: React.FC<EventMeetingsSectionProps> = ({ weddingId }) => {
  const { data: meetings, isLoading } = useQuery({
    queryKey: ['event-meetings', weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('booking_date', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!weddingId,
  });

  if (isLoading) return <Card><CardContent className="py-6"><Skeleton className="h-20" /></CardContent></Card>;

  const bookingIds = (meetings || []).map((m: any) => m.id);

  return <EventMeetingsContent meetings={meetings || []} />;
};

function EventMeetingsContent({ meetings }: { meetings: any[] }) {
  const bookingIds = meetings.map((m) => m.id);
  const { data: transcribedIds } = useTranscriptionCheck(bookingIds);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4" /> Meetings & Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No meetings scheduled</p>
        ) : (
          <div className="space-y-2">
            {meetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm border rounded-lg p-2.5">
                <div>
                  <p className="font-medium capitalize">{m.meeting_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {safeFormatDate(m.booking_date, 'MMM d, yyyy', '')} at {m.booking_time}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {transcribedIds?.has(m.id) && (
                    <span title="Has transcription"><FileText className="h-3.5 w-3.5 text-primary" /></span>
                  )}
                  <Badge variant="outline" className="capitalize">{m.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

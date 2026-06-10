import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEventHistory } from '@/hooks/use-event-history';
import { useBookingRequests } from '@/hooks/use-booking-requests';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Music, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { parseEventDate } from '@/utils/vendorHelpers';

export default function LiveRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: assignedEvents = [], isLoading: loadingAssigned } = useEventHistory();
  const { data: bookingRequests = [], isLoading: loadingBookings } = useBookingRequests();

  const today = new Date().toISOString().split('T')[0];

  // Merge upcoming events from both sources
  const upcomingEvents = [
    ...assignedEvents
      .filter(e => e.event_date && e.event_date >= today && e.status !== 'declined')
      .map(e => ({ id: e.event_id, name: e.couple_name, date: e.event_date, type: e.event_type })),
    ...bookingRequests
      .filter(b => b.event_date && b.event_date >= today && b.status !== 'declined')
      .map(b => ({ id: b.id, name: b.client_name ?? 'Event', date: b.event_date, type: b.event_type })),
  ].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

  // Load all live sessions for this vendor
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['vendor-live-sessions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('live_sessions')
        .select('id, event_id, status, short_code, started_at')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  const sessionByEvent = sessions.reduce<Record<string, typeof sessions[0]>>((acc, s) => {
    if (!acc[s.event_id]) acc[s.event_id] = s;
    return acc;
  }, {});

  const isLoading = loadingAssigned || loadingBookings || loadingSessions;

  const liveNow = upcomingEvents.filter(e => sessionByEvent[e.id]?.status === 'live');
  const rest = upcomingEvents.filter(e => sessionByEvent[e.id]?.status !== 'live');

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Radio className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Live Song Requests</h1>
          <p className="text-sm text-muted-foreground">Open the console for any upcoming event</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && upcomingEvents.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <Music className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground text-sm">No upcoming events found.</p>
        </div>
      )}

      {!isLoading && liveNow.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-green-500 uppercase tracking-wider">Live now</p>
          {liveNow.map(event => (
            <EventRow
              key={event.id}
              event={event}
              session={sessionByEvent[event.id]}
              onOpen={() => navigate(`/vendor/live/${event.id}`)}
            />
          ))}
        </div>
      )}

      {!isLoading && rest.length > 0 && (
        <div className="space-y-2">
          {liveNow.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming</p>
          )}
          {rest.map(event => (
            <EventRow
              key={event.id}
              event={event}
              session={sessionByEvent[event.id]}
              onOpen={() => navigate(`/vendor/live/${event.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({
  event,
  session,
  onOpen,
}: {
  event: { id: string; name: string; date: string | null; type: string | null };
  session?: { status: string; short_code: string } | undefined;
  onOpen: () => void;
}) {
  const isLive = session?.status === 'live';
  const isDraft = session?.status === 'draft';

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <div className="rounded-lg bg-muted p-2 flex-shrink-0">
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{event.name}</p>
        <p className="text-xs text-muted-foreground">
          {event.date ? format(parseEventDate(event.date), 'MMM d, yyyy') : 'Date TBD'}
          {event.type ? ` · ${event.type}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isLive && (
          <Badge className="bg-green-500 text-white gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Live
          </Badge>
        )}
        {isDraft && (
          <Badge variant="secondary">Ready</Badge>
        )}
        <Button size="sm" variant={isLive ? 'default' : 'outline'} onClick={onOpen} className="gap-1.5">
          <Radio className="h-3.5 w-3.5" />
          {isLive ? 'Open Console' : 'Go Live'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

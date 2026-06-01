import { MapPin, Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import type { VendorCalendarEvent } from '@/hooks/use-vendor-calendar-events';
import { getEventTypeIcon, buildCalendarColorClasses, getEventCalendarColor, capitalizeNames, parseEventDate } from '@/utils/vendorHelpers';
import { format } from 'date-fns';

interface VendorCalendarEventCardProps {
  event: VendorCalendarEvent;
  onViewDetails: () => void;
  compact?: boolean;
}

const getEventTypeColor = (eventType: string) => buildCalendarColorClasses(getEventCalendarColor(eventType));

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'assigned':
      return { label: 'Needs Confirmation', variant: 'default' as const, icon: Clock };
    case 'confirmed':
      return { label: 'Confirmed', variant: 'secondary' as const, icon: CheckCircle2 };
    case 'completed':
      return { label: 'Completed', variant: 'outline' as const, icon: CheckCircle2 };
    case 'declined':
      return { label: 'Declined', variant: 'destructive' as const, icon: XCircle };
    default:
      return { label: status, variant: 'outline' as const, icon: Clock };
  }
};

function VendorEventHoverContent({ event }: { event: VendorCalendarEvent }) {
  const statusBadge = getStatusBadge(event.assignment_status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{getEventTypeIcon(event.event_type)}</span>
        <h4 className="font-semibold text-sm">{capitalizeNames(event.couple_name || 'Unknown Client')}</h4>
      </div>
      <Badge variant={statusBadge.variant} className="gap-1 text-xs">
        <StatusIcon className="h-3 w-3" />
        {statusBadge.label}
      </Badge>
      {event.venue && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{event.venue}</span>
        </div>
      )}
      {event.guest_count && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{event.guest_count} guests</span>
        </div>
      )}
      {event.start_time && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{format(new Date(`2000-01-01T${event.start_time}`), 'h:mm a')}{event.hours_booked ? ` · ${event.hours_booked}h` : ''}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{format(parseEventDate(event.event_date), 'PPP')}</span>
      </div>
    </div>
  );
}

export function VendorCalendarEventCard({ event, onViewDetails, compact = false }: VendorCalendarEventCardProps) {
  const colors = getEventTypeColor(event.event_type);
  const statusBadge = getStatusBadge(event.assignment_status);
  const StatusIcon = statusBadge.icon;
  const needsConfirmation = event.assignment_status === 'assigned';

  if (compact) {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
            className={cn(
              "w-full text-left px-2 py-1 rounded-md text-xs font-medium truncate transition-colors cursor-pointer",
              colors.bg, colors.text, colors.hover,
              needsConfirmation && 'opacity-60'
            )}
          >
            {event.couple_name}
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="right" className="w-64">
          <VendorEventHoverContent event={event} />
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <div
      className={cn(
        "w-full p-4 rounded-lg border bg-card hover:shadow-md transition-all",
        needsConfirmation && 'border-amber-200 bg-amber-50/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-1.5 self-stretch rounded-full flex-shrink-0", colors.bg)} />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{getEventTypeIcon(event.event_type)}</span>
                <h4 className="font-semibold">{event.couple_name}</h4>
              </div>
              <Badge variant={statusBadge.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusBadge.label}
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            {event.venue && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            )}
            {event.guest_count && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{event.guest_count} guests</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{format(parseEventDate(event.event_date), 'PPP')}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onViewDetails} className="w-full">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

import { MapPin, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import { getEventTypeIcon, formatEventType, buildCalendarColorClasses, getEventCalendarColor } from '@/utils/notificationHelpers';
import { capitalizeNames } from '@/utils/contactHelpers';
import { formatVendorType } from '@/utils/vendorTypeFormatter';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';

interface CalendarEventCardProps {
  event: CalendarEvent;
  onClick: () => void;
  compact?: boolean;
}

const getEventTypeColor = (eventType: string) => buildCalendarColorClasses(getEventCalendarColor(eventType));

const getStatusColor = (event: CalendarEvent) => {
  const hasVendors = event.assigned_vendors.length > 0;
  const allConfirmed = event.assigned_vendors.every(v => v.status === 'confirmed');
  const hasPending = event.assigned_vendors.some(v => v.status === 'pending');

  if (!hasVendors) return 'text-destructive';
  if (allConfirmed) return 'text-green-600';
  if (hasPending) return 'text-amber-600';
  return 'text-muted-foreground';
};

function EventHoverContent({ event }: { event: CalendarEvent }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{getEventTypeIcon(event.event_type)}</span>
        <h4 className="font-semibold text-sm">{capitalizeNames(event.couple_name || 'Unknown')}</h4>
      </div>
      <Badge variant="secondary" className="text-xs">{formatEventType(event.event_type)}</Badge>
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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{format(parseLocalDate(event.event_date), 'PPP')}</span>
      </div>
      {event.assigned_vendors.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {event.assigned_vendors.map((vendor) => (
            <Badge key={vendor.id} variant="outline" className="text-[10px]">
              {formatVendorType(vendor.vendor_type)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function CalendarEventCard({ event, onClick, compact = false }: CalendarEventCardProps) {
  const colors = getEventTypeColor(event.event_type);
  const statusColor = getStatusColor(event);
  const needsConfirmation = event.assigned_vendors.some(v => v.status === 'pending') || event.assigned_vendors.length === 0;

  if (compact) {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={cn(
              "w-full text-left px-2 py-1 rounded-md text-xs font-medium truncate transition-colors cursor-pointer",
              colors.bg, colors.text, colors.hover,
              needsConfirmation && 'opacity-60'
            )}
          >
            {capitalizeNames(event.couple_name || 'Unknown')}
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="right" className="w-64">
          <EventHoverContent event={event} />
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "w-full text-left p-3 rounded-lg border bg-card hover:shadow-md transition-all group",
        "cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-1.5 self-stretch rounded-full flex-shrink-0", colors.bg)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold">{getEventTypeIcon(event.event_type)}</span>
            <h4 className="font-medium truncate">{capitalizeNames(event.couple_name || 'Unknown')}</h4>
            <Badge variant="secondary" className={cn("ml-auto", statusColor)}>
              {event.assigned_vendors.length} vendor{event.assigned_vendors.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-1">
            {event.venue && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{event.venue}</span>
              </div>
            )}
            {event.guest_count && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{event.guest_count} guests</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(parseLocalDate(event.event_date), 'PPP')}</span>
            </div>
          </div>

          {event.assigned_vendors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
          {event.assigned_vendors.map((vendor) => (
            <Badge key={vendor.id} variant="outline" className="text-[10px]">
              {formatVendorType(vendor.vendor_type)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

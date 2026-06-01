import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseEventDate } from '@/utils/vendorHelpers';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VendorCalendarEventCard } from './VendorCalendarEventCard';
import type { VendorCalendarEvent, VendorAvailabilityBlock } from '@/hooks/use-vendor-calendar-events';
import { format, isSameDay, addDays, subDays, parseISO, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface VendorCalendarDayViewProps {
  events: VendorCalendarEvent[];
  blocks: VendorAvailabilityBlock[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewEvent: (event: VendorCalendarEvent) => void;
}

export function VendorCalendarDayView({ events, blocks, currentDate, onDateChange, onViewEvent }: VendorCalendarDayViewProps) {
  const dayEvents = events.filter((e) => isSameDay(parseEventDate(e.event_date), currentDate));
  const block = blocks.find((b) => isWithinInterval(currentDate, { start: parseISO(b.start_date), end: parseISO(b.end_date) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Pick Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => onDateChange(subDays(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDateChange(addDays(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {block && (
        <div className={cn(
          "rounded-lg border p-3 text-sm",
          block.is_flexible ? 'bg-amber-500/5 border-amber-200 text-amber-700' : 'bg-destructive/5 border-destructive/20 text-destructive'
        )}>
          {block.is_flexible ? '⚠️ Flexible block' : '🚫 Hard block'}: {block.reason}
          {block.notes && <span className="block text-xs mt-1 opacity-75">{block.notes}</span>}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        {dayEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">No events scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">This day is currently free</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{dayEvents.length} Event{dayEvents.length !== 1 ? 's' : ''}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dayEvents.map((event) => (
                <VendorCalendarEventCard
                  key={event.id}
                  event={event}
                  onViewDetails={() => onViewEvent(event)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

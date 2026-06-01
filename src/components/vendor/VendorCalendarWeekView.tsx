import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseEventDate } from '@/utils/vendorHelpers';
import { VendorCalendarEventCard } from './VendorCalendarEventCard';
import type { VendorCalendarEvent, VendorAvailabilityBlock } from '@/hooks/use-vendor-calendar-events';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isToday, addWeeks, subWeeks, parseISO, isWithinInterval,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface VendorCalendarWeekViewProps {
  events: VendorCalendarEvent[];
  blocks: VendorAvailabilityBlock[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewEvent: (event: VendorCalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

export function VendorCalendarWeekView({ events, blocks, currentDate, onDateChange, onViewEvent, onDayClick }: VendorCalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day: Date) => events.filter((e) => isSameDay(parseEventDate(e.event_date), day));
  const isBlackoutDay = (day: Date) => blocks.some((b) => isWithinInterval(day, { start: parseISO(b.start_date), end: parseISO(b.end_date) }));
  const getBlockForDay = (day: Date) => blocks.find((b) => isWithinInterval(day, { start: parseISO(b.start_date), end: parseISO(b.end_date) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => onDateChange(subWeeks(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDateChange(addWeeks(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isDayToday = isToday(day);
          const isBlocked = isBlackoutDay(day);
          const block = getBlockForDay(day);

          return (
            <div key={day.toISOString()} className="space-y-2">
              <button
                onClick={() => onDayClick(day)}
                className={cn(
                  'w-full text-center p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors',
                  isDayToday && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  isBlocked && !block?.is_flexible && 'bg-destructive/5',
                  isBlocked && block?.is_flexible && 'bg-amber-500/5'
                )}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-2xl font-bold">{format(day, 'd')}</div>
              </button>

              <div className="space-y-2 min-h-[200px]">
                {dayEvents.map((event) => (
                  <VendorCalendarEventCard
                    key={event.id}
                    event={event}
                    onViewDetails={() => onViewEvent(event)}
                  />
                ))}
                {dayEvents.length === 0 && !isBlocked && (
                  <div className="text-sm text-muted-foreground text-center py-4">No events</div>
                )}
                {isBlocked && block && dayEvents.length === 0 && (
                  <div className={cn(
                    "text-xs text-center py-4 rounded",
                    block.is_flexible ? 'text-amber-600' : 'text-destructive'
                  )}>
                    {block.is_flexible ? 'Flexible block' : 'Blocked'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

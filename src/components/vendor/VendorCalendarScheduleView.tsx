import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { parseEventDate } from '@/utils/vendorHelpers';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VendorCalendarEventCard } from './VendorCalendarEventCard';
import type { VendorCalendarEvent, VendorAvailabilityBlock } from '@/hooks/use-vendor-calendar-events';
import { format, isSameDay, addDays, subDays, parseISO, isToday, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface VendorCalendarScheduleViewProps {
  events: VendorCalendarEvent[];
  blocks: VendorAvailabilityBlock[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewEvent: (event: VendorCalendarEvent) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

export function VendorCalendarScheduleView({ events, blocks, currentDate, onDateChange, onViewEvent }: VendorCalendarScheduleViewProps) {
  const dayEvents = events.filter((e) => isSameDay(parseEventDate(e.event_date), currentDate));
  const block = blocks.find((b) => isWithinInterval(currentDate, { start: parseISO(b.start_date), end: parseISO(b.end_date) }));
  const timelineRef = useRef<HTMLDivElement>(null);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const showTimeLine = isToday(currentDate) && currentHour >= 6 && currentHour <= 23;

  useEffect(() => {
    if (showTimeLine && timelineRef.current) {
      timelineRef.current.scrollTop = Math.max(0, (currentHour - 6) * 64 - 100);
    }
  }, [showTimeLine, currentHour]);

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

      {dayEvents.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Day</div>
          <div className="flex flex-wrap gap-2">
            {dayEvents.map((event) => (
              <VendorCalendarEventCard
                key={event.id}
                event={event}
                onViewDetails={() => onViewEvent(event)}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {block && (
        <div className={cn(
          "rounded-lg border p-3 text-sm",
          block.is_flexible ? 'bg-amber-500/5 border-amber-200 text-amber-700' : 'bg-destructive/5 border-destructive/20 text-destructive'
        )}>
          {block.is_flexible ? '⚠️ Flexible block' : '🚫 Hard block'}: {block.reason}
        </div>
      )}

      <div ref={timelineRef} className="rounded-lg border bg-card overflow-y-auto max-h-[600px] relative">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className={cn(
              "flex border-b border-border/50 min-h-[64px]",
              block && !block.is_flexible && 'bg-destructive/5',
              block && block.is_flexible && 'bg-amber-500/5'
            )}
          >
            <div className="w-20 flex-shrink-0 py-2 px-3 text-xs text-muted-foreground font-medium border-r border-border/50 bg-muted/20">
              {format(new Date(2000, 0, 1, hour), 'h a')}
            </div>
            <div className="flex-1" />
          </div>
        ))}

        {showTimeLine && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ top: `${(currentHour - 6) * 64 + (currentMinute / 60) * 64}px` }}
          >
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
              <div className="flex-1 h-0.5 bg-destructive" />
            </div>
          </div>
        )}
      </div>

      {dayEvents.length === 0 && !block && (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No events scheduled</p>
        </div>
      )}
    </div>
  );
}

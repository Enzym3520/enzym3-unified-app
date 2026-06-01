import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { parseEventDate } from '@/utils/vendorHelpers';
import { ChevronLeft, ChevronRight, AlertCircle, Grid3x3, Layout, List, Clock } from 'lucide-react';
import { useVendorCalendarEvents, useVendorCalendarStats } from '@/hooks/use-vendor-calendar-events';
import { VendorCalendarEventCard } from './VendorCalendarEventCard';
import { VendorCalendarWeekView } from './VendorCalendarWeekView';
import { VendorCalendarDayView } from './VendorCalendarDayView';
import { VendorCalendarScheduleView } from './VendorCalendarScheduleView';
import { VendorEventDetails } from './VendorEventDetails';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths,
  isWithinInterval, parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { VendorCalendarEvent } from '@/hooks/use-vendor-calendar-events';
import { useAuth } from '@/contexts/AuthContext';

type ViewType = 'month' | 'week' | 'day' | 'schedule';

export function VendorCalendarView() {
  const { user } = useAuth();
  const vendorId = user?.id;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data, isLoading } = useVendorCalendarEvents(vendorId, currentDate, viewType);
  const { data: stats } = useVendorCalendarStats(vendorId, currentDate);

  const { data: fullAssignment } = useQuery({
    queryKey: ['vendor-assignment-detail', selectedAssignment?.id],
    queryFn: async () => {
      if (!selectedAssignment) return null;
      const { data, error } = await supabase
        .from('event_dj_assignments')
        .select(`*, event:vendor_event_details_secure!event_dj_assignments_event_id_fkey(*)`)
        .eq('id', selectedAssignment.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedAssignment && isDetailModalOpen,
  });

  const handleViewEvent = (event: VendorCalendarEvent) => {
    setSelectedAssignment(event);
    setIsDetailModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewType('day');
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => data?.events.filter((e) => isSameDay(parseEventDate(e.event_date), day)) || [];
  const isBlackoutDay = (day: Date) => data?.blocks.some((b) => isWithinInterval(day, { start: parseISO(b.start_date), end: parseISO(b.end_date) })) || false;
  const getBlockForDay = (day: Date) => data?.blocks.find((b) => isWithinInterval(day, { start: parseISO(b.start_date), end: parseISO(b.end_date) }));

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">My Calendar</h2>
            {stats && (
              <div className="flex gap-2">
                <Badge variant="secondary" className="gap-1">
                  {stats.eventsThisMonth} this month
                </Badge>
                {stats.needingConfirmation > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {stats.needingConfirmation} pending
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center">
            {viewType === 'month' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-1 border rounded-md p-1">
              <Button variant={viewType === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewType('month')} className="gap-1.5">
                <Grid3x3 className="h-4 w-4" />
                <span className="hidden sm:inline">Month</span>
              </Button>
              <Button variant={viewType === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewType('week')} className="gap-1.5">
                <Layout className="h-4 w-4" />
                <span className="hidden sm:inline">Week</span>
              </Button>
              <Button variant={viewType === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewType('day')} className="gap-1.5">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Day</span>
              </Button>
              <Button variant={viewType === 'schedule' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewType('schedule')} className="gap-1.5">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            {viewType === 'month' && (
              <>
                <div className="mb-2">
                  <h3 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
                </div>

                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}

                  {days.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isDayToday = isToday(day);
                    const isBlocked = isBlackoutDay(day);
                    const block = getBlockForDay(day);

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          'bg-card min-h-[140px] p-2 relative cursor-pointer hover:bg-accent/30 transition-colors',
                          !isCurrentMonth && 'bg-muted/30 text-muted-foreground opacity-50',
                          isBlocked && !block?.is_flexible && 'bg-destructive/5',
                          isBlocked && block?.is_flexible && 'bg-amber-500/5'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            'text-sm font-medium',
                            isDayToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                          )}>
                            {format(day, 'd')}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-xs text-muted-foreground">{dayEvents.length}</span>
                          )}
                        </div>

                        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                          {dayEvents.slice(0, 2).map((event) => (
                            <VendorCalendarEventCard
                              key={event.id}
                              event={event}
                              onViewDetails={() => handleViewEvent(event)}
                              compact
                            />
                          ))}
                          {dayEvents.length > 2 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="text-xs text-primary font-medium text-center py-1 w-full hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  +{dayEvents.length - 2} more
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0" onClick={(e) => e.stopPropagation()}>
                                <div className="px-3 py-2 border-b">
                                  <p className="font-semibold text-sm">{format(day, 'EEEE, MMMM d')}</p>
                                  <p className="text-xs text-muted-foreground">{dayEvents.length} events</p>
                                </div>
                                <ScrollArea className="max-h-64">
                                  <div className="p-2 space-y-1">
                                    {dayEvents.map((event) => (
                                      <VendorCalendarEventCard
                                        key={event.id}
                                        event={event}
                                        onViewDetails={() => handleViewEvent(event)}
                                        compact
                                      />
                                    ))}
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        {isBlocked && block && !block.is_flexible && dayEvents.length === 0 && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-destructive/5">
                            <span className="text-xs text-destructive font-medium">Blocked</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/20" />
                    <span>Blocked (Hard)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500/10 border border-amber-200" />
                    <span>Blocked (Flexible)</span>
                  </div>
                </div>
              </>
            )}

            {viewType === 'week' && (
              <VendorCalendarWeekView
                events={data?.events || []}
                blocks={data?.blocks || []}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onViewEvent={handleViewEvent}
                onDayClick={handleDayClick}
              />
            )}

            {viewType === 'day' && (
              <VendorCalendarDayView
                events={data?.events || []}
                blocks={data?.blocks || []}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onViewEvent={handleViewEvent}
              />
            )}

            {viewType === 'schedule' && (
              <VendorCalendarScheduleView
                events={data?.events || []}
                blocks={data?.blocks || []}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onViewEvent={handleViewEvent}
              />
            )}
          </>
        )}
      </div>

      {fullAssignment && (
        <VendorEventDetails
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          assignment={fullAssignment}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarScheduleView } from './CalendarScheduleView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { CalendarFilters } from './CalendarFilters';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCalendarRealtime } from '@/hooks/useCalendarRealtime';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getSafeErrorMessage(err: unknown): string | null {
  if (!err) return null;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const anyErr = err as any;
    if (typeof anyErr.message === 'string') return anyErr.message;
    if (typeof anyErr.error_description === 'string') return anyErr.error_description;
    if (typeof anyErr.details === 'string') return anyErr.details;
    if (typeof anyErr.hint === 'string') return anyErr.hint;
    if (typeof anyErr.code === 'string') return `Error code: ${anyErr.code}`;
  }
  return null;
}

export function EventCalendar() {
  useCalendarRealtime();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day' | 'schedule'>('month');
  const [itemType, setItemType] = useState<'all' | 'events' | 'meetings'>('all');
  const [eventType, setEventType] = useState<string>('all');
  const [meetingType, setMeetingType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, error, refetch } = useCalendarEvents(currentDate, viewType, {
    itemType,
    eventType: eventType === 'all' ? undefined : eventType,
    meetingType: meetingType === 'all' ? undefined : meetingType,
    status: status === 'all' ? undefined : status,
    search: search || undefined,
  });

  const events = data?.events || [];
  const meetings = data?.meetings || [];

  if (error) {
    const safeMessage = getSafeErrorMessage(error);
    if (import.meta.env.DEV) console.error('[Calendar] Query error:', safeMessage || error);
    return (
      <div className="space-y-6">
        <CalendarFilters
          itemType={itemType}
          onItemTypeChange={setItemType}
          eventType={eventType}
          onEventTypeChange={setEventType}
          meetingType={meetingType}
          onMeetingTypeChange={setMeetingType}
          status={status}
          onStatusChange={setStatus}
          search={search}
          onSearchChange={setSearch}
          viewType={viewType}
          onViewTypeChange={setViewType}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Calendar couldn't load data</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>There was a problem loading your calendar. Please try again.</span>
            {getSafeErrorMessage(error) && (
              <span className="text-xs opacity-75">Error: {getSafeErrorMessage(error)}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 w-fit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CalendarFilters
        itemType={itemType}
        onItemTypeChange={setItemType}
        eventType={eventType}
        onEventTypeChange={setEventType}
        meetingType={meetingType}
        onMeetingTypeChange={setMeetingType}
        status={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
        viewType={viewType}
        onViewTypeChange={setViewType}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {viewType === 'month' && (
            <CalendarMonthView
              events={events}
              meetings={meetings}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onDayClick={(date) => { setCurrentDate(date); setViewType('day'); }}
            />
          )}
          {viewType === 'week' && (
            <CalendarWeekView
              events={events}
              meetings={meetings}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          )}
          {viewType === 'day' && (
            <CalendarDayView
              events={events}
              meetings={meetings}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          )}
          {viewType === 'schedule' && (
            <CalendarScheduleView
              events={events}
              meetings={meetings}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          )}
        </>
      )}
    </div>
  );
}

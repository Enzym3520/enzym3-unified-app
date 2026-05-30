import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEventCard } from './CalendarEventCard';
import { CalendarMeetingCard } from './CalendarMeetingCard';
import { MeetingDetailModal } from './MeetingDetailModal';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import type { CalendarMeeting } from '@/types/calendarItem';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import ContactDetailsModal from '@/components/staff/contacts/ContactDetailsModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Contact } from '@/types/contact';

interface CalendarMonthViewProps {
  events: CalendarEvent[];
  meetings: CalendarMeeting[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick?: (date: Date) => void;
}

export function CalendarMonthView({ events, meetings, currentDate, onDateChange, onDayClick }: CalendarMonthViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const { data: selectedContact } = useQuery({
    queryKey: ['calendar-contact', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      
      const { data: event, error } = await supabase
        .from('event_notification_history')
        .select('*')
        .eq('id', selectedEventId)
        .maybeSingle();

      if (!event) return null;
      if (error) throw error;

      return {
        id: event.id,
        name: event.couple_name,
        email: event.contact_email,
        phone: event.contact_phone || undefined,
        eventHistory: [event],
        formSubmissions: [],
        uploadedDetailsForms: [],
        primaryEventDate: event.event_date,
        primaryEventType: event.event_type,
        totalEvents: 1,
        eventTypes: [event.event_type],
        tags: [],
        musicSheets: [],
        upgradeOrders: [],
        preferredVenues: event.venue ? [event.venue] : [],
        status: 'active',
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        lastContactDate: event.created_at,
        notes: event.notes || undefined,
        completedForms: 0,
        totalForms: 0,
        formCompletionRate: 0,
      } as Contact;
    },
    enabled: !!selectedEventId && isContactModalOpen,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(parseISO(event.event_date), day));
  };

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter((meeting) => isSameDay(parseISO(meeting.booking_date), day));
  };

  const handlePreviousMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const dayMeetings = getMeetingsForDay(day);
          const totalItems = dayEvents.length + dayMeetings.length;
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'bg-card min-h-[140px] p-2 cursor-pointer hover:bg-accent/30 transition-colors',
                !isCurrentMonth && 'bg-muted/30 text-muted-foreground opacity-50'
              )}
              onClick={() => onDayClick?.(day)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-sm font-medium', isDayToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center')}>
                  {format(day, 'd')}
                </span>
                {totalItems > 0 && <span className="text-xs text-muted-foreground">{totalItems}</span>}
              </div>

              <div className="space-y-1">
                {[...dayEvents, ...dayMeetings].slice(0, 3).map((item) =>
                  'event_date' in item ? (
                    <CalendarEventCard
                      key={item.id}
                      event={item}
                      onClick={() => { setSelectedEventId(item.id); setIsContactModalOpen(true); }}
                      compact
                    />
                  ) : (
                    <CalendarMeetingCard
                      key={item.id}
                      meeting={item}
                      onClick={() => { setSelectedMeetingId(item.id); setIsMeetingModalOpen(true); }}
                      compact
                    />
                  )
                )}
                {totalItems > 3 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="text-xs text-primary font-medium text-center py-1 w-full hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        +{totalItems - 3} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" onClick={(e) => e.stopPropagation()}>
                      <div className="px-3 py-2 border-b">
                        <p className="font-semibold text-sm">{format(day, 'EEEE, MMMM d')}</p>
                        <p className="text-xs text-muted-foreground">{totalItems} events</p>
                      </div>
                      <ScrollArea className="max-h-64">
                        <div className="p-2 space-y-1">
                          {dayEvents.map((event) => (
                            <CalendarEventCard
                              key={event.id}
                              event={event}
                              onClick={() => { setSelectedEventId(event.id); setIsContactModalOpen(true); }}
                              compact
                            />
                          ))}
                          {dayMeetings.map((meeting) => (
                            <CalendarMeetingCard
                              key={meeting.id}
                              meeting={meeting}
                              onClick={() => { setSelectedMeetingId(meeting.id); setIsMeetingModalOpen(true); }}
                              compact
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ContactDetailsModal
        contact={selectedContact || null}
        isOpen={isContactModalOpen}
        onClose={() => { setIsContactModalOpen(false); setSelectedEventId(null); }}
      />

      <MeetingDetailModal
        meetingId={selectedMeetingId}
        isOpen={isMeetingModalOpen}
        onClose={() => { setIsMeetingModalOpen(false); setSelectedMeetingId(null); }}
      />
    </div>
  );
}

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
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';
import ContactDetailsModal from '@/components/staff/contacts/ContactDetailsModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Contact } from '@/types/contact';

interface CalendarWeekViewProps {
  events: CalendarEvent[];
  meetings: CalendarMeeting[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarWeekView({ events, meetings, currentDate, onDateChange }: CalendarWeekViewProps) {
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

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day: Date) => events.filter((event) => isSameDay(parseISO(event.event_date), day));
  const getMeetingsForDay = (day: Date) => meetings.filter((meeting) => isSameDay(parseISO(meeting.booking_date), day));

  const handlePreviousWeek = () => onDateChange(subWeeks(currentDate, 1));
  const handleNextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const dayMeetings = getMeetingsForDay(day);
          const isDayToday = isToday(day);

          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className={cn('text-center p-2 rounded-lg', isDayToday && 'bg-primary text-primary-foreground')}>
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-2xl font-bold">{format(day, 'd')}</div>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {dayEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onClick={() => { setSelectedEventId(event.id); setIsContactModalOpen(true); }}
                  />
                ))}
                {dayMeetings.map((meeting) => (
                  <CalendarMeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onClick={() => { setSelectedMeetingId(meeting.id); setIsMeetingModalOpen(true); }}
                  />
                ))}
                {dayEvents.length === 0 && dayMeetings.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">No events</div>
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

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEventCard } from './CalendarEventCard';
import { CalendarMeetingCard } from './CalendarMeetingCard';
import { MeetingDetailModal } from './MeetingDetailModal';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import type { CalendarMeeting } from '@/types/calendarItem';
import { format, isSameDay, addDays, subDays, parseISO } from 'date-fns';
import ContactDetailsModal from '@/components/staff/contacts/ContactDetailsModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Contact } from '@/types/contact';

interface CalendarDayViewProps {
  events: CalendarEvent[];
  meetings: CalendarMeeting[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarDayView({ events, meetings, currentDate, onDateChange }: CalendarDayViewProps) {
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

  const dayEvents = events.filter((event) => isSameDay(parseISO(event.event_date), currentDate));
  const dayMeetings = meetings.filter((meeting) => isSameDay(parseISO(meeting.booking_date), currentDate));
  const totalItems = dayEvents.length + dayMeetings.length;

  const handlePreviousDay = () => onDateChange(subDays(currentDate, 1));
  const handleNextDay = () => onDateChange(addDays(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

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
          <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        {totalItems === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No events or meetings scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">This day is currently free</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {totalItems} Item{totalItems !== 1 ? 's' : ''}
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          </div>
        )}
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

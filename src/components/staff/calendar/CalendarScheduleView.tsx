import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarEventCard } from './CalendarEventCard';
import { CalendarMeetingCard } from './CalendarMeetingCard';
import { MeetingDetailModal } from './MeetingDetailModal';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import type { CalendarMeeting } from '@/types/calendarItem';
import { format, isSameDay, addDays, subDays, parseISO, isToday } from 'date-fns';
import ContactDetailsModal from '@/components/staff/contacts/ContactDetailsModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Contact } from '@/types/contact';

interface CalendarScheduleViewProps {
  events: CalendarEvent[];
  meetings: CalendarMeeting[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

function parseTimeToHour(timeStr: string): number {
  const [h] = timeStr.split(':').map(Number);
  return h;
}

export function CalendarScheduleView({ events, meetings, currentDate, onDateChange }: CalendarScheduleViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const { data: selectedContact } = useQuery({
    queryKey: ['calendar-contact', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      const { data: event, error } = await supabase
        .from('event_notification_history')
        .select('*')
        .eq('id', selectedEventId)
        .maybeSingle();
      if (error) throw error;
      if (!event) return null;
      return {
        id: event.id, name: event.couple_name, email: event.contact_email,
        phone: event.contact_phone || undefined, eventHistory: [event],
        formSubmissions: [], uploadedDetailsForms: [],
        primaryEventDate: event.event_date, primaryEventType: event.event_type,
        totalEvents: 1, eventTypes: [event.event_type], tags: [], musicSheets: [],
        upgradeOrders: [], preferredVenues: event.venue ? [event.venue] : [],
        status: 'active', createdAt: event.created_at, updatedAt: event.updated_at,
        lastContactDate: event.created_at, notes: event.notes || undefined,
        completedForms: 0, totalForms: 0, formCompletionRate: 0,
      } as Contact;
    },
    enabled: !!selectedEventId && isContactModalOpen,
  });

  const dayEvents = events.filter((e) => isSameDay(parseISO(e.event_date), currentDate));
  const dayMeetings = meetings.filter((m) => isSameDay(parseISO(m.booking_date), currentDate));

  // Group meetings by hour
  const meetingsByHour: Record<number, CalendarMeeting[]> = {};
  dayMeetings.forEach((m) => {
    const hour = parseTimeToHour(m.booking_time);
    if (!meetingsByHour[hour]) meetingsByHour[hour] = [];
    meetingsByHour[hour].push(m);
  });

  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const showTimeLine = isToday(currentDate) && currentHour >= 6 && currentHour <= 23;

  // Scroll to current time on mount
  useEffect(() => {
    if (showTimeLine && timelineRef.current) {
      const offset = (currentHour - 6) * 64;
      timelineRef.current.scrollTop = Math.max(0, offset - 100);
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

      {/* All Day Section */}
      {dayEvents.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Day</div>
          <div className="flex flex-wrap gap-2">
            {dayEvents.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                onClick={() => { setSelectedEventId(event.id); setIsContactModalOpen(true); }}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Hour-by-hour timeline */}
      <div ref={timelineRef} className="rounded-lg border bg-card overflow-y-auto max-h-[600px] relative">
        {HOURS.map((hour) => {
          const hourMeetings = meetingsByHour[hour] || [];
          return (
            <div key={hour} className="flex border-b border-border/50 min-h-[64px] relative">
              <div className="w-20 flex-shrink-0 py-2 px-3 text-xs text-muted-foreground font-medium border-r border-border/50 bg-muted/20">
                {format(new Date(2000, 0, 1, hour), 'h a')}
              </div>
              <div className="flex-1 py-1 px-2 space-y-1">
                {hourMeetings.map((meeting) => (
                  <CalendarMeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onClick={() => { setSelectedMeetingId(meeting.id); setIsMeetingModalOpen(true); }}
                    compact
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Current time red line */}
        {showTimeLine && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ top: `${(currentHour - 6) * 64 + (currentMinute / 60) * 64}px` }}
          >
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          </div>
        )}
      </div>

      {dayEvents.length === 0 && dayMeetings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No events or meetings</p>
          <p className="text-sm mt-1">This day is currently free</p>
        </div>
      )}

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

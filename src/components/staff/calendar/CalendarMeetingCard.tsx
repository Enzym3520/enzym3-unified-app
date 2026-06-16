import { Clock, MapPin, Video, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarMeeting } from '@/types/calendarItem';
import { format } from 'date-fns';
import { useMeetingTypes } from '@/hooks/useAppConfig';

interface CalendarMeetingCardProps {
  meeting: CalendarMeeting;
  onClick: () => void;
  compact?: boolean;
}

const getStatusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'completed':
      return 'bg-green-500/10 text-green-600 border-green-200';
    case 'cancelled':
      return 'bg-red-500/10 text-red-600 border-red-200';
    case 'rescheduled':
      return 'bg-amber-500/10 text-amber-600 border-amber-200';
    default:
      return 'bg-muted/10 text-muted-foreground border-border';
  }
};

export function CalendarMeetingCard({ meeting, onClick, compact = false }: CalendarMeetingCardProps) {
  const { getLabel: getMeetingTypeLabel } = useMeetingTypes();
  const isOnline = meeting.meeting_format === 'online';

  if (compact) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={cn(
          "w-full text-left p-2 rounded-md border border-teal-200/50 bg-teal-50/30 hover:bg-teal-100/40 transition-colors group",
          "cursor-pointer"
        )}
      >
        <div className="flex items-start gap-2">
          <div className="w-1 h-full rounded-full flex-shrink-0 bg-teal-500" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className="h-3 w-3 text-teal-600 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{meeting.couple_name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span>{format(new Date(`2000-01-01T${meeting.booking_time}`), 'h:mm a')}</span>
              {isOnline && <Video className="h-2.5 w-2.5 ml-0.5" />}
              {!isOnline && <MapPin className="h-2.5 w-2.5 ml-0.5" />}
              {meeting.meeting_link && <Link2 className="h-2.5 w-2.5 ml-0.5 text-primary" />}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "w-full text-left p-3 rounded-lg border border-teal-200 bg-teal-50/50 hover:shadow-md transition-all group",
        "cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-full rounded-full flex-shrink-0 bg-teal-500" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-teal-600" />
            <h4 className="font-medium truncate">{meeting.couple_name || 'Unknown'}</h4>
            <Badge variant="outline" className={cn("ml-auto text-xs", getStatusColor(meeting.status))}>
              {meeting.status}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-teal-700">
              {getMeetingTypeLabel(meeting.meeting_type)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{format(new Date(`2000-01-01T${meeting.booking_time}`), 'h:mm a')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isOnline ? (
                <>
                  <Video className="h-3.5 w-3.5" />
                  <span>Online Meeting</span>
                  {meeting.meeting_link && <Link2 className="h-3 w-3 ml-1 text-primary" />}
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{meeting.venue || 'In-Person'}</span>
                </>
              )}
            </div>
          </div>

          {meeting.customer_notes && (
            <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {meeting.customer_notes}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

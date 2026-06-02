import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Eye, Navigation, Zap } from "lucide-react";
import type { VendorAssignment } from "@/types/vendorAssignment";
import { formatEventType, parseEventDate } from "@/utils/vendorHelpers";
import { format, differenceInDays, isToday, isTomorrow, startOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getMapsUrl } from "@/utils/mapsLink";

interface NextEventCardProps {
  assignments: VendorAssignment[];
  onViewDetails?: (a: VendorAssignment) => void;
}

export function NextEventCard({ assignments, onViewDetails }: NextEventCardProps) {
  const navigate = useNavigate();
  const now = new Date();
  const todayStart = startOfDay(now);

  const nextAssignment = assignments
    ?.filter((a) => a.status === "confirmed" && a.event?.event_date)
    .map((a) => ({ ...a, _date: parseEventDate(a.event.event_date) }))
    .filter((a) => a._date >= todayStart && differenceInDays(a._date, todayStart) <= 7)
    .sort((a, b) => a._date.getTime() - b._date.getTime())[0];

  if (!nextAssignment) return null;

  const event = nextAssignment.event;
  const eventDate = parseEventDate(event.event_date);
  const daysUntil = differenceInDays(eventDate, todayStart);
  const isUrgent = isToday(eventDate) || isTomorrow(eventDate);
  const urgencyLabel = isToday(eventDate) ? "TODAY" : isTomorrow(eventDate) ? "TOMORROW" : `In ${daysUntil} days`;
  const mapsUrl = event.venue ? getMapsUrl(event.venue) : null;

  return (
    <Card className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${isUrgent ? "border-destructive/50 bg-destructive/5" : "border-primary/30 bg-primary/5"}`} onClick={() => onViewDetails?.(nextAssignment)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Next Event</h3>
          <Badge variant={isUrgent ? "destructive" : "default"} className="text-xs font-bold">{urgencyLabel}</Badge>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xl font-semibold text-foreground">{event.couple_name || "Unknown Client"}</p>
            <p className="text-sm text-muted-foreground">{formatEventType(event.event_type)}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{format(eventDate, "EEEE, MMM d, yyyy")}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                {mapsUrl ? (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    {event.venue} <Navigation className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">{event.venue}</span>
                )}
              </div>
            )}
            {event.hours_booked && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{event.hours_booked} hours booked</span>
              </div>
            )}
            {event.guest_count && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{event.guest_count} guests</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            {isUrgent && (
              <Button size="sm" className="flex-1 bg-destructive hover:bg-destructive/90" onClick={() => navigate(`/vendor/event-history`)}>
                <Zap className="mr-2 h-4 w-4" /> Gig Mode
              </Button>
            )}
            {mapsUrl && !isUrgent && (
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation className="mr-2 h-4 w-4" /> Get Directions</a>
              </Button>
            )}
            <Button size="sm" variant={isUrgent ? "outline" : "default"} className="flex-1" onClick={() => onViewDetails?.(nextAssignment)}>
              <Eye className="mr-2 h-4 w-4" /> View Full Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

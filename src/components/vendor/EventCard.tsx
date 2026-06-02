import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, CheckCircle2, XCircle, Eye, Zap, Clock, Package, Shirt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VendorAssignment } from "@/types";
import { formatEventType, parseEventDate } from "@/utils/vendorHelpers";
import { ConfirmEventModal } from "./ConfirmEventModal";
import { DeclineEventModal } from "./DeclineEventModal";
import { CompleteEventModal } from "./CompleteEventModal";
import { StatusBadge } from "./StatusBadge";
import { format, isToday, isTomorrow } from "date-fns";
import { getMapsUrl } from "@/utils/mapsLink";

interface EventCardProps {
  assignment: VendorAssignment;
  onViewDetails?: (a: VendorAssignment) => void;
}

export function EventCard({ assignment, onViewDetails }: EventCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const navigate = useNavigate();

  const event = assignment.event;
  if (!event) return null;

  const eventDate = parseEventDate(event.event_date);
  const isPastEvent = eventDate < new Date();
  const isGigDay = isToday(eventDate) || isTomorrow(eventDate);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails?.(assignment)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{event.couple_name || "Unknown Client"}</CardTitle>
                {(assignment as any).wedding_id || (assignment as any).event_dj_assignment_id ? (
                  <Badge variant="outline" className="text-xs">Enzym3 Gig</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">My Gig</Badge>
                )}
              </div>
              <CardDescription className="mt-1">{formatEventType(event.event_type)}</CardDescription>
            </div>
            <StatusBadge status={assignment.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              {format(eventDate, "EEEE, MMMM d, yyyy")}
            </div>
            {event.start_time && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                {format(new Date(`2000-01-01T${event.start_time}`), "h:mm a")}
                {event.hours_booked ? ` · ${event.hours_booked}h booked` : ""}
              </div>
            )}
            {!event.start_time && event.hours_booked && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                {event.hours_booked} hours booked
              </div>
            )}
            {event.venue && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                <a href={getMapsUrl(event.venue)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {event.venue}
                </a>
              </div>
            )}
            {event.guest_count && (
              <div className="flex items-center text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                {event.guest_count} guests
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {event.package_type && (
              <Badge variant="secondary" className="text-xs"><Package className="mr-1 h-3 w-3" />{event.package_type}</Badge>
            )}
            {event.dress_code && (
              <Badge variant="outline" className="text-xs"><Shirt className="mr-1 h-3 w-3" />{event.dress_code}</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            {isGigDay && assignment.status === "confirmed" && (
              <Button size="sm" onClick={() => navigate(`/vendor/event-history`)} className="flex-1 bg-destructive hover:bg-destructive/90">
                <Zap className="mr-2 h-4 w-4" /> Gig Mode
              </Button>
            )}
            {assignment.status === "assigned" && (
              <>
                <Button size="sm" onClick={() => setShowConfirmModal(true)} className="flex-1">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDeclineModal(true)} className="flex-1">
                  <XCircle className="mr-2 h-4 w-4" /> Decline
                </Button>
              </>
            )}
            {assignment.status === "confirmed" && isPastEvent && (
              <Button size="sm" variant="outline" onClick={() => setShowCompleteModal(true)} className="flex-1">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Complete
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onViewDetails?.(assignment)} className="flex-1">
              <Eye className="mr-2 h-4 w-4" /> Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmEventModal open={showConfirmModal} onOpenChange={setShowConfirmModal} assignmentId={assignment.id} />
      <DeclineEventModal open={showDeclineModal} onOpenChange={setShowDeclineModal} assignmentId={assignment.id} />
      <CompleteEventModal open={showCompleteModal} onOpenChange={setShowCompleteModal} assignmentId={assignment.id} />
    </>
  );
}

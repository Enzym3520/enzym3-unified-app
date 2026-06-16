import { useBookingWizard, deriveCoupleNameFromData } from "@/contexts/BookingWizardContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, MapPin, Users, FileText, Heart, Crown, PartyPopper, Clock } from "lucide-react";
import { EVENT_TYPE_OPTIONS } from "@/utils/smartFields";
import { format } from "date-fns";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function StepReviewSend() {
  const { data } = useBookingWizard();

  const eventTypeLabel = data.event_type === "other"
    ? data.custom_event_type || "Other"
    : EVENT_TYPE_OPTIONS.find((o) => o.value === data.event_type)?.label ?? "";

  const dateFormatted = data.event_date
    ? format(new Date(data.event_date + "T00:00:00"), "MMMM d, yyyy")
    : "";

  const coupleName = deriveCoupleNameFromData(data);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Booking Summary
          </CardTitle>
          <CardDescription>Review the details before submitting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {/* Event Info */}
            {eventTypeLabel && (
              <div className="flex items-start gap-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Event Type</p>
                  <Badge variant="secondary">{eventTypeLabel}</Badge>
                </div>
              </div>
            )}
            <InfoRow icon={Calendar} label="Event Date" value={dateFormatted} />
            <InfoRow icon={Clock} label="Start Time" value={data.start_time ? format(new Date(`2000-01-01T${data.start_time}`), "h:mm a") : ""} />
            <InfoRow icon={MapPin} label="Venue" value={data.venue} />
            <InfoRow icon={Users} label="Guest Count" value={data.guest_count} />

            {/* Contact Info — event-type-specific */}
            {data.event_type === "wedding" && (
              <>
                <InfoRow icon={Heart} label="Bride" value={data.bride_name} />
                <InfoRow icon={Mail} label="Bride Email" value={data.bride_email} />
                <InfoRow icon={Phone} label="Bride Phone" value={data.bride_phone} />
                <InfoRow icon={Heart} label="Groom" value={data.groom_name} />
                <InfoRow icon={Mail} label="Groom Email" value={data.groom_email} />
                <InfoRow icon={Phone} label="Groom Phone" value={data.groom_phone} />
              </>
            )}
            {data.event_type === "quinceanera" && (
              <>
                <InfoRow icon={Crown} label="Quinceañera" value={data.honoree_name} />
                <InfoRow icon={User} label="Parent/Guardian" value={data.parent_name} />
                <InfoRow icon={Mail} label="Parent Email" value={data.parent_email} />
                <InfoRow icon={Phone} label="Parent Phone" value={data.parent_phone} />
              </>
            )}
            {(data.event_type === "birthday" || data.event_type === "sweet_16") && (
              <>
                <InfoRow icon={PartyPopper} label="Honoree" value={data.honoree_name} />
                <InfoRow icon={User} label="Contact" value={data.contact_name} />
                <InfoRow icon={Mail} label="Contact Email" value={data.contact_email} />
                <InfoRow icon={Phone} label="Contact Phone" value={data.contact_phone} />
              </>
            )}
            {!["wedding", "quinceanera", "birthday", "sweet_16"].includes(data.event_type) && data.event_type && (
              <>
                <InfoRow icon={User} label="Contact" value={data.contact_name} />
                <InfoRow icon={Mail} label="Contact Email" value={data.contact_email} />
                <InfoRow icon={Phone} label="Contact Phone" value={data.contact_phone} />
              </>
            )}

            <InfoRow icon={FileText} label="Notes" value={data.notes} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useBookingWizard } from "@/contexts/BookingWizardContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { EVENT_TYPE_OPTIONS, smartCapitalize } from "@/utils/smartFields";

export function StepEventDetails() {
  const { data, updateField } = useBookingWizard();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" /> Event Details
        </CardTitle>
        <CardDescription>Select the event type and details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Event Type *</Label>
          <Select value={data.event_type} onValueChange={(v) => updateField("event_type", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.event_type === "other" && (
            <Input
              className="mt-1.5"
              value={data.custom_event_type}
              onChange={(e) => updateField("custom_event_type", smartCapitalize(e.target.value))}
              placeholder="Custom event type"
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="w-date">Event Date</Label>
            <Input
              id="w-date"
              type="date"
              value={data.event_date}
              onChange={(e) => updateField("event_date", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-start-time">Start Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="w-start-time"
                className="pl-9"
                type="time"
                value={data.start_time}
                onChange={(e) => updateField("start_time", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="w-guests">Guest Count</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="w-guests"
                className="pl-9"
                type="number"
                min={0}
                value={data.guest_count}
                onChange={(e) => updateField("guest_count", e.target.value)}
                placeholder="150"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-venue">Venue</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="w-venue"
                className="pl-9"
                value={data.venue}
                onChange={(e) => updateField("venue", e.target.value)}
                placeholder="Venue name"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

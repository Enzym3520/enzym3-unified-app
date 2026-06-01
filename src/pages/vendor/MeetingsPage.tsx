import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Video, MapPin, ExternalLink, Check, X, CalendarDays, Timer } from "lucide-react";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import { useMeetings, useRsvpMeeting, useSaveMeetingNotes, type Meeting } from "@/hooks/use-meetings";
import { EmptyState } from "@/components/vendor/EmptyState";

function MeetingCountdown({ date, time }: { date: string; time: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const meetingDate = new Date(`${date}T${time}`);
  const diffMins = differenceInMinutes(meetingDate, now);

  if (diffMins < 0 || diffMins > 24 * 60) return null;

  const hours = differenceInHours(meetingDate, now);
  const mins = diffMins % 60;

  return (
    <Badge variant="outline" className="text-[10px] border-primary text-primary gap-1">
      <Timer className="h-3 w-3" />
      {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
    </Badge>
  );
}

export default function MeetingsPage() {
  const { data: meetings = [], isLoading } = useMeetings();
  const rsvpMutation = useRsvpMeeting();
  const notesMutation = useSaveMeetingNotes();
  const [detail, setDetail] = useState<Meeting | null>(null);
  const [vendorNotes, setVendorNotes] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailIdRef = useRef<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Keep detailIdRef in sync
  useEffect(() => {
    detailIdRef.current = detail?.id ?? null;
  }, [detail]);

  // Auto-open from ?id=<meeting_id>
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || meetings.length === 0 || detail) return;
    const match = meetings.find((m) => m.id === id);
    if (match) {
      setDetail(match);
      setVendorNotes(match.vendor_notes ?? "");
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, meetings, detail, setSearchParams]);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter((m) => m.booking_date >= today && m.status !== "cancelled");
  const past = meetings.filter((m) => m.booking_date < today || m.status === "cancelled");

  const openDetail = (m: Meeting) => {
    setDetail(m);
    setVendorNotes(m.vendor_notes ?? "");
  };

  // Debounced auto-save for notes in detail modal
  const handleNotesChange = (value: string) => {
    setVendorNotes(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const currentDetailId = detailIdRef.current;
    debounceRef.current = setTimeout(() => {
      if (currentDetailId) {
        notesMutation.mutate({ id: currentDetailId, notes: value });
      }
    }, 1500);
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const saveNotes = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!detail) return;
    notesMutation.mutate({ id: detail.id, notes: vendorNotes }, { onSuccess: () => setDetail(null) });
  };

  const MeetingCard = ({ m }: { m: Meeting }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(m)}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{m.couple_name}</p>
            <p className="text-sm text-muted-foreground capitalize">{m.meeting_type.replace(/_/g, " ")}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={m.status === "cancelled" ? "destructive" : "outline"} className="capitalize">{m.status}</Badge>
            {m.vendor_rsvp && (
              <Badge variant={m.vendor_rsvp === "accepted" ? "default" : "secondary"} className="text-[10px] capitalize">
                {m.vendor_rsvp}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(m.booking_date), "MMM d, yyyy")}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.booking_time}</span>
          <span className="flex items-center gap-1">
            {m.meeting_format === "virtual" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {m.meeting_format ?? "in-person"}
          </span>
          {m.booking_date >= today && m.status !== "cancelled" && (
            <MeetingCountdown date={m.booking_date} time={m.booking_time} />
          )}
        </div>
        {!m.vendor_rsvp && m.status !== "cancelled" && m.booking_date >= today && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); rsvpMutation.mutate({ id: m.id, rsvp: "accepted" }); }}>
              <Check className="mr-1 h-3.5 w-3.5" /> Accept
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); rsvpMutation.mutate({ id: m.id, rsvp: "declined" }); }}>
              <X className="mr-1 h-3.5 w-3.5" /> Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold">Meetings</h1>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming meetings" description="Your scheduled meetings will appear here." />
          ) : upcoming.map((m) => <MeetingCard key={m.id} m={m} />)}
        </TabsContent>
        <TabsContent value="past" className="space-y-3 mt-4">
          {past.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No past meetings" description="Completed meetings will appear here." />
          ) : past.map((m) => <MeetingCard key={m.id} m={m} />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{detail?.couple_name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{format(new Date(detail.booking_date), "MMMM d, yyyy")}</p></div>
                <div><p className="text-muted-foreground">Time</p><p className="font-medium">{detail.booking_time}</p></div>
                <div><p className="text-muted-foreground">Type</p><p className="font-medium capitalize">{detail.meeting_type.replace(/_/g, " ")}</p></div>
                <div><p className="text-muted-foreground">Format</p><p className="font-medium capitalize">{detail.meeting_format ?? "In-person"}</p></div>
              </div>
              {detail.meeting_link && (
                <Button variant="outline" size="sm" asChild>
                  <a href={detail.meeting_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Join Meeting
                  </a>
                </Button>
              )}
              {detail.admin_notes && <div><p className="text-muted-foreground">Admin Notes</p><p>{detail.admin_notes}</p></div>}
              {detail.customer_notes && <div><p className="text-muted-foreground">Client Notes</p><p>{detail.customer_notes}</p></div>}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Your Notes</p>
                  {notesMutation.isPending && <span className="text-xs text-muted-foreground">Saving...</span>}
                </div>
                <Textarea value={vendorNotes} onChange={(e) => handleNotesChange(e.target.value)} placeholder="Add your notes..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
            <Button onClick={saveNotes} disabled={notesMutation.isPending}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

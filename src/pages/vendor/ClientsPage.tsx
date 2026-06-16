import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/vendor/EmptyState";
import { Users, Search, Mail, Phone, MapPin, Calendar, Briefcase, Plus, Music } from "lucide-react";
import { format } from "date-fns";
import { useBookingRequests } from "@/hooks/use-booking-requests";
import { useEventHistory } from "@/hooks/use-event-history";
import { smartCapitalize } from "@/utils/smartFields";
import { formatEventType, parseEventDate } from "@/utils/vendorHelpers";
import { VibeSheetReview } from "@/components/staff/event-detail/VibeSheetReview";

interface UnifiedClient {
  id: string;
  wedding_id: string | null;
  source: "assigned" | "booking";
  name: string;
  email: string;
  phone: string | null;
  event_date: string | null;
  event_type: string | null;
  venue: string | null;
  guest_count: number | null;
  status: string | null;
}

function ClientCard({ client, onViewVibeSheet }: { client: UnifiedClient; onViewVibeSheet: (c: UnifiedClient) => void }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{smartCapitalize(client.name)}</h3>
            <div className="flex gap-2 mt-1 flex-wrap">
              <Badge variant={client.source === "booking" ? "default" : "outline"} className="text-xs">
                {client.source === "booking" ? "My Booking" : "Assigned"}
              </Badge>
              {client.status && (
                <Badge variant="secondary" className="text-xs capitalize">{client.status}</Badge>
              )}
              {client.event_type && (
                <Badge variant="outline" className="text-xs">{formatEventType(client.event_type)}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {client.event_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {format(parseEventDate(client.event_date), "MMM d, yyyy")}
            </div>
          )}
          {client.venue && (
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{client.venue}</div>
          )}
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <a href={`mailto:${client.email}`} className="hover:underline text-primary truncate">{client.email}</a>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
            </div>
          )}
          {client.guest_count && (
            <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 shrink-0" />{client.guest_count} guests</div>
          )}
        </div>
        {client.wedding_id && (
          <Button variant="outline" size="sm" className="w-full gap-2 mt-1" onClick={() => onViewVibeSheet(client)}>
            <Music className="h-3.5 w-3.5" /> View Vibe Sheet
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [vibeSheetClient, setVibeSheetClient] = useState<UnifiedClient | null>(null);

  const { data: bookings = [], isLoading: loadingBookings } = useBookingRequests();
  const { data: eventHistory = [], isLoading: loadingHistory } = useEventHistory();

  const isLoading = loadingBookings || loadingHistory;

  // Build unified client list
  const clients: UnifiedClient[] = [];
  const seenEmails = new Set<string>();

  for (const b of bookings) {
    const key = b.client_email.toLowerCase();
    if (seenEmails.has(key)) continue;
    seenEmails.add(key);
    clients.push({
      id: `b-${b.id}`,
      wedding_id: null,
      source: "booking",
      name: b.client_name,
      email: b.client_email,
      phone: b.client_phone,
      event_date: b.event_date,
      event_type: b.event_type,
      venue: null,
      guest_count: null,
      status: b.status,
    });
  }

  for (const e of eventHistory) {
    const key = e.contact_email.toLowerCase();
    if (seenEmails.has(key)) continue;
    seenEmails.add(key);
    clients.push({
      id: `a-${e.event_id}`,
      wedding_id: e.event_id,
      source: "assigned",
      name: e.couple_name,
      email: e.contact_email,
      phone: null,
      event_date: e.event_date,
      event_type: e.event_type,
      venue: e.venue,
      guest_count: e.guest_count,
      status: e.assignment_status,
    });
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.venue ?? "").toLowerCase().includes(q) ||
      (c.event_type ?? "").toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">My Clients</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => navigate("/vendor/new-booking")}>
          <Plus className="mr-1.5 h-4 w-4" /> New Booking
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, venue…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No clients found" description="Create a new booking or accept a booking request to see clients here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <ClientCard key={c.id} client={c} onViewVibeSheet={setVibeSheetClient} />
          ))}
        </div>
      )}

      <Dialog open={!!vibeSheetClient} onOpenChange={(open) => { if (!open) setVibeSheetClient(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {vibeSheetClient ? smartCapitalize(vibeSheetClient.name) : ""} — Vibe Sheet
            </DialogTitle>
          </DialogHeader>
          {vibeSheetClient?.wedding_id && (
            <VibeSheetReview
              eventId={vibeSheetClient.wedding_id}
              eventType={vibeSheetClient.event_type || ""}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useEventHistory, type VendorEventHistory } from "@/hooks/use-event-history";
import { useBookingRequests, type BookingRequest } from "@/hooks/use-booking-requests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/vendor/EmptyState";
import {
  Calendar,
  MapPin,
  Users,
  Mail,
  MailCheck,
  Search,
  History,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { formatEventType, parseEventDate } from "@/utils/vendorHelpers";

type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc";

interface UnifiedNotification {
  id: string;
  source: "assigned" | "booking";
  name: string;
  email: string;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  guest_count: number | null;
  status: string;
  send_count: number;
  last_sent_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  assigned: "bg-warning text-warning-foreground",
  pending: "bg-warning text-warning-foreground",
  confirmed: "bg-success text-success-foreground",
  completed: "bg-primary text-primary-foreground",
  declined: "bg-destructive text-destructive-foreground",
  accepted: "bg-success text-success-foreground",
};

const FILTERS = ["All", "Sent", "Not Sent", "Upcoming", "Past"] as const;

function PageSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EventHistoryPage() {
  const { user } = useAuth();
  const { data: events = [], isLoading: loadingEvents } = useEventHistory();
  const { data: bookings = [], isLoading: loadingBookings } = useBookingRequests();

  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");

  // Fetch invite token send counts for bookings
  const { data: tokenCounts = [] } = useQuery({
    queryKey: ["booking-invite-token-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("booking_invite_tokens")
        .select("booking_request_id, created_at")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5000);
      return (data ?? []) as { booking_request_id: string; created_at: string }[];
    },
  });

  const tokenCountMap = tokenCounts.reduce<Record<string, { count: number; last: string }>>((acc, t) => {
    if (!acc[t.booking_request_id]) {
      acc[t.booking_request_id] = { count: 0, last: t.created_at };
    }
    acc[t.booking_request_id].count++;
    return acc;
  }, {});

  const isLoading = loadingEvents || loadingBookings;
  const today = new Date().toISOString().split("T")[0];

  // Build unified list
  const items: UnifiedNotification[] = [];

  for (const e of events) {
    items.push({
      id: `ev-${e.assignment_id}`,
      source: "assigned",
      name: e.couple_name,
      email: e.contact_email,
      event_type: e.event_type,
      event_date: e.event_date,
      venue: e.venue,
      guest_count: e.guest_count,
      status: e.assignment_status,
      send_count: e.resend_count ?? 0,
      last_sent_at: e.last_resent_at,
    });
  }

  for (const b of bookings) {
    if (b.status === "declined") continue;
    const tc = tokenCountMap[b.id];
    items.push({
      id: `bk-${b.id}`,
      source: "booking",
      name: b.client_name,
      email: b.client_email,
      event_type: b.event_type,
      event_date: b.event_date,
      venue: null,
      guest_count: null,
      status: b.status,
      send_count: tc?.count ?? 0,
      last_sent_at: tc?.last ?? null,
    });
  }

  const filtered = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.email.toLowerCase().includes(search.toLowerCase())) return false;

    switch (filter) {
      case "Sent":
        return item.send_count > 0;
      case "Not Sent":
        return item.send_count === 0;
      case "Upcoming":
        return item.event_date ? item.event_date >= today : false;
      case "Past":
        return item.event_date ? item.event_date < today : true;
      default:
        return true;
    }
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortOption) {
      case "date_asc":  return (a.event_date ?? "").localeCompare(b.event_date ?? "");
      case "name_asc":  return a.name.localeCompare(b.name);
      case "name_desc": return b.name.localeCompare(a.name);
      default:          return (b.event_date ?? "9999").localeCompare(a.event_date ?? "9999");
    }
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Notification History</h1>
        <p className="text-sm text-muted-foreground">
          View your event history and notification status
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest First</SelectItem>
            <SelectItem value="date_asc">Oldest First</SelectItem>
            <SelectItem value="name_asc">Name A–Z</SelectItem>
            <SelectItem value="name_desc">Name Z–A</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="text-xs"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={History}
          title="No notifications found"
          description="No events match your search or filter."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{formatEventType(item.event_type)}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0 flex-wrap">
                    <Badge variant={item.source === "booking" ? "default" : "outline"} className="text-xs">
                      {item.source === "booking" ? "My Booking" : "Assigned"}
                    </Badge>
                    <Badge className={`${STATUS_COLORS[item.status] ?? "bg-muted"} capitalize`}>
                      {item.status}
                    </Badge>
                    {item.send_count > 0 ? (
                      <Badge variant="outline" className="gap-1">
                        <MailCheck className="h-3 w-3" /> Sent {item.send_count}x
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" /> Not sent
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {item.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseEventDate(item.event_date), "MMM d, yyyy")}
                    </span>
                  )}
                  {item.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.venue}
                    </span>
                  )}
                  {item.guest_count && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {item.guest_count} guests
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {item.email}
                  </span>
                  {item.last_sent_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last sent {format(new Date(item.last_sent_at), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useBookingRequests, useUpdateBookingRequest, BookingRequest } from "@/hooks/use-booking-requests";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/vendor/EmptyState";
import { Inbox, CheckCircle, XCircle, Clock, Mail, Phone, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { smartCapitalize } from "@/utils/smartFields";
import { formatEventType, parseEventDate } from "@/utils/vendorHelpers";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  accepted: "bg-green-500/10 text-green-700 dark:text-green-400",
  declined: "bg-destructive/10 text-destructive",
};

function RequestCard({ req }: { req: BookingRequest }) {
  const updateMutation = useUpdateBookingRequest();
  const isPending = req.status === "pending";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{smartCapitalize(req.client_name)}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.client_email}</span>
              {req.client_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{req.client_phone}</span>}
            </div>
          </div>
          <Badge className={`${statusColors[req.status] ?? ""} capitalize`}>{req.status}</Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {req.event_type && <span>{formatEventType(req.event_type)}</span>}
          {req.event_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(parseEventDate(req.event_date), "MMM d, yyyy")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(req.created_at), "MMM d, h:mm a")}
          </span>
        </div>

        {req.message && <p className="text-sm">{req.message}</p>}

        {isPending && (
          <div className="flex gap-2 pt-1 flex-wrap">
            <Button
              size="sm"
              onClick={() => updateMutation.mutate({ id: req.id, status: "accepted" })}
              disabled={updateMutation.isPending}
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateMutation.mutate({ id: req.id, status: "declined" })}
              disabled={updateMutation.isPending}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BookingRequestsPage() {
  const { data: requests, isLoading } = useBookingRequests();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      </div>
    );
  }

  const pending = requests?.filter((r) => r.status === "pending") ?? [];
  const past = requests?.filter((r) => r.status !== "pending") ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Booking Requests</h1>
          <p className="text-muted-foreground mt-1">
            {pending.length} pending request{pending.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => navigate("/vendor/new-booking")}>
          <Plus className="mr-1.5 h-4 w-4" /> New Booking
        </Button>
      </div>

      {requests?.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No booking requests yet"
          description="When clients submit booking requests from your public page, they'll appear here."
        />
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Pending</h2>
              {pending.map((r) => <RequestCard key={r.id} req={r} />)}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">Past</h2>
              {past.map((r) => <RequestCard key={r.id} req={r} />)}
            </section>
          )}
        </>
      )}
    </div>
  );
}

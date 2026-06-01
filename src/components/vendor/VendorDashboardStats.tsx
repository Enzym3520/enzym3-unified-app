import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssignments } from "@/hooks/use-assignments";
import { useDocuments } from "@/hooks/use-documents";
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { differenceInDays, startOfDay } from "date-fns";
import { capitalizeNames, parseEventDate } from "@/utils/vendorHelpers";

interface VendorDashboardStatsProps {
  vendorId: string;
}

export function VendorDashboardStats({ vendorId }: VendorDashboardStatsProps) {
  const { data: assignments } = useAssignments();
  const { data: documents } = useDocuments();

  const todayStart = startOfDay(new Date());

  const upcomingEvents = assignments?.filter(
    (a) => a.status === "confirmed" && a.event?.event_date && parseEventDate(a.event.event_date) >= todayStart
  ).length || 0;

  const pendingConfirmations = assignments?.filter((a) => a.status === "assigned").length || 0;

  const documentsNeedingAttention = documents?.filter((doc: any) => {
    if (!doc.expires_at) return false;
    const daysUntil = Math.ceil((new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil < 30;
  }).length || 0;

  const nextEvent = assignments
    ?.filter((a) => a.status === "confirmed" && a.event?.event_date && parseEventDate(a.event.event_date) >= todayStart)
    .sort((a, b) => parseEventDate(a.event?.event_date ?? "").getTime() - parseEventDate(b.event?.event_date ?? "").getTime())[0];

  const daysUntilNext = nextEvent?.event?.event_date
    ? differenceInDays(parseEventDate(nextEvent.event.event_date), new Date())
    : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 overflow-hidden">
      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingEvents}</div>
          <p className="text-xs text-muted-foreground">Confirmed bookings</p>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingConfirmations}</div>
          <p className="text-xs text-muted-foreground">Awaiting your response</p>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documents</CardTitle>
          {documentsNeedingAttention > 0 ? <AlertCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{documentsNeedingAttention}</div>
          <p className="text-xs text-muted-foreground">{documentsNeedingAttention > 0 ? "Need attention" : "All up to date"}</p>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Event</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {nextEvent?.event ? (
            <>
              <div className="text-2xl font-bold">
                {daysUntilNext === 0 ? "Today" : daysUntilNext === 1 ? "Tomorrow" : `${daysUntilNext} days`}
              </div>
              <p className="text-xs text-muted-foreground truncate">{capitalizeNames(nextEvent.event.couple_name)}</p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">No upcoming events</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

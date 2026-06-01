import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/vendor/EmptyState";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useEarnings, type EarningRecord } from "@/hooks/use-earnings";
import { formatEventType, parseEventDate } from "@/utils/vendorHelpers";

function EarningsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EarningsPage() {
  const { data: earnings = [], isLoading } = useEarnings();

  if (isLoading) return <div className="p-4 md:p-6 max-w-4xl mx-auto"><EarningsSkeleton /></div>;

  const totalEarned = earnings.reduce((sum, e) => sum + (e.total_vendor_cost ?? 0), 0);
  const paid = earnings.filter((e) => e.payment_status === "paid");
  const totalPaid = paid.reduce((sum, e) => sum + (e.total_vendor_cost ?? 0), 0);
  const pending = earnings.filter((e) => e.payment_status !== "paid");
  const totalPending = pending.reduce((sum, e) => sum + (e.total_vendor_cost ?? 0), 0);

  const statusColor = (s: string) => {
    if (s === "paid") return "default" as const;
    if (s === "pending") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Earnings</h1>
        <p className="text-muted-foreground mt-1">Track your payments and earnings history.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalEarned.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalPending.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <EmptyState icon={DollarSign} title="No earnings yet" description="Your payment history will appear here once you complete events." />
          ) : (
            <div className="space-y-3">
              {earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{e.event_couple_name ?? "Unknown Client"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventType(e.event_type)} · {e.event_date ? format(parseEventDate(e.event_date), "MMM d, yyyy") : ""}
                      {e.event_venue ? ` · ${e.event_venue}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.hours_booked ? `${e.hours_booked}h` : ""}{e.overtime_hours ? ` + ${e.overtime_hours}h OT` : ""} · ${e.vendor_rate}/hr
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-sm">${e.total_vendor_cost.toLocaleString()}</p>
                    <Badge variant={statusColor(e.payment_status)} className="text-xs mt-1">{e.payment_status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

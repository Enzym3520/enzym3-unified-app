import { useState } from "react";
import { useAssignments, useConfirmAssignment, useDeclineAssignment } from "@/hooks/use-assignments";
import type { VendorAssignment } from "@/types";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/vendor/EmptyState";
import { CompleteEventModal } from "@/components/vendor/CompleteEventModal";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { Check, X, Eye, MapPin, Calendar, Users, CalendarDays, CheckCircle2, Clock, Package, Shirt, Phone, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isPast, parseISO } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatEventType, parseEventDate } from "@/utils/vendorHelpers";

const FILTERS = ["All", "Pending", "Confirmed", "Upcoming", "Completed", "Declined"] as const;

function EventListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface EventListProps {
  onViewDetails: (assignment: VendorAssignment) => void;
}

export function EventList({ onViewDetails }: EventListProps) {
  const isMobile = useIsMobile();
  const { data: assignments = [], isLoading } = useAssignments();
  const confirmMutation = useConfirmAssignment();
  const declineMutation = useDeclineAssignment();

  const [filter, setFilter] = useState<string>("All");
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const [completeId, setCompleteId] = useState<string | null>(null);

  const canComplete = (a: VendorAssignment) =>
    a.status === "confirmed" && a.event?.event_date && isPast(parseEventDate(a.event.event_date));

  const filtered = assignments.filter((a) => {
    const s = a.status?.toLowerCase() ?? "";
    const today = new Date().toISOString().split("T")[0];
    switch (filter) {
      case "Pending": return s === "assigned" || s === "pending";
      case "Confirmed": return s === "confirmed";
      case "Upcoming": return s === "confirmed" && a.event?.event_date && a.event.event_date >= today;
      case "Completed": return s === "completed";
      case "Declined": return s === "declined";
      default: return true;
    }
  });

  const handleDecline = () => {
    if (!declineId) return;
    declineMutation.mutate({ assignmentId: declineId, reason: declineReason }, {
      onSuccess: () => { setDeclineId(null); setDeclineReason(""); },
    });
  };

  if (isLoading) return <EventListSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">My Events</h2>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="text-xs">
            {f}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events found" description="No events match this filter." />
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="overflow-hidden cursor-pointer" onClick={() => onViewDetails(a)}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{a.event?.couple_name ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">{formatEventType(a.event?.event_type)}</p>
                  </div>
                  <StatusBadge status={a.status} compact />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{a.event?.event_date ? format(parseEventDate(a.event.event_date), "MMM d, yyyy") : "—"}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.event?.start_time ? format(new Date(`2000-01-01T${a.event.start_time}`), "h:mm a") : "—"}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.event?.venue ?? "—"}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{a.event?.guest_count ?? "—"}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><UserCircle className="h-3 w-3" />{a.event?.coordinator_name ?? "—"}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.event?.contact_phone ?? "—"}</span>
                  <span className="flex items-center gap-1"><Shirt className="h-3 w-3" />{a.event?.dress_code ?? "—"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs"><Package className="h-3 w-3 mr-1" />{a.event?.package_type ?? "—"}</Badge>
                  <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{a.event?.hours_booked ? `${a.event.hours_booked}h` : "—"}</Badge>
                </div>
                <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {(a.status === "assigned" || a.status === "pending") && (
                    <>
                      <Button size="sm" className="flex-1" onClick={() => confirmMutation.mutate(a.id)}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Confirm
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setDeclineId(a.id)}>
                        <X className="mr-1 h-3.5 w-3.5" /> Decline
                      </Button>
                    </>
                  )}
                  {canComplete(a) && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setCompleteId(a.id)}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Complete
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => onViewDetails(a)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Time</th>
                  <th className="p-3 font-medium">Hours</th>
                  <th className="p-3 font-medium">Venue</th>
                  <th className="p-3 font-medium">Guests</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => onViewDetails(a)}>
                    <td className="p-3 font-medium">{a.event?.couple_name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{formatEventType(a.event?.event_type)}</td>
                    <td className="p-3">{a.event?.event_date ? format(parseEventDate(a.event.event_date), "MMM d, yyyy") : "—"}</td>
                    <td className="p-3">{a.event?.start_time ? format(new Date(`2000-01-01T${a.event.start_time}`), "h:mm a") : "—"}</td>
                    <td className="p-3">{a.event?.hours_booked ? `${a.event.hours_booked}h` : "—"}</td>
                    <td className="p-3 text-muted-foreground">{a.event?.venue ?? "—"}</td>
                    <td className="p-3">{a.event?.guest_count ?? "—"}</td>
                    <td className="p-3"><StatusBadge status={a.status} compact className="capitalize" /></td>
                    <td className="p-3">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {(a.status === "assigned" || a.status === "pending") && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => confirmMutation.mutate(a.id)}>
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeclineId(a.id)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {canComplete(a) && (
                          <Button size="sm" variant="ghost" onClick={() => setCompleteId(a.id)}>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => onViewDetails(a)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={!!declineId} onOpenChange={() => setDeclineId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Event</DialogTitle>
            <DialogDescription>Provide an optional reason for declining this assignment.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for declining (optional)" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDecline}>Decline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {completeId && (
        <CompleteEventModal
          open={!!completeId}
          onOpenChange={() => setCompleteId(null)}
          assignmentId={completeId}
        />
      )}
    </div>
  );
}

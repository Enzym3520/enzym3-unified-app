import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCancelAssignment } from '@/hooks/useAdminAssignments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VendorAssignmentsTabProps {
  vendorId: string;
}

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-muted text-muted-foreground',
  declined: 'bg-destructive',
};

export function VendorAssignmentsTab({ vendorId }: VendorAssignmentsTabProps) {
  const cancelAssignment = useCancelAssignment();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['vendor-assignments-admin', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_dj_assignments')
        .select(`
          id,
          status,
          created_at,
          assignment_notes,
          event:event_notification_history!event_dj_assignments_event_id_fkey(
            id,
            couple_name,
            event_date,
            event_type,
            venue
          )
        `)
        .eq('dj_user_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No event assignments for this vendor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">
        Event Assignments ({assignments.length})
      </h3>
      {assignments.map((a) => {
        const event = a.event;
        const eventDate = event?.event_date
          ? format(new Date(event.event_date), 'MMM d, yyyy')
          : '—';

        return (
          <div
            key={a.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <p className="font-medium truncate">
                {event?.couple_name || 'Unknown Event'}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {eventDate}
                </span>
                {event?.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.venue}
                  </span>
                )}
                {event?.event_type && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {event.event_type}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4 shrink-0">
              <Badge className={statusColors[a.status] || ''}>
                {a.status}
              </Badge>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unassign vendor?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the vendor from{' '}
                      <strong>{event?.couple_name || 'this event'}</strong> on{' '}
                      {eventDate}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelAssignment.mutate(a.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Unassign
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}

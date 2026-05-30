import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { formatEventType } from '@/utils/notificationHelpers';
import { useIsMobile } from '@/hooks/use-mobile';

interface UpcomingEvent {
  id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
  assignment_count: number;
}

interface UpcomingEventsTableProps {
  events: UpcomingEvent[];
}

export function UpcomingEventsTable({ events }: UpcomingEventsTableProps) {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No upcoming events</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{event.couple_name}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(event.event_date), 'MMM dd, yyyy')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{formatEventType(event.event_type)}</Badge>
                        <span className="text-xs text-muted-foreground truncate">{event.venue || 'N/A'}</span>
                      </div>
                    </div>
                    {event.assignment_count === 0 ? (
                      <Badge variant="destructive" className="gap-1 shrink-0">
                        <AlertCircle className="h-3 w-3" />
                        Needs Vendors
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 shrink-0">Ready</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Event Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Vendors Assigned</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No upcoming events
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.couple_name}</TableCell>
                  <TableCell>{format(new Date(event.event_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{formatEventType(event.event_type)}</TableCell>
                  <TableCell>{event.venue || 'N/A'}</TableCell>
                  <TableCell>{event.assignment_count}</TableCell>
                  <TableCell>
                    {event.assignment_count === 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Needs Vendors
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">Ready</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}

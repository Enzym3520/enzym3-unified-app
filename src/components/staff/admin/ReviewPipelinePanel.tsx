import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, CheckCircle, XCircle, StopCircle, SendHorizonal, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useReviewPipeline, getCadencePhase } from '@/hooks/useReviewPipeline';

export function ReviewPipelinePanel() {
  const { rows, isLoading, stopReminders, sendNow, isSending } = useReviewPipeline();

  const active = rows.filter((r) => !r.stopped);
  const stopped = rows.filter((r) => r.stopped);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Review Request Pipeline
            </CardTitle>
            <CardDescription>
              Automated cadence: 3 days after event → weekly × 3 → bi-weekly × 3 → monthly until review or 12-month cap
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{active.length} active</Badge>
            <Badge variant="outline">{stopped.length} stopped</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No review requests queued yet</p>
            <p className="text-xs mt-1">Couples are auto-enqueued 3 days after their event date.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const couple = [row.bride_first_name, row.groom_first_name].filter(Boolean).join(' & ') || row.email;
              return (
                <div
                  key={row.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{couple}</p>
                      {row.stopped ? (
                        <Badge variant="outline" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Stopped
                          {row.stopped_reason ? ` · ${row.stopped_reason.replace(/_/g, ' ')}` : ''}
                        </Badge>
                      ) : row.next_send_at && new Date(row.next_send_at) <= new Date() ? (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Due
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{getCadencePhase(row.reminder_number)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {row.email}
                      {row.event_date && ` · event ${format(new Date(row.event_date), 'MMM d, yyyy')}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.last_sent_at && `Last sent ${format(new Date(row.last_sent_at), 'MMM d')} · `}
                      {row.next_send_at
                        ? `Next ${format(new Date(row.next_send_at), 'MMM d, yyyy')}`
                        : 'No further sends'}
                    </p>
                  </div>
                  {!row.stopped && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => sendNow(row.id)}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <SendHorizonal className="h-4 w-4 mr-1" />
                        )}
                        Send now
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => stopReminders(row.id)}
                      >
                        <StopCircle className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

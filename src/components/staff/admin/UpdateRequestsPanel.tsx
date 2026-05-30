import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAllPendingUpdateRequests, useReviewUpdateRequest } from '@/hooks/useUpdateRequests';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function UpdateRequestsPanel() {
  const { data: requests, isLoading } = useAllPendingUpdateRequests();
  const review = useReviewUpdateRequest();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState<Record<string, string>>({});

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!requests?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vendor Update Requests</CardTitle>
        <CardDescription>{requests.length} pending request{requests.length !== 1 ? 's' : ''}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((req: any) => (
          <div key={req.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{req.vendor_name}</p>
                <p className="text-xs text-muted-foreground">
                  {req.couple_name} · {req.event_date ? format(new Date(req.event_date), 'MMM d, yyyy') : 'No date'}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">{req.field_name}</Badge>
            </div>

            {req.suggested_value && (
              <p className="text-sm"><span className="text-muted-foreground">Suggested:</span> {req.suggested_value}</p>
            )}
            <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {req.reason}</p>

            {rejectId === req.id ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Notes (optional)..."
                  value={reviewerNotes[req.id] || ''}
                  onChange={e => setReviewerNotes(n => ({ ...n, [req.id]: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      review.mutate({ requestId: req.id, status: 'rejected', reviewer_notes: reviewerNotes[req.id] });
                      setRejectId(null);
                    }}
                  >
                    Confirm Reject
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRejectId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => review.mutate({ requestId: req.id, status: 'approved', reviewer_notes: reviewerNotes[req.id] })}
                  className="gap-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectId(req.id)} className="gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

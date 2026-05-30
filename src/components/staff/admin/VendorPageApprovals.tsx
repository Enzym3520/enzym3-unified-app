import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useVendorPageApprovals } from '@/hooks/useVendorPage';
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { formatVendorType } from '@/utils/vendorTypeFormatter';

export function VendorPageApprovals() {
  const { pendingPages, isLoading, approve, reject } = useVendorPageApprovals();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showReject, setShowReject] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!pendingPages?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vendor Pages Pending Approval</CardTitle>
        <CardDescription>{pendingPages.length} page{pendingPages.length !== 1 ? 's' : ''} awaiting review</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingPages.map((p: any) => {
          const vendor = p.vendor;
          const name = vendor?.company_name || `${vendor?.first_name || ''} ${vendor?.last_name || ''}`.trim();
          return (
            <div key={p.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {vendor?.vendor_type ? formatVendorType(vendor.vendor_type) : 'Vendor'} · /v/{p.slug}
                  </p>
                </div>
                <a href={`/v/${p.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" /> Preview
                  </Button>
                </a>
              </div>
              {p.headline && <p className="text-sm text-muted-foreground italic">"{p.headline}"</p>}

              {showReject === p.id ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Reason for rejection..."
                    value={rejectNotes[p.id] || ''}
                    onChange={e => setRejectNotes(n => ({ ...n, [p.id]: e.target.value }))}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" disabled={!rejectNotes[p.id]?.trim()} onClick={() => {
                      reject.mutate({ pageId: p.id, notes: rejectNotes[p.id] });
                      setShowReject(null);
                    }}>Confirm Reject</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowReject(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve.mutate(p.id)} className="gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowReject(p.id)} className="gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

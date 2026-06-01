import React, { useState } from 'react';
import { Building2, DollarSign, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeFormatDate } from '@/utils/dateHelpers';

interface VenuePartnerInvoiceCardProps {
  eventId: string;
  venueName?: string | null;
}

interface InvoiceRow {
  id?: string;
  event_id?: string;
  invoice_type?: string;
  amount?: number | null;
  sent_at?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  payment_status?: string;
}

function getStatusBadge(invoice: InvoiceRow | null | undefined) {
  if (!invoice) {
    return <Badge variant="outline" className="text-amber-600 border-amber-300">Unpaid</Badge>;
  }
  if (invoice.paid_at) {
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100">Paid</Badge>;
  }
  if (invoice.sent_at) {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100">Sent – Awaiting Payment</Badge>;
  }
  return <Badge variant="outline" className="text-amber-600 border-amber-300">Unpaid</Badge>;
}

export const VenuePartnerInvoiceCard: React.FC<VenuePartnerInvoiceCardProps> = ({
  eventId,
  venueName,
}) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<'sent' | 'paid' | null>(null);

  // Local form state
  const [amount, setAmount] = useState('');
  const [invoiceSentDate, setInvoiceSentDate] = useState('');
  const [invoicePaidDate, setInvoicePaidDate] = useState('');
  const [notes, setNotes] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const { data: invoice, isLoading } = useQuery<InvoiceRow | null>({
    queryKey: ['invoices', eventId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select('*')
        .eq('event_id', eventId)
        .eq('invoice_type', 'venue_partner')
        .maybeSingle();
      if (error) {
        // Column may not exist yet — return null gracefully
        console.warn('VenuePartnerInvoiceCard: invoices query failed', error.message);
        return null;
      }
      return data as InvoiceRow | null;
    },
    enabled: !!eventId,
  });

  // Hydrate form from fetched data once
  React.useEffect(() => {
    if (!hydrated && invoice !== undefined) {
      if (invoice) {
        setAmount(invoice.amount != null ? String(invoice.amount) : '');
        setInvoiceSentDate(invoice.sent_at ? invoice.sent_at.slice(0, 10) : '');
        setInvoicePaidDate(invoice.paid_at ? invoice.paid_at.slice(0, 10) : '');
        setNotes(invoice.notes ?? '');
      }
      setHydrated(true);
    }
  }, [invoice, hydrated]);

  const upsertInvoice = async (overrides: Partial<InvoiceRow> = {}) => {
    const payload: InvoiceRow = {
      event_id: eventId,
      invoice_type: 'venue_partner',
      amount: amount ? parseFloat(amount) : null,
      sent_at: invoiceSentDate ? new Date(invoiceSentDate).toISOString() : null,
      paid_at: invoicePaidDate ? new Date(invoicePaidDate).toISOString() : null,
      notes: notes || null,
      payment_status: overrides.paid_at !== undefined
        ? (overrides.paid_at ? 'paid' : 'unpaid')
        : invoice?.paid_at
          ? 'paid'
          : invoice?.sent_at
            ? 'partial'
            : 'unpaid',
      ...overrides,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('invoices')
      .upsert(payload, { onConflict: 'event_id,invoice_type' });

    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['invoices', eventId] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertInvoice();
      toast.success('Invoice saved');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to save invoice: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSent = async () => {
    setActionLoading('sent');
    try {
      const sentAt = new Date().toISOString();
      setInvoiceSentDate(sentAt.slice(0, 10));
      await upsertInvoice({ sent_at: sentAt });
      toast.success('Invoice marked as sent');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading('paid');
    try {
      const paidAt = new Date().toISOString();
      setInvoicePaidDate(paidAt.slice(0, 10));
      await upsertInvoice({ paid_at: paidAt, payment_status: 'paid' });
      toast.success('Invoice marked as paid');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Venue Partner Invoice</span>
            {venueName && (
              <span className="text-sm font-normal text-muted-foreground">— {venueName}</span>
            )}
          </div>
          {getStatusBadge(isLoading ? undefined : invoice)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading invoice…
          </div>
        ) : (
          <div className="space-y-4">
            {/* Amount */}
            <div className="space-y-1">
              <Label htmlFor="vp-amount" className="text-xs font-medium">Invoice Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="vp-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="vp-sent-date" className="text-xs font-medium">Invoice Sent Date</Label>
                <Input
                  id="vp-sent-date"
                  type="date"
                  value={invoiceSentDate}
                  onChange={(e) => setInvoiceSentDate(e.target.value)}
                />
                {invoice?.sent_at && (
                  <p className="text-xs text-muted-foreground">
                    Sent {safeFormatDate(invoice.sent_at, 'PPP', '')}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="vp-paid-date" className="text-xs font-medium">Invoice Paid Date</Label>
                <Input
                  id="vp-paid-date"
                  type="date"
                  value={invoicePaidDate}
                  onChange={(e) => setInvoicePaidDate(e.target.value)}
                />
                {!invoicePaidDate && (
                  <p className="text-xs text-muted-foreground">Leave blank if unpaid</p>
                )}
                {invoice?.paid_at && (
                  <p className="text-xs text-emerald-600">
                    Paid {safeFormatDate(invoice.paid_at, 'PPP', '')}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="vp-notes" className="text-xs font-medium">Notes</Label>
              <Textarea
                id="vp-notes"
                placeholder="Invoice number, payment method, etc."
                className="resize-none text-sm"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Save */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={saving || actionLoading !== null}
              className="w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleMarkSent}
                disabled={saving || actionLoading !== null || !!invoice?.sent_at}
                className="flex-1"
              >
                {actionLoading === 'sent' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Mark as Sent
              </Button>
              <Button
                size="sm"
                onClick={handleMarkPaid}
                disabled={saving || actionLoading !== null || !!invoice?.paid_at}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {actionLoading === 'paid' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Mark as Paid
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

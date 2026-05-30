import React, { useState } from 'react';
import { DollarSign, CheckCircle2, Circle, ToggleLeft, ToggleRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventReadiness } from '@/hooks/useEventReadiness';
import { safeFormatDate } from '@/utils/dateHelpers';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EventPaymentSectionProps {
  readiness: EventReadiness;
}

export const EventPaymentSection: React.FC<EventPaymentSectionProps> = ({ readiness }) => {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-payment', {
        body: { event_id: readiness.event_id },
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['event-readiness'] });
      const updated = (data?.updated ?? []) as string[];
      if (updated.length > 0) {
        toast.success(`Synced from Stripe: ${updated.join(', ')}`);
      } else if (data?.deposit_found || data?.balance_found) {
        toast.info('Stripe confirms payment — already up to date.');
      } else {
        toast.warning('No paid Stripe sessions found for this event.');
      }
    } catch (err: any) {
      toast.error(`Verify failed: ${err.message || 'Unknown error'}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleToggle = async (field: 'deposit' | 'balance') => {
    setToggling(field);
    try {
      const isPaid = field === 'deposit' ? readiness.deposit_paid : readiness.balance_paid;
      const updateData: Record<string, unknown> = {};

      if (field === 'deposit') {
        updateData.deposit_paid = !isPaid;
        updateData.deposit_paid_at = !isPaid ? new Date().toISOString() : null;
      } else {
        updateData.balance_paid = !isPaid;
        updateData.balance_paid_at = !isPaid ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from('event_notification_history')
        .update(updateData)
        .eq('id', readiness.event_id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['event-readiness'] });
      toast.success(`${field === 'deposit' ? 'Deposit' : 'Balance'} marked as ${!isPaid ? 'paid' : 'unpaid'}`);
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message || 'Unknown error'}`);
    } finally {
      setToggling(null);
    }
  };

  const items = [
    {
      label: 'Deposit',
      field: 'deposit' as const,
      done: !!readiness.deposit_paid,
      amount: readiness.deposit_amount,
      date: readiness.deposit_paid_at,
    },
    {
      label: 'Balance',
      field: 'balance' as const,
      done: !!readiness.balance_paid,
      amount: readiness.balance_due,
      date: readiness.balance_paid_at,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Payment Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
                <span>{item.label}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleToggle(item.field)}
                    disabled={toggling !== null}
                    className="ml-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    title={`Mark ${item.label.toLowerCase()} as ${item.done ? 'unpaid' : 'paid'}`}
                  >
                    {toggling === item.field ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : item.done ? (
                      <ToggleRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <div className="text-right">
                {item.amount != null && (
                  <span className="font-medium">${Number(item.amount).toLocaleString()}</span>
                )}
                {item.done && item.date && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {safeFormatDate(item.date, 'MMM d', '')}
                  </span>
                )}
                {!item.done && <span className="text-muted-foreground">Pending</span>}
              </div>
            </div>
          ))}
          {readiness.stripe_payment_intent_id && (
            <p className="text-xs text-muted-foreground border-t pt-2">
              Stripe: {readiness.stripe_payment_intent_id}
            </p>
          )}
          {isAdmin && (
            <div className="border-t pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleVerify}
                disabled={verifying}
                className="w-full"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Verify with Stripe
              </Button>
              <p className="text-[11px] text-muted-foreground mt-1 text-center">
                Checks Stripe directly for paid sessions tagged to this event.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

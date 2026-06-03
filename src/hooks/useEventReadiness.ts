import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventReadiness {
  event_id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
  package_type: string | null;
  coordinator_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  guest_count: number | null;
  notes: string | null;
  contract_signed: boolean | null;
  contract_signed_at: string | null;
  deposit_paid: boolean | null;
  deposit_amount: number | null;
  deposit_paid_at: string | null;
  balance_paid: boolean | null;
  balance_due: number | null;
  balance_paid_at: string | null;
  stripe_payment_intent_id: string | null;
  assignment_id: string | null;
  vendor_user_id: string | null;
  vendor_status: string | null;
  vendor_confirmed: boolean | null;
  vendor_confirmed_at: string | null;
  vendor_files_uploaded: boolean | null;
  vendor_first_name: string | null;
  vendor_last_name: string | null;
  vendor_company: string | null;
  vendor_type: string | null;
  music_sheet_id: string | null;
  music_sheet_submitted: boolean | null;
  first_dance: string | null;
  last_dance: string | null;
  fully_ready: boolean | null;
  days_until_event: number | null;
}

export const useEventReadiness = (eventId?: string) => {
  return useQuery({
    queryKey: ['event-readiness', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase.rpc('get_upcoming_event_readiness', {
        p_event_id: eventId,
        p_limit: 1,
      });

      if (error) {
        if (error.message?.includes('Access denied')) return null;
        throw error;
      }
      const rows = data as unknown as EventReadiness[];
      return rows?.[0] ?? null;
    },
    enabled: !!eventId,
  });
};

export const useUpcomingReadiness = (limit = 10) => {
  return useQuery({
    queryKey: ['upcoming-readiness', limit],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_upcoming_event_readiness', {
        p_from_date: today,
        p_limit: limit,
      });

      if (error) {
        if (error.message?.includes('Access denied')) return [];
        throw error;
      }
      return (data || []) as unknown as EventReadiness[];
    },
  });
};

export const getReadinessLevel = (event: EventReadiness): 'green' | 'yellow' | 'red' => {
  const checks = [
    event.contract_signed,
    event.deposit_paid,
    event.vendor_confirmed,
    event.music_sheet_submitted,
  ];
  const passed = checks.filter(Boolean).length;
  if (passed === checks.length) return 'green';
  if (passed >= 2) return 'yellow';
  return 'red';
};

export const getReadinessItems = (event: EventReadiness) => [
  { label: 'Contract Signed', done: !!event.contract_signed, date: event.contract_signed_at },
  { label: 'Deposit Paid', done: !!event.deposit_paid, date: event.deposit_paid_at },
  { label: 'Balance Paid', done: !!event.balance_paid, date: event.balance_paid_at },
  { label: 'Vendor Assigned', done: !!event.assignment_id, date: event.vendor_confirmed_at },
  { label: 'Vendor Confirmed', done: !!event.vendor_confirmed, date: event.vendor_confirmed_at },
  { label: 'Vibe Sheet Submitted', done: !!event.music_sheet_submitted, date: null },
  { label: 'Vendor Files Uploaded', done: !!event.vendor_files_uploaded, date: null },
];

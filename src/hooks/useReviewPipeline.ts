import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReviewPipelineRow {
  id: string;
  email: string;
  bride_first_name: string;
  groom_first_name: string;
  status: string;
  reminder_number: number;
  next_send_at: string | null;
  last_sent_at: string | null;
  stopped: boolean;
  stopped_reason: string | null;
  event_id: string | null;
  event_date: string | null;
  created_at: string;
}

export function useReviewPipeline() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['review-pipeline'],
    queryFn: async (): Promise<ReviewPipelineRow[]> => {
      const { data, error } = await supabase
        .from('vp_scheduled_review_emails' as any)
        .select('*')
        .order('next_send_at', { ascending: true, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewPipelineRow[];
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vp_scheduled_review_emails' as any)
        .update({ stopped: true, stopped_reason: 'admin_stopped' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Reminders stopped', description: 'No further review emails will be sent for this couple.' });
      queryClient.invalidateQueries({ queryKey: ['review-pipeline'] });
    },
    onError: (e: any) => {
      toast({ title: 'Failed to stop reminders', description: e.message, variant: 'destructive' });
    },
  });

  const sendNowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('admin-send-review', {
        body: { record_id: id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Review invite sent', description: 'Email delivered to the couple.' });
      queryClient.invalidateQueries({ queryKey: ['review-pipeline'] });
    },
    onError: (e: any) => {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
    },
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    stopReminders: stopMutation.mutate,
    sendNow: sendNowMutation.mutate,
    isSending: sendNowMutation.isPending,
  };
}

export function getCadencePhase(reminderNumber: number): string {
  if (reminderNumber === 0) return 'Initial';
  if (reminderNumber <= 3) return `Weekly nudge ${reminderNumber}/3`;
  if (reminderNumber <= 6) return `Bi-weekly nudge ${reminderNumber - 3}/3`;
  return `Monthly nudge ${reminderNumber - 6}`;
}

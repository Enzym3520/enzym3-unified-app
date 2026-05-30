import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MeetingTranscription {
  id: string;
  booking_id: string;
  recorded_by: string;
  raw_transcript: string;
  ai_summary: string | null;
  action_items: { text: string; done: boolean }[];
  duration_seconds: number | null;
  created_at: string;
}

export function useMeetingTranscription(bookingId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['meeting-transcription', bookingId],
    queryFn: async (): Promise<MeetingTranscription | null> => {
      if (!bookingId) return null;
      const { data, error } = await (supabase as any)
        .from('meeting_transcriptions')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as MeetingTranscription | null;
    },
    enabled: !!bookingId,
  });

  const summarizeMutation = useMutation({
    mutationFn: async ({
      transcript,
      durationSeconds,
    }: {
      transcript: string;
      durationSeconds: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('summarize-meeting', {
        body: { bookingId, transcript, durationSeconds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcription', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-transcriptions-check'] });
    },
    onError: () => {
      import('sonner').then(({ toast }) => toast.error('Failed to summarize meeting. Please try again.'));
    },
  });

  return { ...query, summarizeMutation };
}

/** Check which booking IDs have transcriptions (for badge indicators) */
export function useTranscriptionCheck(bookingIds: string[]) {
  return useQuery({
    queryKey: ['meeting-transcriptions-check', bookingIds],
    queryFn: async (): Promise<Set<string>> => {
      if (bookingIds.length === 0) return new Set();
      const { data, error } = await (supabase as any)
        .from('meeting_transcriptions')
        .select('booking_id')
        .in('booking_id', bookingIds)
        .limit(500);
      if (error) throw error;
      return new Set((data || []).map((d: any) => d.booking_id));
    },
    enabled: bookingIds.length > 0,
  });
}

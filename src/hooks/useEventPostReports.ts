import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EventPostReport {
  id: string;
  event_id: string;
  energy_level: number | null;
  crowd_age_range: string | null;
  estimated_crowd_size: number | null;
  top_genres: string[] | null;
  hit_songs: string[] | null;
  missed_songs: string[] | null;
  venue_sound_rating: number | null;
  venue_lighting_rating: number | null;
  coordinator_rating: number | null;
  coordinator_notes: string | null;
  venue_notes: string | null;
  would_book_venue_again: boolean | null;
  highlight_notes: string | null;
  overall_rating: number | null;
  reported_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type EventPostReportInput = Omit<EventPostReport, 'id' | 'created_at' | 'updated_at'>;

export function useEventPostReports() {
  const [reports, setReports] = useState<EventPostReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_post_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setReports((data as EventPostReport[]) || []);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Failed to fetch post-event reports:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getReportForEvent = (eventId: string): EventPostReport | undefined => {
    return reports.find(r => r.event_id === eventId);
  };

  const createReport = async (eventId: string, data: Partial<EventPostReportInput>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('event_post_reports')
        .insert({
          event_id: eventId,
          reported_by: user.id,
          energy_level: data.energy_level ?? null,
          crowd_age_range: data.crowd_age_range ?? null,
          estimated_crowd_size: data.estimated_crowd_size ?? null,
          top_genres: data.top_genres ?? null,
          hit_songs: data.hit_songs ?? null,
          missed_songs: data.missed_songs ?? null,
          venue_sound_rating: data.venue_sound_rating ?? null,
          venue_lighting_rating: data.venue_lighting_rating ?? null,
          coordinator_rating: data.coordinator_rating ?? null,
          coordinator_notes: data.coordinator_notes ?? null,
          venue_notes: data.venue_notes ?? null,
          would_book_venue_again: data.would_book_venue_again ?? null,
          highlight_notes: data.highlight_notes ?? null,
          overall_rating: data.overall_rating ?? null,
        });

      if (error) throw error;

      toast({ title: 'Report Filed', description: 'Post-event report saved successfully.' });
      await fetchReports();
      return true;
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message || 'Could not save report.', variant: 'destructive' });
      return false;
    }
  };

  const updateReport = async (reportId: string, data: Partial<EventPostReportInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('event_post_reports')
        .update({
          energy_level: data.energy_level ?? null,
          crowd_age_range: data.crowd_age_range ?? null,
          estimated_crowd_size: data.estimated_crowd_size ?? null,
          top_genres: data.top_genres ?? null,
          hit_songs: data.hit_songs ?? null,
          missed_songs: data.missed_songs ?? null,
          venue_sound_rating: data.venue_sound_rating ?? null,
          venue_lighting_rating: data.venue_lighting_rating ?? null,
          coordinator_rating: data.coordinator_rating ?? null,
          coordinator_notes: data.coordinator_notes ?? null,
          venue_notes: data.venue_notes ?? null,
          would_book_venue_again: data.would_book_venue_again ?? null,
          highlight_notes: data.highlight_notes ?? null,
          overall_rating: data.overall_rating ?? null,
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({ title: 'Report Updated', description: 'Post-event report updated successfully.' });
      await fetchReports();
      return true;
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message || 'Could not update report.', variant: 'destructive' });
      return false;
    }
  };

  return { reports, loading, fetchReports, getReportForEvent, createReport, updateReport };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useVendorEventNotes(assignmentId: string | undefined) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notesRef = useRef(notes);
  const { toast } = useToast();

  // Keep ref in sync
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // Load notes
  useEffect(() => {
    if (!assignmentId) return;
    supabase
      .from('event_dj_assignments')
      .select('notes')
      .eq('id', assignmentId)
      .maybeSingle()
      .then(({ data }) => {
        setNotes(data?.notes || '');
        setLoaded(true);
      });
  }, [assignmentId]);

  const saveNotes = useCallback(async (value: string) => {
    if (!assignmentId) return;
    setSaving(true);
    const { error } = await supabase
      .from('event_dj_assignments')
      .update({ notes: value })
      .eq('id', assignmentId);
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    }
  }, [assignmentId, toast]);

  const updateNotes = useCallback((value: string) => {
    setNotes(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNotes(value), 1500);
  }, [saveNotes]);

  // Cleanup: flush pending save on unmount
  useEffect(() => () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveNotes(notesRef.current);
    }
  }, [saveNotes]);

  return { notes, updateNotes, saving, loaded };
}

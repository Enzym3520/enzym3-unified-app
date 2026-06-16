import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Reminder, CreateReminderData, ReminderStats } from '@/types/reminder';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useReminders = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reminders = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .limit(1000);

      if (error) throw error;
      return (data || []) as Reminder[];
    },
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch reminders') : null;

  const createReminderMutation = useMutation({
    mutationFn: async (reminderData: CreateReminderData) => {
      const { data, error } = await supabase
        .from('reminders')
        .insert([reminderData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
    onError: () => {
      toast({ title: 'Failed to create reminder', variant: 'destructive' });
    },
  });

  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Reminder> }) => {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
    onError: () => {
      toast({ title: 'Failed to update reminder', variant: 'destructive' });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
    onError: () => {
      toast({ title: 'Failed to delete reminder', variant: 'destructive' });
    },
  });

  const createReminder = async (reminderData: CreateReminderData) => {
    return createReminderMutation.mutateAsync(reminderData);
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    return updateReminderMutation.mutateAsync({ id, updates });
  };

  const deleteReminder = async (id: string) => {
    return deleteReminderMutation.mutateAsync(id);
  };

  const markReminderAsSent = async (id: string) => {
    return updateReminder(id, { 
      status: 'sent', 
      sent_at: new Date().toISOString() 
    });
  };

  const markReminderAsCompleted = async (id: string) => {
    return updateReminder(id, { 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    });
  };

  const calculateStats = (): ReminderStats => {
    const now = new Date();
    return {
      totalReminders: reminders.length,
      pendingReminders: reminders.filter(r => r.status === 'pending').length,
      sentReminders: reminders.filter(r => r.status === 'sent').length,
      overdueReminders: reminders.filter(r => r.status === 'pending' && new Date(r.scheduled_date) < now).length,
      upcomingReminders: reminders.filter(r => r.status === 'pending' && new Date(r.scheduled_date) >= now).length,
    };
  };

  // Real-time subscription. Unique channel name per mount: this hook is used by
  // more than one component (RemindersView + CoordinatorApproval), and a shared
  // static name would let them collide / tear down each other's subscription.
  useEffect(() => {
    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`reminders-realtime-${suffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reminders'] });
        }
      )
      .subscribe((status, err) => {
        if (import.meta.env.DEV && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
          console.warn('Reminders realtime channel error:', status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    reminders,
    loading,
    error,
    refetch,
    createReminder,
    updateReminder,
    deleteReminder,
    markReminderAsSent,
    markReminderAsCompleted,
    stats: calculateStats()
  };
};

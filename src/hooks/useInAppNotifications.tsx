import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InAppNotification {
  id: string;
  user_id: string;
  type: 'upgrade_order' | 'music_sheet_created' | 'music_sheet_updated' | 'message' | string;
  title: string;
  content: string;
  wedding_id?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export const useInAppNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['in-app-notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as InAppNotification[];
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useInAppNotifications] markAsRead failed:', error.message);
      toast({ title: 'Failed to mark notification as read', variant: 'destructive' });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications'] });
      toast({
        title: 'All notifications marked as read',
      });
    },
    onError: () => {
      toast({ title: 'Failed to mark all as read', variant: 'destructive' });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications'] });
      toast({
        title: 'Notification deleted',
      });
    },
    onError: () => {
      toast({ title: 'Failed to delete notification', variant: 'destructive' });
    },
  });

  // NOTE: the realtime subscription + toast/sound side-effect lives in
  // useNotificationRealtime (mounted once in NotificationBell). Keeping it out of
  // this data hook is what lets the bell, dropdown, and every NotificationItem row
  // call useInAppNotifications without each opening its own duplicate channel.

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
  };
};

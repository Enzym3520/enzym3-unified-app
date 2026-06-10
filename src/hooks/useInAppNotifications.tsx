import React from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { playNotificationSound } from '@/utils/notificationSound';
import { buildNotificationHref } from '@/components/staff/notifications/notificationTypeMap';

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
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  // Stable ref for toast so it doesn't cause channel re-subscription
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Real-time subscription with proper cleanup
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const channel = supabase
        .channel('notifications-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;
            const newNotification = payload.new as InAppNotification;
            playNotificationSound();
            const href = buildNotificationHref({
              type: newNotification.type,
              wedding_id: newNotification.wedding_id,
              metadata: newNotification.metadata,
            });
            toastRef.current({
              title: newNotification.title,
              description: newNotification.content,
              action: href ? (
                <ToastAction altText="View" onClick={() => navigateRef.current(href)}>
                  View
                </ToastAction>
              ) : undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['in-app-notifications'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (!isMounted) return;
            queryClient.invalidateQueries({ queryKey: ['in-app-notifications'] });
          }
        )
        .subscribe((status, err) => {
          if (import.meta.env.DEV && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
            console.warn('In-app notifications channel error:', status, err);
          }
        });

      channelRef.current = channel;
    };

    setup();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);

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

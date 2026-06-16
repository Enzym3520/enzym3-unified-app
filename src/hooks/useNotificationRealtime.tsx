import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { playNotificationSound } from '@/utils/notificationSound';
import { resolveNotificationRoute } from '@/utils/notificationRouting';
import type { InAppNotification } from '@/hooks/useInAppNotifications';

/**
 * Singleton realtime subscription for staff in-app notifications.
 *
 * IMPORTANT: Call this in EXACTLY ONE always-mounted component (NotificationBell).
 * The subscription + toast + sound is a side-effect and must not be duplicated.
 * The list/count/actions live in useInAppNotifications, which is safe to call from
 * many components because react-query dedupes the underlying query.
 *
 * Previously the subscription lived inside useInAppNotifications, so every consumer
 * (the bell, the dropdown, and one per NotificationItem row) opened its own channel
 * — all sharing the hardcoded name 'notifications-channel'. That caused duplicate
 * toasts/sounds and unstable delivery ("notifications sometimes don't route").
 */
export const useNotificationRealtime = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Stable refs so the effect subscribes once and never re-runs on render.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // Unique channel name (user + random suffix) to avoid collisions with any
      // other subscriber — matches the pattern used by the rest of the codebase.
      const suffix = Math.random().toString(36).slice(2);
      channel = supabase
        .channel(`notifications-${user.id}-${suffix}`)
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
            const href = resolveNotificationRoute(newNotification, 'staff');
            toastRef.current({
              title: newNotification.title,
              description: newNotification.content,
              action: (
                <ToastAction altText="View" onClick={() => navigateRef.current(href)}>
                  View
                </ToastAction>
              ),
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
    };

    setup();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [queryClient]);
};

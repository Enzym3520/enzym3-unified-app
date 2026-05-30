import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const vapidKeyRef = useRef<string | null>(null);
  const vapidFetchedRef = useRef(false);

  // Fetch VAPID public key from edge function (once)
  const fetchVapidKey = useCallback(async () => {
    if (vapidFetchedRef.current) return vapidKeyRef.current;
    vapidFetchedRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (error || !data?.vapidPublicKey) {
        logger.error('Failed to fetch VAPID key:', error);
        return null;
      }
      vapidKeyRef.current = data.vapidPublicKey;
      return data.vapidPublicKey;
    } catch (err) {
      logger.error('Error fetching VAPID key:', err);
      return null;
    }
  }, []);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SW ready timeout')), 3000)
        ),
      ]);
      setSwRegistration(registration);
      const existingSubscription = await (registration as any).pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      logger.error('SW not available or timed out:', error);
    }
  }, []);

  const refreshPermissionStatus = useCallback(async () => {
    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    await checkExistingSubscription();
    toast({
      title: 'Status Refreshed',
      description: `Permission: ${currentPermission}`,
    });
  }, [checkExistingSubscription]);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
      fetchVapidKey();

      // Monitor permission changes via Permissions API
      let permissionStatus: PermissionStatus | null = null;
      const handlePermissionChange = () => {
        setPermission(Notification.permission);
        checkExistingSubscription();
      };

      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'notifications' as PermissionName })
          .then(status => {
            permissionStatus = status;
            status.addEventListener('change', handlePermissionChange);
          })
          .catch(() => {});
      }

      // Re-check permission when tab regains focus (user may have changed browser settings)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          const current = Notification.permission;
          setPermission(current);
          if (current === 'granted') {
            checkExistingSubscription();
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (permissionStatus) {
          permissionStatus.removeEventListener('change', handlePermissionChange);
        }
      };
    }
  }, [checkExistingSubscription, fetchVapidKey]);

  const subscribe = useCallback(async () => {
    if (!isSupported || Notification.permission !== 'granted') return null;

    try {
      const vapidKey = await fetchVapidKey();
      if (!vapidKey) {
        logger.warn('Push notifications not configured: VAPID key missing');
        return null;
      }

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SW ready timeout')), 3000)
        ),
      ]);
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);

      const newSubscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      setSubscription(newSubscription);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const subJson = newSubscription.toJSON();
        const { error: upsertError } = await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh_key: subJson.keys!.p256dh,
          auth_key: subJson.keys!.auth,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }, { onConflict: 'endpoint' });

        if (upsertError) {
          logger.error('Failed to save push subscription:', upsertError);
          toast({
            title: 'Subscription Warning',
            description: 'Notifications enabled locally but failed to save to server. You may not receive push notifications.',
            variant: 'destructive',
          });
          return newSubscription;
        }
      }

      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications',
      });

      return newSubscription;
    } catch (error) {
      logger.error('Error subscribing to push:', error);
      toast({
        title: 'Subscription Failed',
        description: 'Failed to enable push notifications',
        variant: 'destructive',
      });
      return null;
    }
  }, [isSupported, fetchVapidKey]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribe();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error requesting permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to request notification permission',
        variant: 'destructive',
      });
      return false;
    }
  }, [isSupported, subscribe]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }

      setSubscription(null);
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications',
      });
    } catch (error) {
      logger.error('Error unsubscribing:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications',
        variant: 'destructive',
      });
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    swRegistration,
    requestPermission,
    subscribe,
    unsubscribe,
    refreshPermissionStatus,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

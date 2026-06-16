import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const PUSH_PREF_KEY = 'enzym3_push_enabled';

async function getVapidPublicKey(): Promise<string> {
  // Fetch from edge function — avoids needing VITE_VAPID_PUBLIC_KEY in the build env
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error || !data?.vapidPublicKey) return '';
    return data.vapidPublicKey as string;
  } catch {
    return '';
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


export function getPushPref(): boolean {
  try {
    return localStorage.getItem(PUSH_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function usePushSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);

    if (supported && user?.id) {
      // Check existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
          if (sub) {
            try { localStorage.setItem(PUSH_PREF_KEY, 'true'); } catch {}
          }
        });
      });
    }
  }, [user?.id]);

  const subscribe = useCallback(async () => {
    if (!user?.id || !isSupported) return false;

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setLoading(false);
        return false;
      }

      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        console.error('VAPID public key not available');
        setLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
        });
      }

      const subJson = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh || '';
      const auth = subJson.keys?.auth || '';

      // Save to Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh,
            auth,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'user_id,endpoint' }
        );

      if (error) {
        console.error('Error saving push subscription:', error);
        setLoading(false);
        return false;
      }

      setIsSubscribed(true);
      try { localStorage.setItem(PUSH_PREF_KEY, 'true'); } catch {}
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Push subscription error:', err);
      setLoading(false);
      return false;
    }
  }, [user?.id, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user?.id) return false;

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        // Remove from Supabase
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      try { localStorage.setItem(PUSH_PREF_KEY, 'false'); } catch {}
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      setLoading(false);
      return false;
    }
  }, [user?.id]);

  return { isSubscribed, isSupported, loading, subscribe, unsubscribe };
}

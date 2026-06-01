import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";


function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setIsSubscribed(false);
        return;
      }

      await registration.update().catch(() => undefined);
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const handler = () => refreshStatus();
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [refreshStatus]);

  const subscribe = useCallback(async () => {
    if (!user || !("serviceWorker" in navigator)) return;
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      // Get VAPID key via Supabase client (handles URL + auth automatically)
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("get-vapid-key");
      if (vapidError) throw new Error("Failed to fetch VAPID key");
      const { vapidKey } = vapidData;

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("Install the app again to enable notifications.");
      await registration.update().catch(() => undefined);

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh_key: json.keys?.p256dh ?? "",
          auth_key: json.keys?.auth ?? "",
          device_info: { userAgent: navigator.userAgent } as any,
        },
        { onConflict: "endpoint" }
      );
      if (error) throw error;

      setIsSubscribed(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
    setLoading(false);
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        if (error) throw error;
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
    setLoading(false);
  }, [user]);

  return { permission, isSubscribed, loading, subscribe, unsubscribe, supported: "Notification" in window };
}

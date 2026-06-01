import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { flushQueue } from "@/lib/offline-queue";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const syncOfflineQueue = useCallback(async () => {
    const synced = await flushQueue(async (mutation) => {
      const table = supabase.from(mutation.table as any);
      let result: { error: any };

      if (mutation.operation === "insert") {
        result = await (table as any).insert(mutation.payload);
      } else if (mutation.operation === "update" && mutation.filters) {
        let query = (table as any).update(mutation.payload);
        for (const [key, val] of Object.entries(mutation.filters)) {
          query = query.eq(key, val);
        }
        result = await query;
      } else {
        return false;
      }

      return !result.error;
    });

    if (synced > 0) {
      toast.success(`Synced ${synced} offline change${synced > 1 ? "s" : ""}`);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online");
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline — changes will sync when reconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncOfflineQueue]);

  return { isOnline };
}

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadCount() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ["unread-notification-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return 0;
      const { count: c } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      return c ?? 0;
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    try {
      const nav = navigator as Navigator & {
        setAppBadge?: (n?: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
      };
      if (!("setAppBadge" in nav)) return;
      if (count > 0) nav.setAppBadge?.(count);
      else nav.clearAppBadge?.();
    } catch {
      // ignore
    }
  }, [count]);

  useEffect(() => {
    if (!user) return;
    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`unread-badge-${user.id}-${suffix}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["unread-notification-count"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return count;
}

export function NotificationBadge() {
  const count = useUnreadCount();
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

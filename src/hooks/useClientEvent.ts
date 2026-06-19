import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { resolveClientEvent } from "@/lib/resolveClientEvent";

/**
 * Shared hook that wraps the resolveClientEvent pattern used by all client-facing pages.
 *
 * Usage:
 *   const { event, loading, userId, refetch } = useClientEvent<MyType>(selectColumns);
 */
export function useClientEvent<T = any>(select: string) {
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = useCallback(async () => {
    if (authLoading || !user?.email) return;
    try {
      const data = await resolveClientEvent<T>(
        user.id,
        user.email!,
        select,
        (user.user_metadata as any)?.invite_code ?? null
      );
      setEvent(data);
    } catch (error) {
      console.error("useClientEvent fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, select]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    setEvent,
    loading: loading || authLoading,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    user,
    refetch: fetchEvent,
  };
}

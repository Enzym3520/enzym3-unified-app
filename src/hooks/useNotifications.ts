import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { getNotificationRoute } from '@/utils/notificationRoutes';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  read: boolean;
  created_at: string;
  wedding_id: string | null;
  metadata: Record<string, unknown> | null;
}

const SOUND_PREF_KEY = 'enzym3_notification_sound';

export function getNotificationSoundPref(): boolean {
  try {
    const val = localStorage.getItem(SOUND_PREF_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setNotificationSoundPref(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_PREF_KEY, String(enabled));
  } catch {
    // storage unavailable
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playSound = useCallback(() => {
    if (!getNotificationSoundPref()) return;
    try {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Autoplay blocked — user hasn't interacted yet, silently ignore
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch initial unread count
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };

    fetchUnread();
  }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
          const n = payload.new;
          setUnreadCount((c) => c + 1);
          playSound();
          const route = getNotificationRoute(
            String(n.type ?? ''),
            (n.metadata as Record<string, any>) ?? null,
            n.wedding_id ? String(n.wedding_id) : null,
          );
          toast(String(n.title ?? 'New Notification'), {
            description: n.content ? String(n.content) : undefined,
            duration: 5000,
            action: route ? { label: 'View', onClick: () => navigate(route) } : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, playSound, navigate]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    await supabase
      .from('notifications')
      .update({ is_read: true } as any)
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(0);
  }, [user?.id]);

  return { unreadCount, markAllRead };
}

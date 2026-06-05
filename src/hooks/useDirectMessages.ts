import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  wedding_id: string | null;
  created_at: string;
  read_at: string | null;
  sender_name?: string;
  recipient_name?: string;
}

export interface DMThread {
  partner_id: string;
  partner_name: string;
  partner_role: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const useDirectMessageThreads = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  return useQuery({
    queryKey: ['dm-threads', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];

      // Limit to 2000 most recent messages to prevent silent truncation
      // at Supabase's default 1000-row cap. If DM volume grows significantly,
      // this should be replaced with a server-side RPC that aggregates threads.
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('sender_id, recipient_id, content, created_at, read_at')
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;
      if (!messages?.length) return [];

      // Group by conversation partner
      const threadMap = new Map<string, { last_message: string; last_message_at: string; unread_count: number }>();
      for (const msg of messages) {
        const partnerId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;
        if (!threadMap.has(partnerId)) {
          threadMap.set(partnerId, {
            last_message: msg.content || '📎 File',
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }
        if (msg.sender_id !== currentUserId && !msg.read_at) {
          const t = threadMap.get(partnerId)!;
          t.unread_count += 1;
        }
      }

      // Fetch partner profiles
      const partnerIds = Array.from(threadMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, role')
        .in('id', partnerIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const threads: DMThread[] = [];
      for (const [pid, thread] of threadMap) {
        const p = profileMap.get(pid);
        threads.push({
          partner_id: pid,
          partner_name: p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.company_name || 'Unknown' : 'Unknown',
          partner_role: p?.role || null,
          ...thread,
        });
      }

      threads.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      return threads;
    },
    enabled: !!currentUserId,
  });
};

interface UseDirectMessagesOptions {
  partnerId: string | undefined;
  enabled?: boolean;
}

export const useDirectMessages = ({ partnerId, enabled = true }: UseDirectMessagesOptions) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['direct-messages', partnerId, currentUserId],
    queryFn: async () => {
      if (!partnerId || !currentUserId) return [];

      // Fetch latest messages descending with explicit limit, then reverse for chronological display.
      // This ensures newest messages are never dropped at Supabase's row cap.
      // For true long-history support, migrate to cursor-based pagination.
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(first_name, last_name, company_name),
          recipient:profiles!direct_messages_recipient_id_fkey(first_name, last_name, company_name)
        `)
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Reverse to chronological order for display
      return ((data || []).reverse()).map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        content: msg.content,
        file_url: msg.file_url,
        file_name: msg.file_name,
        wedding_id: msg.wedding_id,
        created_at: msg.created_at,
        read_at: msg.read_at,
        sender_name: msg.sender ? [msg.sender.first_name, msg.sender.last_name].filter(Boolean).join(' ') || msg.sender.company_name : undefined,
        recipient_name: msg.recipient ? [msg.recipient.first_name, msg.recipient.last_name].filter(Boolean).join(' ') || msg.recipient.company_name : undefined,
      } as DirectMessage));
    },
    enabled: enabled && !!partnerId && !!currentUserId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, fileUrl, fileName }: { content: string; fileUrl?: string; fileName?: string }) => {
      if (!partnerId || !currentUserId) throw new Error('Missing partner or user');

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: partnerId,
          content: content.trim(),
          file_url: fileUrl || null,
          file_name: fileName || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['dm-threads', currentUserId] });
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!partnerId || !currentUserId) return;
      const { error } = await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', partnerId)
        .eq('recipient_id', currentUserId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['dm-threads', currentUserId] });
    },
    onError: () => {
      toast({ title: 'Failed to mark messages as read', variant: 'destructive' });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!partnerId || !currentUserId || !enabled) return;

    const channel = supabase
      .channel(`dm-${[currentUserId, partnerId].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const msg = payload.new as any;
          if (
            (msg.sender_id === currentUserId && msg.recipient_id === partnerId) ||
            (msg.sender_id === partnerId && msg.recipient_id === currentUserId)
          ) {
            queryClient.invalidateQueries({ queryKey: ['direct-messages', partnerId] });
            queryClient.invalidateQueries({ queryKey: ['dm-threads', currentUserId] });
          }
        }
      )
      .subscribe((status, err) => {
        if (import.meta.env.DEV && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
          console.warn('DM realtime channel error:', status, err);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [partnerId, currentUserId, enabled, queryClient]);

  return {
    messages,
    isLoading,
    currentUserId,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
  };
};

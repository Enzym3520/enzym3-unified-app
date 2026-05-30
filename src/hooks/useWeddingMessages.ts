import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  wedding_id: string;
  sender_id: string;
  sender_role: 'client' | 'admin' | 'moderator' | 'vendor';
  sender_name: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
  file_url: string | null;
  file_name: string | null;
}

interface UseWeddingMessagesOptions {
  weddingId: string | undefined;
  enabled?: boolean;
}

export const useWeddingMessages = ({ weddingId, enabled = true }: UseWeddingMessagesOptions) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const determineRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: adminRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (adminRole) { setCurrentUserRole('admin'); return; }

      const { data: modRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'moderator').maybeSingle();
      if (modRole) { setCurrentUserRole('moderator'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile?.role === 'dj' || profile?.role === 'vendor') { setCurrentUserRole('vendor'); return; }

      setCurrentUserRole('client');
    };
    determineRole();
  }, []);

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['wedding-messages', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];

      // Fetch latest messages descending with explicit limit to prevent silent truncation
      // at Supabase's default 1000-row cap. Reverse in memory for chronological display.
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`*, profiles!chat_messages_sender_id_fkey (first_name, last_name)`)
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Try RPC first, fallback to direct query
      let eventData: any = null;
      const { data: rpcNames, error: rpcErr } = await supabase
        .rpc('get_event_names_for_threads', { p_event_ids: [weddingId] });
      
      if (rpcErr || !rpcNames || rpcNames.length === 0) {
        if (import.meta.env.DEV && rpcErr) {
          console.warn('RPC get_event_names_for_threads failed, using fallback:', rpcErr.message);
        }
        const { data: directEvent } = await supabase
          .from('event_notification_history')
          .select('id, couple_name, event_date, event_type')
          .eq('id', weddingId)
          .maybeSingle();
        eventData = directEvent;
      } else {
        eventData = rpcNames[0] || null;
      }

      const coupleName = eventData?.couple_name || 'Client';

      // Reverse to chronological order for display
      return ((messagesData || []).reverse()).map((msg: any) => {
        let senderName: string | null = null;
        if (msg.sender_role === 'client') {
          senderName = coupleName;
        } else if (msg.profiles) {
          const { first_name, last_name } = msg.profiles;
          senderName = [first_name, last_name].filter(Boolean).join(' ') || null;
        }

        return {
          id: msg.id,
          wedding_id: msg.wedding_id,
          sender_id: msg.sender_id,
          sender_role: msg.sender_role,
          sender_name: senderName,
          content: msg.content,
          created_at: msg.created_at,
          read_at: msg.read_at,
          file_url: msg.file_url || null,
          file_name: msg.file_name || null,
        } as ChatMessage;
      });
    },
    enabled: enabled && !!weddingId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, fileUrl, fileName }: { content: string; fileUrl?: string; fileName?: string }) => {
      if (!weddingId) throw new Error('No wedding ID');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          wedding_id: weddingId,
          sender_id: user.id,
          sender_role: currentUserRole,
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
      queryClient.invalidateQueries({ queryKey: ['wedding-messages', weddingId] });
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!weddingId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('wedding_id', weddingId)
        .neq('sender_id', user.id)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding-messages', weddingId] });
    },
    onError: () => {
      toast({ title: 'Failed to mark messages as read', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!weddingId || !enabled) return;
    const channel = supabase
      .channel(`chat-messages-${weddingId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `wedding_id=eq.${weddingId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['wedding-messages', weddingId] });
      })
      .subscribe((status, err) => {
        if (import.meta.env.DEV && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
          console.warn('Wedding messages realtime channel error:', status, err);
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [weddingId, enabled, queryClient]);

  const unreadCount = messages.filter(m => !m.read_at && m.sender_role === 'client').length;

  return {
    messages,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    unreadCount,
    currentUserRole,
    currentUserId,
    refetch,
  };
};

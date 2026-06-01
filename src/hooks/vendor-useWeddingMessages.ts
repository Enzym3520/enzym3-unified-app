import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  wedding_id: string;
  sender_id: string;
  sender_role: string;
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
  const { user } = useAuth();
  const currentUserId = user?.id || null;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['wedding-messages', weddingId, user?.id],
    queryFn: async () => {
      if (!weddingId || !user) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`*, profiles!chat_messages_sender_id_fkey (first_name, last_name)`)
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: true })
        .limit(5000);

      if (error) throw error;

      let eventData: any = null;
      const { data: rpcNames, error: rpcErr } = await supabase
        .rpc('get_event_names_for_threads', { p_event_ids: [weddingId] });

      if (rpcErr || !rpcNames || rpcNames.length === 0) {
        const { data: directEvent } = await supabase
          .from('vendor_event_details_secure')
          .select('id, couple_name, event_date, event_type')
          .eq('id', weddingId)
          .maybeSingle();
        eventData = directEvent;
      } else {
        eventData = rpcNames[0] || null;
      }

      const coupleName = eventData?.couple_name || 'Client';

      return (data || []).map((msg: any) => {
        let senderName: string | null = null;
        if (msg.sender_role === 'client') {
          senderName = coupleName;
        } else if (msg.profiles) {
          senderName = [msg.profiles.first_name, msg.profiles.last_name].filter(Boolean).join(' ') || null;
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
    enabled: enabled && !!weddingId && !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, fileUrl, fileName }: { content: string; fileUrl?: string; fileName?: string }) => {
      if (!weddingId || !currentUserId) throw new Error('Missing data');

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', currentUserId)
        .single();

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          wedding_id: weddingId,
          sender_id: currentUserId,
          sender_role: 'vendor',
          sender_name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Vendor' : 'Vendor',
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
      queryClient.invalidateQueries({ queryKey: ['event-threads'] });
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!weddingId || !currentUserId) return;
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('wedding_id', weddingId)
        .neq('sender_id', currentUserId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding-messages', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['event-threads'] });
    },
    onError: (e: any) => {
      console.error('Failed to mark messages as read:', e?.message);
    },
  });

  useEffect(() => {
    if (!weddingId || !enabled) return;
    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`chat-messages-${weddingId}-${suffix}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `wedding_id=eq.${weddingId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['wedding-messages', weddingId] });
        queryClient.invalidateQueries({ queryKey: ['event-threads'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [weddingId, enabled, queryClient]);

  return {
    messages,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    currentUserId,
  };
};

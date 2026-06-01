import React, { useState, useMemo, useEffect } from 'react';
import { MessageSquare, Search, Plus, ArrowLeft } from 'lucide-react';
import { parseEventDate } from '@/utils/vendorHelpers';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { relativeTime, getInitials } from '@/utils/chatHelpers';
import { WeddingMessagesPanel } from '@/components/vendor/messaging/WeddingMessagesPanel';
import { DirectMessagesPanel } from '@/components/vendor/messaging/DirectMessagesPanel';
import { NewDirectMessageModal } from '@/components/vendor/messaging/NewDirectMessageModal';
import { useDirectMessageThreads } from '@/hooks/vendor-useDirectMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { format } from 'date-fns';

interface UnifiedThread {
  id: string;
  type: 'event' | 'dm';
  name: string;
  subtitle: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  wedding_id?: string;
  partner_id?: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'event' | 'dm' | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [search, setSearch] = useState('');
  const [newDMOpen, setNewDMOpen] = useState(false);
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Event threads
  const { data: eventThreads, isLoading: eventsLoading } = useQuery({
    queryKey: ['event-threads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('wedding_id, content, created_at, sender_id, read_at')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;
      if (!messages?.length) return [];

      const threadMap = new Map<string, any>();
      for (const msg of messages) {
        if (!threadMap.has(msg.wedding_id)) {
          threadMap.set(msg.wedding_id, {
            wedding_id: msg.wedding_id,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }
        if (msg.sender_id !== user.id && !msg.read_at) {
          threadMap.get(msg.wedding_id).unread_count += 1;
        }
      }

      const ids = Array.from(threadMap.keys());
      if (ids.length === 0) return [];

      let eventMap = new Map<string, any>();
      try {
        const { data: rpcEvents } = await supabase.rpc('get_event_names_for_threads', { p_event_ids: ids });
        eventMap = new Map((rpcEvents || []).map((e: any) => [e.id, e]));
      } catch {
        // Fallback: query through secure view instead of raw table
        const { data: fallbackEvents } = await supabase
          .from('vendor_event_details_secure')
          .select('id, couple_name, event_date, event_type')
          .in('id', ids);
        eventMap = new Map((fallbackEvents || []).map((e: any) => [e.id, e]));
      }

      const result: any[] = [];
      for (const [wid, thread] of threadMap) {
        const ev = eventMap.get(wid);
        result.push({
          ...thread,
          couple_name: ev?.couple_name || 'Unknown',
          event_date: ev?.event_date || '',
          event_type: ev?.event_type || null,
        });
      }
      return result;
    },
    enabled: !!user,
  });

  const { data: dmThreads, isLoading: dmLoading } = useDirectMessageThreads();

  const isLoading = eventsLoading || dmLoading;

  const unifiedThreads = useMemo<UnifiedThread[]>(() => {
    const threads: UnifiedThread[] = [];

    for (const t of eventThreads || []) {
      const datePart = t.event_date ? format(parseEventDate(t.event_date), 'MMM d, yyyy') : '';
      threads.push({
        id: t.wedding_id,
        type: 'event',
        name: t.couple_name,
        subtitle: [datePart, t.event_type].filter(Boolean).join(' · '),
        last_message: t.last_message,
        last_message_at: t.last_message_at,
        unread_count: t.unread_count,
        wedding_id: t.wedding_id,
      });
    }

    for (const t of dmThreads || []) {
      threads.push({
        id: t.partner_id,
        type: 'dm',
        name: t.partner_name,
        subtitle: 'Direct Message',
        last_message: t.last_message,
        last_message_at: t.last_message_at,
        unread_count: t.unread_count,
        partner_id: t.partner_id,
      });
    }

    threads.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    return threads;
  }, [eventThreads, dmThreads]);

  const filteredThreads = unifiedThreads.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-select thread from ?thread=<id> URL param
  useEffect(() => {
    const threadParam = searchParams.get('thread');
    if (!threadParam || unifiedThreads.length === 0 || selectedId) return;
    const match = unifiedThreads.find((t) => t.id === threadParam);
    if (match) {
      setSelectedId(match.id);
      setSelectedType(match.type);
      setSelectedName(match.name);
      searchParams.delete('thread');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, unifiedThreads, selectedId, setSearchParams]);

  const selectThread = (thread: UnifiedThread) => {
    setSelectedId(thread.id);
    setSelectedType(thread.type);
    setSelectedName(thread.name);
  };

  const handleBack = () => {
    setSelectedId(null);
    setSelectedType(null);
  };

  const mobileShowChat = isMobile && selectedId;

  const ThreadList = () => (
    <div className={cn("flex flex-col h-full", isMobile && mobileShowChat && "hidden")}>
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <Button size="icon" variant="outline" className="shrink-0 h-9 w-9" onClick={() => setNewDMOpen(true)} title="New message">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setNewDMOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Message
            </Button>
          </div>
        ) : (
          <div className="py-1">
            {filteredThreads.map(thread => (
              <button
                key={`${thread.type}-${thread.id}`}
                className={cn(
                  'w-full text-left px-3 py-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-b-0',
                  selectedId === thread.id && selectedType === thread.type && 'bg-accent'
                )}
                onClick={() => selectThread(thread)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className={cn(
                    'h-9 w-9 shrink-0 mt-0.5 ring-2',
                    thread.type === 'event' ? 'ring-emerald-400/60' : 'ring-primary/40'
                  )}>
                    <AvatarFallback className={cn(
                      'text-xs font-semibold',
                      thread.type === 'event'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-primary/10 text-primary'
                    )}>
                      {getInitials(thread.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm truncate", thread.unread_count > 0 ? "font-semibold" : "font-medium")}>{thread.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(thread.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{thread.subtitle}</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn("text-xs truncate", thread.unread_count > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground/70")}>{thread.last_message}</p>
                      {thread.unread_count > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] h-4 min-w-4 flex items-center justify-center px-1 rounded-full">
                          {thread.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const ChatPanel = () => (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-card shrink-0">
        {isMobile && (
          <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {selectedId ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {getInitials(selectedName)}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-sm truncate">{selectedName}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a conversation</p>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {selectedId && selectedType === 'event' ? (
          <WeddingMessagesPanel weddingId={selectedId} coupleName={selectedName} />
        ) : selectedId && selectedType === 'dm' ? (
          <DirectMessagesPanel partnerId={selectedId} partnerName={selectedName} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)]">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold font-display">Messages</h1>
      </div>

      <div className="flex-1 flex min-h-0 mx-4 mb-4 rounded-xl border bg-card overflow-hidden">
        {isMobile ? (
          mobileShowChat ? <ChatPanel /> : <ThreadList />
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="min-w-0">
              <ThreadList />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70} minSize={40} className="min-w-0">
              <ChatPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      <NewDirectMessageModal
        open={newDMOpen}
        onOpenChange={setNewDMOpen}
        onSelectUser={(id, name) => {
          setSelectedId(id);
          setSelectedType('dm');
          setSelectedName(name);
        }}
      />
    </div>
  );
};

export default MessagesPage;

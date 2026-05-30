import { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Send, MessageSquare, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDirectMessages, DirectMessage } from '@/hooks/useDirectMessages';
import { FileAttachment, FilePreview } from './FileAttachment';
import { useIsMobile } from '@/hooks/use-mobile';
import { getDateLabel, shouldGroupWithPrevious, shouldShowDateSeparator } from '@/utils/chatHelpers';

interface DirectMessagesPanelProps {
  partnerId: string | undefined;
  partnerName?: string;
}

const DateSeparator = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex-1 h-px bg-border" />
    <span className="text-[11px] font-medium text-muted-foreground px-2">{label}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

const DMBubble = ({ message, isOwn, isGrouped }: { message: DirectMessage; isOwn: boolean; isGrouped: boolean }) => (
  <div className={cn('flex flex-col max-w-[80%]', isOwn ? 'ml-auto items-end' : 'mr-auto items-start', isGrouped ? 'mt-0.5' : 'mt-3')}>
    {!isGrouped && (
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
        <span className="font-medium">{isOwn ? 'You' : message.sender_name || 'Unknown'}</span>
        <span>•</span>
        <span>{format(new Date(message.created_at), 'h:mm a')}</span>
      </div>
    )}
    <div className={cn(
      'px-3.5 py-2 text-sm shadow-sm',
      isOwn
        ? cn('bg-primary text-primary-foreground', isGrouped ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-br-md')
        : cn('bg-muted', isGrouped ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-bl-md')
    )}>
      {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
      {message.file_url && message.file_name && (
        <FilePreview fileUrl={message.file_url} fileName={message.file_name} />
      )}
    </div>
    {isOwn && !isGrouped && (
      <div className="flex items-center gap-0.5 mt-0.5">
        {message.read_at ? (
          <CheckCheck className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Check className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
    )}
  </div>
);

export const DirectMessagesPanel = ({ partnerId, partnerName }: DirectMessagesPanelProps) => {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isMobile = useIsMobile();

  const { messages, isLoading, currentUserId, sendMessage, isSending, markAsRead } = useDirectMessages({
    partnerId,
    enabled: !!partnerId,
  });

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (partnerId && messages.length > 0) markAsRead();
  }, [partnerId, messages.length, markAsRead]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  const handleSend = () => {
    if (!newMessage.trim() || isSending) return;
    sendMessage({ content: newMessage });
    setNewMessage('');
    textareaRef.current?.focus();
  };

  const handleFileUploaded = (url: string, name: string) => {
    sendMessage({ content: '', fileUrl: url, fileName: name });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  if (!partnerId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
        <p>Select a conversation</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-16 w-3/4 ml-auto" />
        <Skeleton className="h-16 w-3/4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <ScrollArea ref={scrollRef} className="flex-1 p-4" onScrollCapture={handleScroll}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((msg, idx) => {
              const prev = messages[idx - 1];
              const showDate = shouldShowDateSeparator(msg.created_at, prev?.created_at);
              const isGrouped = !showDate && shouldGroupWithPrevious(msg.sender_id, msg.created_at, prev?.sender_id, prev?.created_at);
              const isOwn = msg.sender_id === currentUserId;

              return (
                <div key={msg.id}>
                  {showDate && <DateSeparator label={getDateLabel(msg.created_at)} />}
                  <DMBubble message={msg} isOwn={isOwn} isGrouped={isGrouped} />
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {showScrollBtn && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-24 right-4 rounded-full shadow-lg h-8 w-8 z-10"
          onClick={scrollToBottom}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      )}

      <div className={cn("border-t bg-background", isMobile ? "p-2" : "p-4")}>
        <div className="flex gap-2 items-end">
          <FileAttachment
            bucket="team-files"
            folderPrefix={currentUserId || 'unknown'}
            onFileUploaded={handleFileUploaded}
            disabled={isSending}
          />
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); autoResize(e.target); }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              isMobile ? "min-h-[36px] max-h-[80px]" : "min-h-[40px] max-h-[120px]"
            )}
            disabled={isSending}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || isSending} size="icon" className={cn(isMobile ? "h-9 w-9" : "h-10 w-10")}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!isMobile && <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line</p>}
      </div>
    </div>
  );
};

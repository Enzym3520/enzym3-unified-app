import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Check, CheckCheck, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, differenceInMinutes, isSameDay } from "date-fns";

interface ChatMessage {
  id: string;
  wedding_id: string;
  sender_id: string;
  sender_role: string;
  sender_name: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
  recipient_id: string | null;
}

interface ChatWindowProps {
  weddingId: string;
  currentUserId: string;
  currentUserRole: string;
  currentUserName?: string;
  coupleName?: string;
  recipientId?: string | null;
  recipientName?: string;
  recipientRole?: string;
  hideHeader?: boolean;
}

function getDateLabel(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

function shouldGroup(prev: ChatMessage, curr: ChatMessage): boolean {
  if (prev.sender_id !== curr.sender_id) return false;
  return Math.abs(differenceInMinutes(new Date(curr.created_at), new Date(prev.created_at))) < 2;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ChatWindow({
  weddingId,
  currentUserId,
  currentUserRole,
  currentUserName,
  coupleName,
  recipientId,
  recipientName,
  recipientRole,
  hideHeader,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);

      let query = supabase
        .from("chat_messages")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("created_at", { ascending: true });

      if (recipientId) {
        query = query.or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`
        );
      } else {
        query = query.is("recipient_id", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [weddingId, recipientId, currentUserId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${weddingId}-${recipientId || "general"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;

          if (recipientId) {
            const isInThread =
              (newMsg.sender_id === currentUserId && newMsg.recipient_id === recipientId) ||
              (newMsg.sender_id === recipientId && newMsg.recipient_id === currentUserId);
            if (!isInThread) return;
          } else {
            if (newMsg.recipient_id !== null) return;
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weddingId, recipientId, currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!atBottom);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Mark messages as read when viewing
  useEffect(() => {
    const markAsRead = async () => {
      const unreadMessages = messages.filter(
        (m) => !m.read_at && m.sender_id !== currentUserId
      );

      if (unreadMessages.length === 0) return;

      const ids = unreadMessages.map((m) => m.id);
      await supabase
        .from("chat_messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids);
    };

    if (!loading && messages.length > 0) {
      markAsRead();
    }
  }, [messages, loading, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      wedding_id: weddingId,
      sender_id: currentUserId,
      sender_role: currentUserRole,
      sender_name: currentUserName || null,
      content: newMessage.trim(),
      recipient_id: recipientId || null,
    } as any);

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      textareaRef.current?.focus();
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch {
      return dateString;
    }
  };

  const headerTitle = recipientName || coupleName || "Chat";

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-12 w-1/2 ml-auto rounded-xl" />
        <Skeleton className="h-12 w-2/3 rounded-xl" />
        <Skeleton className="h-12 w-1/2 ml-auto rounded-xl" />
      </div>
    );
  }

  // Build messages with date separators and grouping
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 opacity-40" />
          </div>
          <p className="text-center font-medium text-foreground">
            {recipientName
              ? `Start a conversation with ${recipientName}`
              : "No messages yet"}
          </p>
          <p className="text-sm text-center mt-1">
            Send a message below to get started
          </p>
        </div>
      );
    }

    const elements: React.ReactNode[] = [];
    let lastDate: string | null = null;

    messages.forEach((message, idx) => {
      const msgDate = new Date(message.created_at);
      const dateLabel = getDateLabel(message.created_at);

      // Date separator
      if (dateLabel !== lastDate) {
        lastDate = dateLabel;
        elements.push(
          <div key={`date-${dateLabel}`} className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground font-medium px-3 py-1 bg-muted/50 rounded-full">
              {dateLabel}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        );
      }

      const isOwn = message.sender_id === currentUserId;
      const prevMsg = idx > 0 ? messages[idx - 1] : null;
      const isGrouped = prevMsg
        ? shouldGroup(prevMsg, message) && isSameDay(new Date(prevMsg.created_at), msgDate)
        : false;

      elements.push(
        <div
          key={message.id}
          className={cn(
            "flex flex-col max-w-[80%] animate-fade-in",
            isOwn ? "ml-auto items-end" : "items-start",
            isGrouped ? "mt-0.5" : "mt-3"
          )}
        >
          {/* Sender name */}
          {!isOwn && !isGrouped && (
            <span className="text-xs text-muted-foreground mb-1.5 px-1 font-medium">
              {message.sender_name || message.sender_role}
            </span>
          )}

          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 shadow-sm transition-colors",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          </div>

          {/* Time and status */}
          {!isGrouped && (
            <div className="flex items-center gap-1 mt-1 px-1">
              <span className="text-[10px] text-muted-foreground">
                {formatTime(message.created_at)}
              </span>
              {isOwn && (
                <span className="text-muted-foreground">
                  {message.read_at ? (
                    <CheckCheck className="h-3 w-3 text-primary" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {!hideHeader && (
        <div className="border-b px-4 py-3 bg-card flex items-center gap-3">
          {recipientName && (
            <Avatar className="h-9 w-9 ring-2 ring-accent/60">
              <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">
                {getInitials(recipientName)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{headerTitle}</h3>
            {recipientRole && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 rounded-md">
                {recipientRole}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2 relative"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {renderMessages()}
        <div ref={bottomRef} />

        {/* Scroll to bottom button — absolute, not fixed */}
        {showScrollBtn && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-lg h-9 w-9 z-10"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-3 bg-card">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              adjustTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${recipientName || ""}...`.trim()}
            disabled={sending}
            className={cn(
              "flex-1 min-h-[40px] max-h-[120px] resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            rows={1}
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            size="icon"
            className={cn(
              "shrink-0 rounded-xl h-10 w-10 transition-all duration-200",
              newMessage.trim() ? "scale-100 opacity-100" : "scale-90 opacity-60"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

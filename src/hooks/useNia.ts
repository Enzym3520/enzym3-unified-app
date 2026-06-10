import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NiaMessage } from "@/types/nia";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://ytembomoyhuwdtrzlwbi.supabase.co";

export function useNia() {
  const [messages, setMessages] = useState<NiaMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [resolvedEventId, setResolvedEventId] = useState<string | null>(null);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appendMessage = useCallback((msg: NiaMessage) => {
    setMessages((prev) => [...prev]);
    setMessages((prev) => {
      const exists = prev.find((m) => m.id === msg.id);
      return exists ? prev.map((m) => (m.id === msg.id ? msg : m)) : [...prev, msg];
    });
  }, []);

  const typewriterAppend = useCallback(
    (id: string, fullText: string) => {
      let i = 0;
      const chunk = 4;

      const tick = () => {
        i = Math.min(i + chunk, fullText.length);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: fullText.slice(0, i) } : m
          )
        );
        if (i < fullText.length) {
          typewriterRef.current = setTimeout(tick, 12);
        } else {
          setIsStreaming(false);
        }
      };
      tick();
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string, eventId?: string) => {
      if (!text.trim() || isStreaming) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userMsg: NiaMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const placeholderId = crypto.randomUUID();
      const placeholder: NiaMessage = {
        id: placeholderId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, placeholder]);
      setIsStreaming(true);

      // Build history (last 20 messages, exclude the placeholder we just added)
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/nia`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text.trim(),
            history,
            eventId: eventId ?? resolvedEventId ?? undefined,
          }),
        });

        if (!res.ok) {
          throw new Error(`NIA error ${res.status}`);
        }

        const data = await res.json();
        if (data.eventId) setResolvedEventId(data.eventId);

        typewriterAppend(placeholderId, data.text ?? "Sorry, I couldn't get a response. Try again.");
        return data.text as string;
      } catch (err) {
        const errMsg = "Sorry, I ran into an issue. Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId ? { ...m, content: errMsg } : m
          )
        );
        setIsStreaming(false);
        console.error("[useNia]", err);
        return null;
      }
    },
    [isStreaming, messages, resolvedEventId, typewriterAppend]
  );

  const clearMessages = useCallback(() => {
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, clearMessages, resolvedEventId };
}

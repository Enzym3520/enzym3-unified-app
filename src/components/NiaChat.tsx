import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { X, Send, Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useNia } from "@/hooks/useNia";
import { useNiaVoice } from "@/hooks/useNiaVoice";
import { NiaMessage } from "@/types/nia";
import { cn } from "@/lib/utils";

interface NiaChatProps {
  onClose: () => void;
}

function MessageBubble({ msg }: { msg: NiaMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {msg.content || (
          <span className="flex gap-1 items-center text-muted-foreground">
            <span className="animate-bounce delay-0">·</span>
            <span className="animate-bounce delay-150">·</span>
            <span className="animate-bounce delay-300">·</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function NiaChat({ onClose }: NiaChatProps) {
  const { messages, isStreaming, sendMessage, resolvedEventId } = useNia();
  const {
    isListening,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    speechSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useNiaVoice();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show welcome message on first open
  useEffect(() => {
    if (messages.length === 0) {
      // Handled via empty state below
    }
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    const responseText = await sendMessage(text, resolvedEventId ?? undefined);
    if (responseText && voiceEnabled) {
      speak(responseText);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(transcript);
        textareaRef.current?.focus();
      });
    }
  };

  const handleVoiceToggle = () => {
    if (isSpeaking) stopSpeaking();
    setVoiceEnabled((v) => !v);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm select-none">
            N
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">NIA</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Enzym3 AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleVoiceToggle}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title={voiceEnabled ? "Mute NIA voice" : "Enable NIA voice"}
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">N</span>
            </div>
            <p className="font-medium text-sm">Hi, I'm NIA!</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I can help you look up event details, update music preferences, send messages, and more. What can I help you with?
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-3 py-3 bg-background">
        {isSpeaking && (
          <p className="text-xs text-muted-foreground text-center mb-2 flex items-center justify-center gap-1">
            <Volume2 className="w-3 h-3" /> NIA is speaking…
          </p>
        )}
        {isListening && (
          <p className="text-xs text-red-500 text-center mb-2 flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Listening…
          </p>
        )}
        <div className="flex items-end gap-2">
          {speechSupported && (
            <button
              onClick={handleMic}
              className={cn(
                "p-2 rounded-lg flex-shrink-0 transition-colors",
                isListening
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                  : "hover:bg-muted text-muted-foreground"
              )}
              title={isListening ? "Stop listening" : "Speak to NIA"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask NIA anything…"
            rows={1}
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[38px] max-h-[120px] overflow-y-auto"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-2 rounded-lg bg-primary text-primary-foreground flex-shrink-0 disabled:opacity-40 transition-opacity hover:opacity-90"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { NiaChat } from "@/components/NiaChat";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function NiaChatBubble() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Only render for authenticated users
  if (!user) return null;

  return (
    <>
      {/* Chat panel */}
      <div
        className={cn(
          "fixed z-50 transition-all duration-300 ease-in-out",
          // Mobile: full-screen slide-up
          "bottom-0 right-0 left-0 sm:left-auto sm:bottom-24 sm:right-6",
          // Desktop: fixed-width panel
          "sm:w-[400px] sm:rounded-2xl sm:shadow-2xl sm:border",
          // Height
          "h-[85dvh] sm:h-[560px]",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ background: "hsl(var(--background))" }}
      >
        {open && <NiaChat onClose={() => setOpen(false)} />}
      </div>

      {/* Floating bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close NIA" : "Open NIA"}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground flex items-center justify-center",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </>
  );
}

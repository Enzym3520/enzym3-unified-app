import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

interface QuickMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextLabel: string;
}

export default function QuickMessageDialog({ open, onOpenChange, contextLabel }: QuickMessageDialogProps) {
  const { event, loading: eventLoading, user } = useClientEvent<{ id: string; submitted_by_user_id: string }>("id, submitted_by_user_id");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [senderName, setSenderName] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setMessage(contextLabel);
      supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            setSenderName(
              [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user.email
            );
          }
        });
    }
  }, [open, user]);

  const handleSend = async () => {
    if (!message.trim() || !user || !event?.id || !event?.submitted_by_user_id) return;
    setSending(true);
    try {
      const { error } = await supabase.from("chat_messages").insert({
        wedding_id: event.id,
        sender_id: user.id,
        recipient_id: event.submitted_by_user_id,
        sender_role: "client",
        sender_name: senderName || user.email || "Client",
        content: message.trim(),
      });

      if (error) throw error;
      toast.success("Message sent to your coordinator!");
      onOpenChange(false);
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const loading = eventLoading;
  const noCoordinator = !loading && (!event?.id || !event?.submitted_by_user_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message Your Coordinator</DialogTitle>
          <DialogDescription>
            Send a message directly to your assigned coordinator.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : noCoordinator ? (
          <p className="text-sm text-muted-foreground py-4">
            We couldn't find your assigned coordinator. Please visit the{" "}
            <a href="/app/messages" className="underline text-primary">Messages page</a> to reach out.
          </p>
        ) : (
          <div className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={sending || !message.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

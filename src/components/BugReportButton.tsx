import { useState } from "react";
import { Bug, Send, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { value: "bug", label: "🐛 Bug" },
  { value: "suggestion", label: "💡 Suggestion" },
  { value: "other", label: "📝 Other" },
];

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("bug");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setCategory("bug");
    setDescription("");
    setScreenshot(null);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({ title: "Please describe the issue", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "You must be logged in to submit a report", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;

      if (screenshot) {
        const filePath = `${user.id}/${Date.now()}-${screenshot.name}`;
        const { error: uploadError } = await supabase.storage
          .from("bug-report-screenshots")
          .upload(filePath, screenshot);
        if (uploadError) throw uploadError;
        screenshotUrl = filePath;
      }

      const { error } = await supabase.from("bug_reports").insert({
        user_id: user.id,
        user_email: user.email ?? null,
        user_name: user.user_metadata?.full_name ?? user.email ?? null,
        page_url: window.location.pathname,
        category,
        description: description.trim(),
        screenshot_url: screenshotUrl,
        browser_info: navigator.userAgent,
      });

      if (error) throw error;

      toast({ title: "Report submitted!", description: "Thanks for the feedback 🙏" });
      resetForm();
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Only show for authenticated users
  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[400] h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Report a bug"
      >
        <Bug className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Let us know about bugs, suggestions, or anything else.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>What happened?</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue or suggestion..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Screenshot (optional)</Label>
              {screenshot ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImagePlus className="h-4 w-4" />
                  <span className="truncate flex-1">{screenshot.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setScreenshot(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) setScreenshot(file);
                    };
                    input.click();
                  }}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Attach Screenshot
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Page: {window.location.pathname}
            </p>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Sending..." : "Submit Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

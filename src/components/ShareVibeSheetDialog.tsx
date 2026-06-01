import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, Plus, X } from "lucide-react";

interface ShareVibeSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vibeSheetData: any;
  coupleName: string;
  eventDate: string;
  eventLabel?: string;
  coupleEmail?: string;
  djEmail?: string;
  venueEmail?: string;
  onGeneratePDF: () => Promise<string>; // Returns base64 PDF
}

export function ShareVibeSheetDialog({
  open,
  onOpenChange,
  vibeSheetData,
  coupleName,
  eventDate,
  eventLabel = 'Wedding',
  coupleEmail,
  djEmail: initialDjEmail,
  venueEmail: initialVenueEmail,
  onGeneratePDF,
}: ShareVibeSheetDialogProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  
  const [djEmail, setDjEmail] = useState(initialDjEmail || "");
  const [venueEmail, setVenueEmail] = useState(initialVenueEmail || "");
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  
  const [attachPDF, setAttachPDF] = useState(true);
  const [ccCouple, setCcCouple] = useState(true);
  const [personalMessage, setPersonalMessage] = useState("");

  const addAdditionalEmail = () => {
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setAdditionalEmails([...additionalEmails, newEmail]);
      setNewEmail("");
    } else {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
    }
  };

  const removeAdditionalEmail = (index: number) => {
    setAdditionalEmails(additionalEmails.filter((_, i) => i !== index));
  };

  const handleSendEmail = async () => {
    // Collect all recipients
    const recipients: string[] = [];
    if (djEmail) recipients.push(djEmail);
    if (venueEmail) recipients.push(venueEmail);
    recipients.push(...additionalEmails);

    if (recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one recipient email address",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // Generate PDF if attachment is requested
      let pdfBase64 = undefined;
      if (attachPDF) {
        toast({
          title: "Generating PDF",
          description: "Creating PDF attachment...",
        });
        pdfBase64 = await onGeneratePDF();
      }

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke("send-vibe-sheet", {
        body: {
          recipients,
          ccCouple,
          coupleEmail,
          coupleName,
          eventDate,
          eventLabel,
          vibeSheetData,
          pdfBase64,
          personalMessage: personalMessage || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Vibe sheet sent to ${data.recipients.length} recipient(s)`,
        });
        onOpenChange(false);
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to Send Email",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Share Vibe Sheet via Email
          </DialogTitle>
          <DialogDescription>
            Send the {eventLabel.toLowerCase()} vibe sheet to your DJ, venue coordinator, and other recipients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Primary Recipients */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dj-email">DJ Email</Label>
              <Input
                id="dj-email"
                type="email"
                placeholder="dj@example.com"
                value={djEmail}
                onChange={(e) => setDjEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue-email">Venue Coordinator Email</Label>
              <Input
                id="venue-email"
                type="email"
                placeholder="coordinator@venue.com"
                value={venueEmail}
                onChange={(e) => setVenueEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Additional Recipients */}
          <div className="space-y-3">
            <Label>Additional Recipients</Label>
            {additionalEmails.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={email} disabled className="flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAdditionalEmail(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="additional@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addAdditionalEmail()}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addAdditionalEmail}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Email Options */}
          <div className="space-y-3 border-t pt-4">
            <Label>Email Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="attach-pdf"
                checked={attachPDF}
                onCheckedChange={(checked) => setAttachPDF(checked as boolean)}
              />
              <Label htmlFor="attach-pdf" className="font-normal">
                Attach PDF to email
              </Label>
            </div>

            {coupleEmail && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cc-couple"
                  checked={ccCouple}
                  onCheckedChange={(checked) => setCcCouple(checked as boolean)}
                />
                <Label htmlFor="cc-couple" className="font-normal">
                  CC couple ({coupleEmail})
                </Label>
              </div>
            )}
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to include in the email..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Preview Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Email Preview</p>
            <p className="text-sm text-muted-foreground">
              <strong>Subject:</strong> {eventLabel} Vibe Sheet - {coupleName} ({eventDate})
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Recipients:</strong>{" "}
              {[djEmail, venueEmail, ...additionalEmails]
                .filter(Boolean)
                .join(", ") || "None selected"}
            </p>
            {attachPDF && (
              <p className="text-sm text-muted-foreground">
                <strong>Attachment:</strong> {coupleName.replace(/[^a-z0-9]/gi, '_')}_VibeSheet.pdf
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

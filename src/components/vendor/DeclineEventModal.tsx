import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDeclineAssignment } from "@/hooks/use-assignments";

interface DeclineEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
}

export function DeclineEventModal({ open, onOpenChange, assignmentId }: DeclineEventModalProps) {
  const [reason, setReason] = useState("");
  const declineMutation = useDeclineAssignment();

  const handleDecline = () => {
    if (!reason.trim()) return;
    declineMutation.mutate({ assignmentId, reason }, {
      onSuccess: () => { onOpenChange(false); setReason(""); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline Event Assignment</DialogTitle>
          <DialogDescription>Please provide a reason for declining this event.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for declining *</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Already booked, outside service area, etc." rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDecline} disabled={!reason.trim() || declineMutation.isPending}>
            {declineMutation.isPending ? "Declining..." : "Decline Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

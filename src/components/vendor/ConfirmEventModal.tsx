import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConfirmAssignment } from "@/hooks/use-assignments";

interface ConfirmEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
}

export function ConfirmEventModal({ open, onOpenChange, assignmentId }: ConfirmEventModalProps) {
  const confirmMutation = useConfirmAssignment();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Event Assignment</DialogTitle>
          <DialogDescription>Are you sure you want to confirm this event? This will notify the coordinator.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => confirmMutation.mutate(assignmentId, { onSuccess: () => onOpenChange(false) })} disabled={confirmMutation.isPending}>
            {confirmMutation.isPending ? "Confirming..." : "Confirm Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

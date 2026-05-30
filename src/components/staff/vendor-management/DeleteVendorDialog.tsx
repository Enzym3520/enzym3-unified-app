import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar } from 'lucide-react';
import { UnifiedVendor } from '@/hooks/useVendorManagement';
import { useDeleteVendor, useVendorAssignmentsCheck } from '@/hooks/useVendorActions';
import { format } from 'date-fns';
import { capitalizeNames } from '@/utils/contactHelpers';

interface DeleteVendorDialogProps {
  vendor: UnifiedVendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteVendorDialog({ vendor, open, onOpenChange }: DeleteVendorDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const deleteVendor = useDeleteVendor();
  const { data: assignmentsData, isLoading } = useVendorAssignmentsCheck(vendor?.userId);

  const vendorName = vendor?.name || '';
  const canDelete = confirmText.toLowerCase() === vendorName.toLowerCase();
  const hasActiveAssignments = assignmentsData?.hasActiveAssignments || false;

  const handleDelete = () => {
    if (!vendor?.userId || !canDelete || hasActiveAssignments) return;

    deleteVendor.mutate(vendor.userId, {
      onSuccess: () => {
        setConfirmText('');
        onOpenChange(false);
      },
    });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText('');
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Vendor?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                This will permanently remove <strong>"{vendorName}"</strong> from the system. 
                This action cannot be undone.
              </p>

              {isLoading && (
                <p className="text-muted-foreground">Checking for active assignments...</p>
              )}

              {hasActiveAssignments && assignmentsData?.assignments && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">
                      This vendor has {assignmentsData.assignments.length} active assignment(s):
                    </p>
                    <ul className="space-y-1 text-sm">
                      {assignmentsData.assignments.slice(0, 5).map((assignment: any) => (
                        <li key={assignment.id} className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {capitalizeNames(assignment.event_notification_history?.couple_name || '')} - 
                          {assignment.event_notification_history?.event_date && 
                            format(new Date(assignment.event_notification_history.event_date), 'MMM d, yyyy')}
                        </li>
                      ))}
                      {assignmentsData.assignments.length > 5 && (
                        <li className="text-muted-foreground">
                          ...and {assignmentsData.assignments.length - 5} more
                        </li>
                      )}
                    </ul>
                    <p className="mt-3 font-medium">
                      You must reassign or cancel these events before deleting this vendor.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {!hasActiveAssignments && !isLoading && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Type "{vendorName}" to confirm deletion:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type vendor name to confirm"
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={!canDelete || hasActiveAssignments || deleteVendor.isPending}
            variant="destructive"
          >
            {deleteVendor.isPending ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

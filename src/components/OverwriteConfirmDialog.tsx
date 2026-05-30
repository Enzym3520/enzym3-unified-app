import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface OverwriteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: 'fill' | 'replace' | 'add') => void;
  existingSongsCount: number;
  importingSongsCount: number;
}

export const OverwriteConfirmDialog: React.FC<OverwriteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  existingSongsCount,
  importingSongsCount,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <AlertDialogTitle>Existing Songs Found</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-3">
            {existingSongsCount > 0 ? (
              <>
                You already have {existingSongsCount} event{existingSongsCount !== 1 ? 's' : ''} with songs filled in.
                You're importing {importingSongsCount} song{importingSongsCount !== 1 ? 's' : ''}.
              </>
            ) : (
              <>
                You have existing empty timeline events.
                You're importing {importingSongsCount} song{importingSongsCount !== 1 ? 's' : ''}.
              </>
            )}
            <br /><br />
            How would you like to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <AlertDialogAction
            onClick={() => onConfirm('fill')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Fill Empty Rows Only
            <span className="text-xs opacity-70 ml-2">(Recommended - keeps existing songs)</span>
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => onConfirm('replace')}
            className="w-full bg-warning hover:bg-warning/90"
          >
            Replace All Events
            <span className="text-xs opacity-70 ml-2">(Clears existing)</span>
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => onConfirm('add')}
            className="w-full bg-secondary hover:bg-secondary/90"
          >
            Add as New Rows
            <span className="text-xs opacity-70 ml-2">(Append to list)</span>
          </AlertDialogAction>
          <AlertDialogCancel className="w-full mt-2">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

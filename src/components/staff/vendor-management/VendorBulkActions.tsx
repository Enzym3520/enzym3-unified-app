import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Trash2, Power, Download, X } from 'lucide-react';
import { UnifiedVendor } from '@/hooks/useVendorManagement';
import { useDeactivateVendor, useDeleteVendor } from '@/hooks/useVendorActions';
import { toast } from 'sonner';

interface VendorBulkActionsProps {
  selectedVendors: UnifiedVendor[];
  onClearSelection: () => void;
}

export function VendorBulkActions({ selectedVendors, onClearSelection }: VendorBulkActionsProps) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deactivateVendor = useDeactivateVendor();
  const deleteVendor = useDeleteVendor();

  const activeVendors = selectedVendors.filter(v => v.status === 'active' && v.userId);
  
  const handleBulkDeactivate = async () => {
    let successCount = 0;
    let errorCount = 0;

    for (const vendor of activeVendors) {
      if (vendor.userId) {
        try {
          await deactivateVendor.mutateAsync(vendor.userId);
          successCount++;
        } catch {
          errorCount++;
        }
      }
    }

    if (successCount > 0) {
      toast.success(`Deactivated ${successCount} vendor(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to deactivate ${errorCount} vendor(s)`);
    }

    setShowDeactivateDialog(false);
    onClearSelection();
  };

  const handleBulkDelete = async () => {
    let successCount = 0;
    let errorCount = 0;

    for (const vendor of selectedVendors) {
      if (vendor.userId) {
        try {
          await deleteVendor.mutateAsync(vendor.userId);
          successCount++;
        } catch {
          errorCount++;
        }
      }
    }

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} vendor(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} vendor(s). They may have active assignments.`);
    }

    setShowDeleteDialog(false);
    onClearSelection();
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Company', 'Type', 'Status'].join(','),
      ...selectedVendors.map(v => [
        `"${v.name}"`,
        `"${v.email}"`,
        `"${v.phone || ''}"`,
        `"${v.company || ''}"`,
        `"${v.vendorType}"`,
        `"${v.status}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedVendors.length} vendor(s)`);
  };

  if (selectedVendors.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
        <span className="text-sm font-medium">
          {selectedVendors.length} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        {activeVendors.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowDeactivateDialog(true)}
          >
            <Power className="h-4 w-4 mr-1" />
            Deactivate ({activeVendors.length})
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive hover:text-destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {activeVendors.length} Vendors?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the selected vendors. They will not appear in vendor selection 
              lists but their data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeactivate}>
              Deactivate All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedVendors.length} Vendors?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected vendors. Vendors with active 
              assignments cannot be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

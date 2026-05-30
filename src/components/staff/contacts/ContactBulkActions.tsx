import React, { useState } from 'react';
import { Contact } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Mail, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContactBulkActionsProps {
  selectedContacts: Contact[];
  onClearSelection: () => void;
  onContactsUpdated: () => void;
}

const ContactBulkActions = ({ selectedContacts, onClearSelection, onContactsUpdated }: ContactBulkActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleExportSelected = () => {
    const emails = selectedContacts.map(c => c.email).join(', ');
    navigator.clipboard.writeText(emails);
    toast({
      title: 'Email Addresses Copied',
      description: `${selectedContacts.length} email addresses copied to clipboard`,
    });
  };

  const handleBulkEmailAction = () => {
    const emails = selectedContacts.map(c => c.email);
    const subject = 'Event Update';
    const mailtoLink = `mailto:?bcc=${emails.join(',')}&subject=${encodeURIComponent(subject)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      // Collect all event notification IDs from selected contacts
      const notificationIds = selectedContacts.flatMap(contact => 
        contact.eventHistory?.map(event => event.id) || []
      ).filter(Boolean);
      
      if (notificationIds.length === 0) {
        throw new Error('No valid notification IDs found for selected contacts');
      }

      // Delete from event_notification_history
      const { error } = await supabase
        .from('event_notification_history')
        .delete()
        .in('id', notificationIds);
      
      if (error) throw error;
      
      toast({
        title: 'Contacts Deleted',
        description: `${selectedContacts.length} contacts have been removed`,
      });
      
      onContactsUpdated();
      onClearSelection();
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete contacts. You may not have permission.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  if (selectedContacts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedContacts.length} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSelected}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkEmailAction}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email All
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contacts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedContacts.length} selected contacts? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactBulkActions;
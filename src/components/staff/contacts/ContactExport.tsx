import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Contact } from '@/types/contact';

interface ContactExportProps {
  contacts: Contact[];
  filteredContacts: Contact[];
}

const ContactExport = ({ contacts, filteredContacts }: ContactExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = (data: Contact[], filename: string) => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Primary Event Type',
      'Primary Event Date',
      'Total Events',
      'Status',
      'Preferred Venues',
      'Tags',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(contact => [
        `"${contact.name}"`,
        `"${contact.email}"`,
        `"${contact.phone || ''}"`,
        `"${contact.primaryEventType || ''}"`,
        `"${contact.primaryEventDate || ''}"`,
        contact.totalEvents,
        `"${contact.status}"`,
        `"${contact.preferredVenues.join('; ')}"`,
        `"${contact.tags.join('; ')}"`,
        `"${contact.createdAt}"`
      ].join(','))
    ].join('\n');

    downloadFile(csvContent, filename, 'text/csv');
  };

  const exportToJSON = (data: Contact[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename, 'application/json');
  };

  const generateEmailList = (data: Contact[]) => {
    const emails = data.map(contact => contact.email).join(', ');
    navigator.clipboard.writeText(emails);
    toast({
      title: 'Email List Copied',
      description: `${data.length} email addresses copied to clipboard`,
    });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type: 'csv' | 'json' | 'emails', useFiltered: boolean = false) => {
    setIsExporting(true);
    
    try {
      const dataToExport = useFiltered ? filteredContacts : contacts;
      const timestamp = new Date().toISOString().split('T')[0];
      const prefix = useFiltered ? 'filtered-contacts' : 'all-contacts';
      
      switch (type) {
        case 'csv':
          exportToCSV(dataToExport, `${prefix}-${timestamp}.csv`);
          toast({
            title: 'Export Successful',
            description: `Exported ${dataToExport.length} contacts to CSV`,
          });
          break;
        case 'json':
          exportToJSON(dataToExport, `${prefix}-${timestamp}.json`);
          toast({
            title: 'Export Successful',
            description: `Exported ${dataToExport.length} contacts to JSON`,
          });
          break;
        case 'emails':
          generateEmailList(dataToExport);
          break;
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export contacts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const hasFilteredResults = filteredContacts.length !== contacts.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          Export ({contacts.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export All to CSV
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileText className="w-4 h-4 mr-2" />
          Export All to JSON
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('emails')}>
          <Mail className="w-4 h-4 mr-2" />
          Copy All Email Addresses
        </DropdownMenuItem>
        
        {hasFilteredResults && (
          <>
            <DropdownMenuItem onClick={() => handleExport('csv', true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Filtered to CSV ({filteredContacts.length})
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleExport('json', true)}>
              <FileText className="w-4 h-4 mr-2" />
              Export Filtered to JSON ({filteredContacts.length})
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleExport('emails', true)}>
              <Mail className="w-4 h-4 mr-2" />
              Copy Filtered Emails ({filteredContacts.length})
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContactExport;
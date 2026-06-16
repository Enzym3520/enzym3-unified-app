import React, { useState, useMemo } from 'react';
import { Contact } from '@/types/contact';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown, Mail, Phone, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { parseLocalDate, safeFormatDate } from '@/utils/dateHelpers';
import ContactDetailsModal from './ContactDetailsModal';

interface ContactsTableViewProps {
  contacts: Contact[];
  filters: {
    status: string;
    eventType: string;
    search: string;
    tags: string[];
  };
  onContactUpdate?: () => void;
  selectedContacts?: Contact[];
  onSelectionChange?: (contactId: string, selected: boolean) => void;
}

type SortField = 'name' | 'email' | 'totalEvents' | 'primaryEventDate' | 'primaryEventType';
type SortDirection = 'asc' | 'desc';

const ContactsTableView = ({ contacts, filters, onContactUpdate, selectedContacts = [], onSelectionChange }: ContactsTableViewProps) => {
  const isMobile = useIsMobile();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Contacts are already filtered by ContactsView, no need to duplicate filtering
  const filteredContacts = contacts;

  // Sort contacts
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'primaryEventDate') {
        aValue = aValue ? parseLocalDate(aValue).getTime() : 0;
        bValue = bValue ? parseLocalDate(bValue).getTime() : 0;
      }

      if (typeof aValue === 'string') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredContacts, sortField, sortDirection]);

  // Paginate contacts
  const totalPages = Math.ceil(sortedContacts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedContacts = sortedContacts.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return safeFormatDate(dateString, 'PP', 'No date');
  };

  const getEventTypeBadgeColor = (eventType: string) => {
    switch ((eventType || '').toLowerCase()) {
      case 'wedding': return 'default';
      case 'birthday': return 'secondary';
      case 'quinceañera': return 'outline';
      default: return 'secondary';
    }
  };

  const isContactSelected = (contactId: string) => {
    return selectedContacts.some(c => c.id === contactId);
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === paginatedContacts.length) {
      // Deselect all on current page
      paginatedContacts.forEach(contact => {
        onSelectionChange?.(contact.id, false);
      });
    } else {
      // Select all on current page
      paginatedContacts.forEach(contact => {
        if (!isContactSelected(contact.id)) {
          onSelectionChange?.(contact.id, true);
        }
      });
    }
  };

  const allCurrentPageSelected = paginatedContacts.length > 0 && 
    paginatedContacts.every(contact => isContactSelected(contact.id));

  const handleEmailContact = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    const emails = [];
    if (contact.brideInfo?.email) emails.push(contact.brideInfo.email);
    if (contact.groomInfo?.email) emails.push(contact.groomInfo.email);
    if (!contact.brideInfo && !contact.groomInfo && contact.email) emails.push(contact.email);
    
    if (emails.length > 0) {
      const subject = encodeURIComponent(`Event Update - ${contact.name}`);
      window.open(`mailto:${emails.join(',')}?subject=${subject}`, '_blank');
    }
  };

  const handleSelectionChange = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange?.(contact.id, !isContactSelected(contact.id));
  };

  return (
    <div className="space-y-4">
      {/* Page Size and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={pageSize.toString()} onValueChange={(value) => {
            setPageSize(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(startIndex + pageSize, sortedContacts.length)} of {sortedContacts.length} contacts
        </div>
      </div>

      {/* Mobile Card List */}
      {isMobile ? (
        <div className="space-y-2">
          {paginatedContacts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-sm text-muted-foreground">No contacts found</p>
              </CardContent>
            </Card>
          ) : (
            paginatedContacts.map((contact) => (
              <Card
                key={contact.id}
                className="cursor-pointer active:bg-muted/50"
                onClick={() => setSelectedContact(contact)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                    <Badge variant={getEventTypeBadgeColor(contact.primaryEventType || '')} className="shrink-0 text-xs">
                      {contact.primaryEventType || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(contact.primaryEventDate)}
                    </div>
                    <Badge variant={contact.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {contact.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Desktop Table */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={allCurrentPageSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('name')} className="flex items-center gap-2 h-auto p-0 font-medium">
                      Contact {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('primaryEventType')} className="flex items-center gap-2 h-auto p-0 font-medium">
                      Event Type {getSortIcon('primaryEventType')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('primaryEventDate')} className="flex items-center gap-2 h-auto p-0 font-medium">
                      Event Date {getSortIcon('primaryEventDate')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('totalEvents')} className="flex items-center gap-2 h-auto p-0 font-medium">
                      Total Events {getSortIcon('totalEvents')}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.map((contact) => (
                  <TableRow 
                    key={contact.id} 
                    className={`cursor-pointer hover:bg-muted/50 ${isContactSelected(contact.id) ? 'bg-muted/30' : ''}`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isContactSelected(contact.id)}
                        onCheckedChange={() => handleSelectionChange(contact, event as any)}
                        onClick={(e) => handleSelectionChange(contact, e)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />{contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />{contact.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEventTypeBadgeColor(contact.primaryEventType || '')}>
                        {contact.primaryEventType || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(contact.primaryEventDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contact.totalEvents} {contact.totalEvents === 1 ? 'event' : 'events'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={(e) => handleEmailContact(contact, e)} className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />Email
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedContact(contact); }}>
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {paginatedContacts.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                <p className="text-muted-foreground">No contacts match your current filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Contact Details Modal */}
      <ContactDetailsModal
        contact={selectedContact}
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onContactUpdate={onContactUpdate}
      />
    </div>
  );
};

export default ContactsTableView;
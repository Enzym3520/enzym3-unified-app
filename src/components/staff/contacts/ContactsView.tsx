import React, { useState, useMemo } from 'react';
import { Contact } from '@/types/contact';
import { filterContacts, calculateContactStats } from '@/utils/contactHelpers';
import ContactsFilters from './ContactsFilters';
import ContactCard from './ContactCard';
import ContactStats from './ContactStats';
import ContactDetailsModal from './ContactDetailsModal';
import ContactsTableView from './ContactsTableView';
import ContactSearch from './ContactSearch';
import ContactExport from './ContactExport';
import ContactBulkActions from './ContactBulkActions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, List, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContactsViewProps {
  contacts: Contact[];
  onRefresh?: () => void;
}

const ContactsView = ({ contacts, onRefresh }: ContactsViewProps) => {
  const isMobile = useIsMobile();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchResults, setSearchResults] = useState<Contact[] | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    eventType: 'all',
    search: '',
    tags: [] as string[]
  });

  const handleContactUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    onRefresh?.();
  };

  // Use search results if available, otherwise use all contacts
  const activeContacts = searchResults || contacts;
  
  const filteredContacts = useMemo(() => 
    filterContacts(activeContacts, filters), 
    [activeContacts, filters]
  );

  const stats = useMemo(() => 
    calculateContactStats(filteredContacts), 
    [filteredContacts]
  );

  const handleSearchResults = (results: Contact[]) => {
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
  };

  const handleSelectionChange = (contactId: string, selected: boolean) => {
    if (selected) {
      const contact = filteredContacts.find(c => c.id === contactId);
      if (contact) {
        setSelectedContacts(prev => {
          if (prev.find(c => c.id === contactId)) return prev;
          return [...prev, contact];
        });
      }
    } else {
      setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
    }
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <ContactSearch 
        contacts={contacts}
        onSearchResults={handleSearchResults}
        onClearSearch={handleClearSearch}
      />

      {/* Statistics */}
      <ContactStats stats={stats} />

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <ContactsFilters
            filters={filters}
            onFiltersChange={setFilters}
            contacts={activeContacts}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <ContactExport
            contacts={contacts}
            filteredContacts={filteredContacts}
          />
          
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          )}
          
          {!isMobile && (
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contacts Display */}
      {viewMode === 'grid' ? (
        filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                {contacts.length === 0 
                  ? "No contacts have been created yet."
                  : searchResults 
                    ? "No contacts match your search query."
                    : "No contacts match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() => setSelectedContact(contact)}
                isSelected={selectedContacts.some(c => c.id === contact.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </div>
        )
      ) : (
        <ContactsTableView 
          contacts={filteredContacts}
          filters={filters}
          onContactUpdate={handleContactUpdate}
          selectedContacts={selectedContacts}
          onSelectionChange={handleSelectionChange}
        />
      )}

      {/* Contact Details Modal */}
      <ContactDetailsModal
        contact={selectedContact}
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onContactUpdate={handleContactUpdate}
      />

      {/* Bulk Actions */}
      <ContactBulkActions
        selectedContacts={selectedContacts}
        onClearSelection={handleClearSelection}
        onContactsUpdated={handleContactUpdate}
      />
    </div>
  );
};

export default ContactsView;
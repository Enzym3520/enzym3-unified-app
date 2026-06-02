import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ContactsView from '@/components/staff/contacts/ContactsView';
import { useContactsImproved } from '@/hooks/useContactsImproved';
import ContactDetailsModal from '@/components/staff/contacts/ContactDetailsModal';
import { Contact } from '@/types/contact';

const ContactsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { contacts, loading, error, lastRefresh, refetch } = useContactsImproved();

  // URL-based contact selection (for notification deep-links)
  const searchParams = new URLSearchParams(location.search);
  const weddingIdFromUrl = searchParams.get('wedding_id');
  const defaultTab = searchParams.get('tab');

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Auto-open contact when URL has wedding_id parameter
  useEffect(() => {
    if (weddingIdFromUrl && contacts.length > 0 && !modalOpen) {
      // Match by the event row id, the canonical wedding_id stored in metadata,
      // or any related id captured on the event — notifications from different
      // apps (Vibe Planner, vendor assignments) reference events inconsistently.
      const contact = contacts.find(c =>
        c.eventHistory?.some(e =>
          e.id === weddingIdFromUrl ||
          (e.additional_metadata as any)?.wedding_id === weddingIdFromUrl
        )
      );
      if (contact) {
        setSelectedContact(contact);
        setModalOpen(true);
      }
    }
  }, [weddingIdFromUrl, contacts, modalOpen]);


  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedContact(null);
    // Clear URL params when closing modal
    if (weddingIdFromUrl) {
      navigate('/staff/contacts', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading contacts: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary mb-2">Contacts</h1>
              <p className="text-muted-foreground">
                Manage and view all your event contacts in one place
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {lastRefresh && (
                <p>Last updated: {lastRefresh.toLocaleTimeString()}</p>
              )}
              <p>{contacts.length} total contacts</p>
            </div>
          </div>
        </div>
        <ContactsView contacts={contacts} onRefresh={refetch} />

        {/* URL-triggered contact modal */}
        <ContactDetailsModal
          contact={selectedContact}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onContactUpdate={refetch}
          defaultTab={defaultTab || undefined}
        />
      </div>
    </div>
  );
};

export default ContactsPage;

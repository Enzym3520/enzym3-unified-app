import React, { useState, useEffect } from 'react';
import { Search, Calendar, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { CreateReminderData } from '@/types/reminder';
import { getPackageTypeLabel } from '@/config/packageTypes';
import { formatEventType } from '@/utils/notificationHelpers';

interface EventContact {
  id: string;
  couple_name: string;
  contact_email: string;
  contact_phone?: string;
  event_date: string;
  venue?: string;
  package_type?: string;
  coordinator_name?: string;
  dj_name?: string;
  event_type: string;
  created_at: string;
}

interface ContactSelectorProps {
  onSelectContact: (reminderData: Partial<CreateReminderData>) => void;
  onClose: () => void;
}

const ContactSelector = ({ onSelectContact, onClose }: ContactSelectorProps) => {
  const [contacts, setContacts] = useState<EventContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<EventContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = contacts.filter(contact =>
        (contact.couple_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.contact_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.venue && contact.venue.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchTerm, contacts]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact: EventContact) => {
    const eventDate = new Date(contact.event_date);
    const today = new Date();
    const isPastEvent = eventDate < today;
    
    // Determine reminder type based on event date and type
    let reminderType: CreateReminderData['reminder_type'] = 'custom';
    if (contact.event_type.toLowerCase().includes('wedding')) {
      reminderType = isPastEvent ? 'post_wedding' : 'pre_wedding';
    } else {
      reminderType = 'business_development';
    }

    // Create event context
    const eventContext = {
      event_date: contact.event_date,
      venue: contact.venue,
      package_type: contact.package_type,
      event_type: contact.event_type,
      coordinator_name: contact.coordinator_name,
      dj_name: contact.dj_name
    };

    const reminderData: Partial<CreateReminderData> = {
      contact_email: contact.contact_email,
      contact_name: contact.couple_name,
      reminder_type: reminderType,
      event_context: eventContext,
      notes: `Event: ${contact.event_type} on ${new Date(contact.event_date).toLocaleDateString()}${contact.venue ? ` at ${contact.venue}` : ''}`
    };

    onSelectContact(reminderData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getEventTypeBadgeColor = (eventType: string) => {
    if (eventType.toLowerCase().includes('wedding')) return 'default';
    if (eventType.toLowerCase().includes('birthday')) return 'secondary';
    if (eventType.toLowerCase().includes('quince')) return 'outline';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Contact</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          Create New
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No contacts match your search' : 'No contacts found'}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <Card 
                key={contact.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSelectContact(contact)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{contact.couple_name}</h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Mail className="w-3 h-3" />
                        {contact.contact_email}
                      </div>
                    </div>
                    <Badge variant={getEventTypeBadgeColor(contact.event_type)}>
                      {formatEventType(contact.event_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(contact.event_date)}
                    </div>
                    {contact.venue && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {contact.venue}
                      </div>
                    )}
                  </div>
                  
                  {contact.package_type && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {getPackageTypeLabel(contact.package_type)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContactSelector;
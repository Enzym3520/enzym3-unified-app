import { EventNotification } from '@/types/notification';
import { Contact, ContactStats, FormSubmission, UploadedDetailsForm } from '@/types/contact';
import { generateEnhancedContactTags } from '@/utils/tagHelpers';
import { parseLocalDate } from '@/utils/dateHelpers';

// Common acronyms that should stay uppercase
const PRESERVE_UPPERCASE = ['DJ', 'MC', 'JJ', 'CEO', 'CFO', 'CTO', 'LLC', 'INC', 'USA', 'VIP', 'AV', 'IT', 'HR', 'PR', 'TV'];

/**
 * Capitalize the first letter of each word in a name
 * Handles special cases like "Mc", "O'", hyphens, and preserves common acronyms
 */
export const capitalizeNames = (name: string): string => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => {
      if (!word) return word;
      
      // Preserve common acronyms (DJ, MC, etc.)
      const upperWord = word.toUpperCase();
      if (PRESERVE_UPPERCASE.includes(upperWord)) {
        return upperWord;
      }
      
      // Handle hyphenated names
      if (word.includes('-')) {
        return word.split('-').map(part => {
          const upperPart = part.toUpperCase();
          if (PRESERVE_UPPERCASE.includes(upperPart)) {
            return upperPart;
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join('-');
      }
      
      // Handle names with apostrophes (O'Brien, D'Angelo)
      if (word.includes("'")) {
        return word.split("'").map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join("'");
      }
      
      // Handle Mc/Mac prefixes
      if (word.toLowerCase().startsWith('mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
      }
      
      if (word.toLowerCase().startsWith('mac') && word.length > 3) {
        return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
      }
      
      // Short words (2 chars or less) stay uppercase — handles initials like JJ, TJ, CJ, AJ
      if (word.length <= 2) {
        return upperWord;
      }
      
      // Standard capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

export const transformNotificationsToContacts = (
  notifications: EventNotification[], 
  formSubmissions: FormSubmission[] = [],
  uploadedForms: UploadedDetailsForm[] = []
): Contact[] => {
  const contactMap = new Map<string, Contact>();

  notifications.forEach(notification => {
    const key = notification.contact_email.toLowerCase();
    
    if (contactMap.has(key)) {
      const contact = contactMap.get(key)!;
      contact.eventHistory.push(notification);
      contact.totalEvents = contact.eventHistory.length;
      
      // Update form submissions for this contact
      const contactFormSubmissions = formSubmissions.filter(
        submission => submission.contact_email.toLowerCase() === key
      );
      contact.formSubmissions = contactFormSubmissions;
      contact.completedForms = contactFormSubmissions.filter(fs => fs.status === 'emailed' || fs.status === 'processed').length;
      contact.totalForms = contactFormSubmissions.length;
      contact.formCompletionRate = contactFormSubmissions.length > 0 
        ? (contact.completedForms / contactFormSubmissions.length) * 100 
        : 0;
      
      // Update uploaded details forms for this contact
      const contactUploadedForms = uploadedForms.filter(form => 
        contact.eventHistory.some(event => 
          event.id === form.wedding_id || 
          event.additional_metadata?.wedding_id === form.wedding_id
        )
      );
      contact.uploadedDetailsForms = contactUploadedForms;
      
      // Update event types
      if (!contact.eventTypes.includes(notification.event_type)) {
        contact.eventTypes.push(notification.event_type);
      }
      
      // Update preferred venues
      if (notification.venue && !contact.preferredVenues.includes(notification.venue)) {
        contact.preferredVenues.push(notification.venue);
      }
      
      // Update primary event (prioritize upcoming events, then most recent past event)
      const notificationDate = parseLocalDate(notification.event_date);
      const currentPrimaryDate = parseLocalDate(contact.primaryEventDate);
      const now = new Date();
      
      // If this is a future event and (current primary is past OR this is earlier than current future event)
      if (notificationDate > now && (currentPrimaryDate <= now || notificationDate < currentPrimaryDate)) {
        contact.primaryEventDate = notification.event_date;
        contact.primaryEventType = notification.event_type;
        contact.name = capitalizeNames(notification.couple_name);
      }
      // If no future events yet, keep the most recent past event
      else if (currentPrimaryDate <= now && notificationDate > currentPrimaryDate) {
        contact.primaryEventDate = notification.event_date;
        contact.primaryEventType = notification.event_type;
        contact.name = capitalizeNames(notification.couple_name);
      }
      
      contact.updatedAt = new Date().toISOString();
    } else {
      // Extract detailed contact info from form_data if available
      const formData = notification.additional_metadata?.form_data;
      const enhancedContactInfo = extractContactDetails(notification, formData);
      
      // Get form submissions for this contact
      const contactFormSubmissions = formSubmissions.filter(
        submission => submission.contact_email.toLowerCase() === key
      );
      
      // Get uploaded details forms for this contact
      const contactUploadedForms = uploadedForms.filter(form => 
        notification.id === form.wedding_id || 
        notification.additional_metadata?.wedding_id === form.wedding_id
      );

      const contact: Contact = {
        id: notification.id,
        name: capitalizeNames(notification.couple_name),
        email: notification.contact_email,
        phone: notification.contact_phone || undefined,
        eventHistory: [notification],
        formSubmissions: contactFormSubmissions,
        uploadedDetailsForms: contactUploadedForms,
        primaryEventDate: notification.event_date,
        primaryEventType: notification.event_type,
        totalEvents: 1,
        eventTypes: [notification.event_type],
        preferredVenues: notification.venue ? [notification.venue] : [],
        status: getContactStatus(notification),
        tags: getTagsFromNotification(notification),
        createdAt: notification.created_at,
        updatedAt: notification.updated_at,
        completedForms: contactFormSubmissions.filter(fs => fs.status === 'emailed' || fs.status === 'processed').length,
        totalForms: contactFormSubmissions.length,
        formCompletionRate: contactFormSubmissions.length > 0 
          ? (contactFormSubmissions.filter(fs => fs.status === 'emailed' || fs.status === 'processed').length / contactFormSubmissions.length) * 100 
          : 0,
        ...enhancedContactInfo
      };
      
      contactMap.set(key, contact);
    }
  });

  return Array.from(contactMap.values()).sort((a, b) => 
    new Date(b.primaryEventDate).getTime() - new Date(a.primaryEventDate).getTime()
  );
};

export const getContactStatus = (notification: EventNotification): Contact['status'] => {
  const eventDate = parseLocalDate(notification.event_date);
  const now = new Date();
  
  if (eventDate > now) {
    return 'active';
  } else if (eventDate < now) {
    return 'past_client';
  }
  return 'potential';
};

export const generateContactTags = (notification: EventNotification, contact?: Contact): string[] => {
  return generateEnhancedContactTags(notification, contact);
};

const getTagsFromNotification = (notification: EventNotification): string[] => {
  // First check if tags are stored in additional_metadata
  const storedTags = (notification.additional_metadata as any)?.tags;
  if (storedTags && Array.isArray(storedTags)) {
    return storedTags;
  }
  
  // Fall back to auto-generated tags
  return generateContactTags(notification);
};

export const calculateContactStats = (contacts: Contact[]): ContactStats => {
  const totalContacts = contacts.length;
  const activeClients = contacts.filter(c => c.status === 'active').length;
  const pastClients = contacts.filter(c => c.status === 'past_client').length;
  const totalEvents = contacts.reduce((sum, c) => sum + c.totalEvents, 0);
  
  return {
    totalContacts,
    activeClients,
    pastClients,
    totalRevenue: 0, // Would need pricing data
    avgEventsPerClient: totalContacts > 0 ? totalEvents / totalContacts : 0
  };
};

const extractContactDetails = (notification: EventNotification, formData?: any) => {
  const contactDetails: any = {};
  
  if (notification.event_type === 'wedding' && formData) {
    contactDetails.brideInfo = {
      name: capitalizeNames(formData.brideName || ''),
      email: formData.brideEmail || '',
      phone: formData.bridePhone || ''
    };
    contactDetails.groomInfo = {
      name: capitalizeNames(formData.groomName || ''),
      email: formData.groomEmail || '',
      phone: formData.groomPhone || ''
    };
  } else if (notification.event_type === 'quince' && formData) {
    contactDetails.quinceaneraInfo = {
      name: formData.quinceaneraName || '',
    };
    contactDetails.parentInfo = {
      name: formData.parentName || '',
      email: formData.parentEmail || '',
      phone: formData.parentPhone || ''
    };
  } else if (notification.event_type === 'birthday' && formData) {
    contactDetails.honoreeInfo = {
      name: formData.honoreeName || '',
    };
    contactDetails.parentInfo = {
      name: formData.parentName || '',
      email: formData.parentEmail || '',
      phone: formData.parentPhone || ''
    };
  } else if (notification.event_type === 'graduation' && formData) {
    contactDetails.graduateInfo = {
      name: formData.graduateName || '',
    };
    contactDetails.contactInfo = {
      name: formData.contactName || '',
      email: formData.contactEmail || '',
      phone: formData.contactPhone || ''
    };
  } else if (notification.event_type === 'banquet' && formData) {
    contactDetails.contactInfo = {
      name: formData.contactName || '',
      email: formData.contactEmail || '',
      phone: formData.contactPhone || ''
    };
  }
  
  return contactDetails;
};

export const filterContacts = (
  contacts: Contact[], 
  filters: Partial<{ status: string; eventType: string; search: string; tags: string[] }>
): Contact[] => {
  return contacts.filter(contact => {
    // Status filter
    if (filters.status && filters.status !== 'all' && contact.status !== filters.status) {
      return false;
    }
    
    // Event type filter
    if (filters.eventType && filters.eventType !== 'all' && !contact.eventTypes.includes(filters.eventType)) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchMatch = 
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower) ||
        contact.preferredVenues.some(venue => venue.toLowerCase().includes(searchLower));
      
      if (!searchMatch) return false;
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => contact.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });
};
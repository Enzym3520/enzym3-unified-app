import { PrePopulationContext } from '@/hooks/useFormPrePopulation';
import { EventNotification } from '@/types/notification';
import { detectEventTypeFromNotification } from './eventTypeDetection';

export interface PrePopulationUrlOptions {
  templateId?: string;
  eventId?: string;
  submissionId?: string;
  contactEmail?: string;
  contactName?: string;
  weddingId?: string;
  baseUrl?: string;
}

/**
 * Generates a pre-populated form URL based on various context options
 */
/**
 * Generates a pre-populated form URL (full absolute URL for external links/emails)
 */
export const generatePrePopulatedFormUrl = (options: PrePopulationUrlOptions): string => {
  const baseUrl = options.baseUrl || window.location.origin;
  const formPath = options.templateId ? `/comprehensive-form?template=${options.templateId}` : '/comprehensive-form';
  
  const params = new URLSearchParams();
  
  // Add context parameters based on available options
  if (options.eventId) {
    params.set('from_event', options.eventId);
  }
  
  if (options.submissionId) {
    params.set('from_submission', options.submissionId);
  }
  
  if (options.contactEmail) {
    params.set('contact_email', options.contactEmail);
  }
  
  if (options.contactName) {
    params.set('contact_name', options.contactName);
  }
  
  if (options.weddingId) {
    params.set('wedding_id', options.weddingId);
  }
  
  const queryString = params.toString();
  if (!queryString) {
    return `${baseUrl}${formPath}`;
  }
  
  // If formPath already has query params (templateId), use &, otherwise use ?
  const separator = formPath.includes('?') ? '&' : '?';
  return `${baseUrl}${formPath}${separator}${queryString}`;
};

/**
 * Generates a pre-populated form path (relative path for React Router navigation)
 */
export const generatePrePopulatedFormPath = (options: PrePopulationUrlOptions): string => {
  const formPath = options.templateId 
    ? `/comprehensive-form?template=${options.templateId}` 
    : '/comprehensive-form';
  
  const params = new URLSearchParams();
  
  if (options.eventId) params.set('from_event', options.eventId);
  if (options.submissionId) params.set('from_submission', options.submissionId);
  if (options.contactEmail) params.set('contact_email', options.contactEmail);
  if (options.contactName) params.set('contact_name', options.contactName);
  if (options.weddingId) params.set('wedding_id', options.weddingId);
  
  const queryString = params.toString();
  if (!queryString) return formPath;
  
  const separator = formPath.includes('?') ? '&' : '?';
  return `${formPath}${separator}${queryString}`;
};

/**
 * Creates pre-population URLs for common scenarios
 */
export const createPrePopulationUrls = {
  // Full URL methods (for emails, external links)
  fromEventNotification: (eventId: string, templateId?: string) =>
    generatePrePopulatedFormUrl({ eventId, templateId }),
    
  fromEventNotificationWithTemplate: (notification: EventNotification) => {
    const eventType = detectEventTypeFromNotification(notification);
    const templateParam = eventType === 'wedding' ? 'wedding' : 'non-wedding';
    return generatePrePopulatedFormUrl({ 
      eventId: notification.id, 
      templateId: templateParam 
    });
  },
    
  fromFormSubmission: (submissionId: string, templateId?: string) =>
    generatePrePopulatedFormUrl({ submissionId, templateId }),
    
  fromContact: (contactEmail: string, contactName?: string, templateId?: string) =>
    generatePrePopulatedFormUrl({ contactEmail, contactName, templateId }),
    
  fromWedding: (weddingId: string, templateId?: string) =>
    generatePrePopulatedFormUrl({ weddingId, templateId }),

  // Relative path methods (for React Router navigation)
  fromEventNotificationForNavigation: (notification: EventNotification) => {
    const eventType = detectEventTypeFromNotification(notification);
    const templateParam = eventType === 'wedding' ? 'wedding' : 'non-wedding';
    return generatePrePopulatedFormPath({ 
      eventId: notification.id, 
      templateId: templateParam 
    });
  }
};

/**
 * Field mapping utilities for common field name variations - Enhanced
 */
export const fieldNameVariations = {
  email: ['email', 'contact_email', 'primary_email', 'bride_email', 'groom_email', 'primary_contact_email', 'brideEmail', 'groomEmail'],
  phone: ['phone', 'contact_phone', 'primary_phone', 'bride_phone', 'groom_phone', 'primary_contact_phone', 'bridePhone', 'groomPhone'],
  name: ['name', 'contact_name', 'primary_name', 'full_name', 'couple_name', 'couple_names'],
  firstName: ['first_name', 'bride_name', 'bride_first_name', 'honoree_name', 'quinceañera_name', 'brideName'],
  lastName: ['last_name', 'surname', 'bride_last_name', 'groom_last_name'],
  groomName: ['groom_name', 'groom_first_name', 'partner_name', 'groomName'],
  brideName: ['bride_name', 'bride_first_name', 'partner_name', 'brideName'],
  eventDate: ['event_date', 'wedding_date', 'party_date', 'celebration_date', 'weddingDate'],
  venue: ['venue', 'venue_name', 'location', 'venue_address', 'ceremony_venue', 'reception_venue'],
  venueCode: ['venue_code', 'venueCode', 'venue_id'],
  eventType: ['event_type', 'type', 'celebration_type', 'eventType'],
  guestCount: ['guest_count', 'numberOfGuests', 'expected_guests', 'number_of_guests', 'number of guests', 'Number of Guests', 'guestCount'],
  packageType: ['package_type', 'packageType', 'selected_package', 'service_package', 'wedding_package'],
  coordinator: ['coordinator_name', 'from', 'coordinator', 'planner_name'],
  vendors: ['vendors', 'vendor_names', 'dj_name', 'service_providers'],
  vendorType: ['vendor_type', 'vendorType', 'service_type'],
  contract: ['contract', 'contract_number', 'contract_details'],
  notes: ['notes', 'comments', 'additional_notes', 'special_requests', 'special_requirements']
};

/**
 * Smart field matching - finds the best field name match
 */
export const findBestFieldMatch = (targetField: string, availableFields: string[]): string | null => {
  // Exact match first
  if (availableFields.includes(targetField)) {
    return targetField;
  }
  
  // Check variations
  for (const [category, variations] of Object.entries(fieldNameVariations)) {
    if (variations.includes(targetField)) {
      for (const variation of variations) {
        if (availableFields.includes(variation)) {
          return variation;
        }
      }
    }
  }
  
  // Fuzzy matching for similar names
  const normalizedTarget = targetField.toLowerCase().replace(/[_-]/g, '');
  for (const field of availableFields) {
    const normalizedField = field.toLowerCase().replace(/[_-]/g, '');
    if (normalizedField.includes(normalizedTarget) || normalizedTarget.includes(normalizedField)) {
      return field;
    }
  }
  
  return null;
};

/**
 * Validates and cleans pre-population data - Enhanced
 */
export const validatePrePopulationData = (data: Record<string, any>): Record<string, any> => {
  const cleanData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip null, undefined, or empty string values
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    // Handle different data types
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        cleanData[key] = trimmedValue;
      }
    } else if (typeof value === 'number' && !isNaN(value)) {
      cleanData[key] = value;
    } else if (typeof value === 'boolean') {
      cleanData[key] = value;
    } else if (value instanceof Date) {
      cleanData[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      cleanData[key] = value;
    } else if (typeof value === 'object' && Object.keys(value).length > 0) {
      cleanData[key] = value;
    }
  }
  
  return cleanData;
};

/**
 * Merges multiple data sources with priority
 */
export const mergePrePopulationData = (
  dataSources: Array<{ data: Record<string, any>; priority: number; source: string }>
): Record<string, any> => {
  // Sort by priority (higher number = higher priority)
  const sortedSources = dataSources.sort((a, b) => b.priority - a.priority);
  
  const mergedData: Record<string, any> = {};
  
  for (const source of sortedSources) {
    for (const [key, value] of Object.entries(source.data)) {
      // Only use this value if we don't already have a value for this field
      // or if this source has higher priority
      if (!(key in mergedData) || source.priority > 
          (dataSources.find(s => s.data[key] === mergedData[key])?.priority || 0)) {
        mergedData[key] = value;
      }
    }
  }
  
  return validatePrePopulationData(mergedData);
};

/**
 * Creates a context description for UI display
 */
export const getContextDescription = (context: PrePopulationContext): string => {
  switch (context.source) {
    case 'event_notification':
      return `Pre-filled from event notification${context.contactName ? ` for ${context.contactName}` : ''}`;
    case 'form_submission':
      return `Pre-filled from previous form submission${context.email ? ` (${context.email})` : ''}`;
    case 'contact':
      return `Pre-filled from contact history${context.contactName ? ` for ${context.contactName}` : ''}`;
    case 'wedding':
      return `Pre-filled from wedding record${context.weddingId ? ` (${context.weddingId})` : ''}`;
    default:
      return 'Pre-filled from existing data';
  }
};
import { FormData } from '@/types/eventForm';
import { toLocalDateString } from '@/lib/dateWrite';
import { detectTestData, addTestDetectionMetadata } from '@/utils/testDataDetection';
import { capitalizeNames } from '@/utils/contactHelpers';
import { logger } from '@/utils/logger';

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface ClientInfo {
  userAgent: string;
  timestamp: string;
  url: string;
  referrer: string;
}

export const getCoupleName = (data: FormData): string => {
  switch (data.eventType) {
    case 'wedding':
      return `${data.brideName} & ${data.groomName}`;
    case 'quince':
      return data.quinceaneraName || 'Unknown';
    case 'birthday':
    case 'sweet16':
      return data.honoreeName || 'Unknown';
    case 'graduation':
      return data.graduateName || data.contactName || 'Unknown';
    case 'banquet':
      return data.contactName || 'Unknown';
    default:
      return 'Unknown';
  }
};

export const getContactInfo = (data: FormData): ContactInfo => {
  switch (data.eventType) {
    case 'wedding':
      // For notifications, prioritize bride's info, but fall back to groom's
      return {
        email: data.brideEmail || data.groomEmail || '',
        phone: data.bridePhone || data.groomPhone || ''
      };
    case 'quince':
    case 'birthday':
    case 'sweet16':
      return {
        email: data.parentEmail || '',
        phone: data.parentPhone || ''
      };
    case 'banquet':
    case 'graduation':
      return {
        email: data.contactEmail || '',
        phone: data.contactPhone || ''
      };
    default:
      return { email: '', phone: '' };
  }
};

export const getClientInfo = (): ClientInfo => {
  return {
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    referrer: document.referrer
  };
};

export const buildNotificationData = (
  data: FormData,
  uploadedFile: File | null,
  formProgress: number,
  payload: any
) => {
  const contactInfo = getContactInfo(data);
  const djName = data.vendorType?.toLowerCase().includes('dj') ? data.vendors : null;
  const clientInfo = getClientInfo();

  // Enhanced guest count extraction with multiple fallbacks
  const guestCount = extractGuestCount(data);
  
  // Detect if this is test data
  const testDetection = detectTestData({
    couple_name: getCoupleName(data),
    contact_email: contactInfo.email,
    submitted_by: data.from,
    coordinator_name: data.from,
    venue: data.venue,
    notes: data.notes
  });
  
  logger.debug('Building notification data with guest count', { guestCount, eventType: data.eventType });

  return {
    event_type: data.eventType,
    booking_source: data.bookingSource || null,
    pricing_type: data.bookingSource === 'independent' ? (data.pricingType || 'hourly') : 'hourly',
    hours_booked: data.hoursBooked || null,
    hourly_rate: data.hourlyRate || null,
    total_price: data.totalPrice || null,
    deposit_amount: data.depositAmount || null,
    couple_name: getCoupleName(data),
    event_date: toLocalDateString(data.weddingDate),
    start_time: data.eventStartTime || null,
    end_time: data.eventEndTime || null,
    venue: data.venue,
    coordinator_name: capitalizeNames(data.from),
    dj_name: djName ? capitalizeNames(djName) : null,
    package_type: data.bookingSource === 'independent' ? null : (data.packageType || null),
    status: 'submitted' as const,
    submitted_by: capitalizeNames(data.from),
    contact_email: contactInfo.email,
    contact_phone: contactInfo.phone || null,
    file_uploaded: !!uploadedFile,
    notes: data.notes || null,
    webhook_url: null, // Webhook URL is handled securely in edge functions
    webhook_response: null,
    webhook_status_code: null,
    form_progress: Math.round(formProgress),
    user_agent: clientInfo.userAgent,
    guest_count: guestCount,
    is_test: testDetection.isTest,
    assigned_vendor_id: data.assignedVendorId || null,
    // Dress code
    dress_code: data.dressCode ? (data.dressCode === 'themed' && data.dressCodeCustom ? `Themed: ${data.dressCodeCustom}` : data.dressCode) : null,
    // Venue address — surfaced to Vendor Hub for the maps link
    venue_address: (data as any).venueAddress || (data as any).address || (data as any).venue_address || null,
    // Honoree name (non-wedding events) and mirrored client name so vendors see the headline
    honoree_name: (() => {
      switch (data.eventType) {
        case 'quince': return (data as any).quinceaneraName ? capitalizeNames((data as any).quinceaneraName) : null;
        case 'birthday': case 'sweet16': return (data as any).honoreeName ? capitalizeNames((data as any).honoreeName) : null;
        case 'graduation': return (data as any).graduateName ? capitalizeNames((data as any).graduateName) : null;
        default: return null;
      }
    })(),
    client_name: getCoupleName(data),
    // Top-level bride/groom emails for direct email sending
    bride_email: data.brideEmail || null,
    groom_email: data.groomEmail || null,
    primary_contact_name: (() => {
      switch (data.eventType) {
        case 'wedding': return data.brideName ? capitalizeNames(data.brideName) : null;
        case 'quince': case 'birthday': case 'sweet16': return data.parentName ? capitalizeNames(data.parentName) : null;
        case 'graduation': case 'banquet': return data.contactName ? capitalizeNames(data.contactName) : null;
        default: return null;
      }
    })(),
    primary_contact_email: (() => {
      switch (data.eventType) {
        case 'wedding': return data.brideEmail || null;
        case 'quince': case 'birthday': case 'sweet16': return (data as any).parentEmail || null;
        case 'graduation': case 'banquet': return (data as any).contactEmail || null;
        default: return null;
      }
    })(),
    primary_contact_phone: (() => {
      switch (data.eventType) {
        case 'wedding': return (data as any).bridePhone || null;
        case 'quince': case 'birthday': case 'sweet16': return (data as any).parentPhone || null;
        case 'graduation': case 'banquet': return (data as any).contactPhone || null;
        default: return null;
      }
    })(),
    secondary_contact_name: data.eventType === 'wedding' && data.groomName ? capitalizeNames(data.groomName) : null,
    secondary_contact_email: data.eventType === 'wedding' ? (data.groomEmail || null) : null,
    secondary_contact_phone: data.eventType === 'wedding' ? ((data as any).groomPhone || null) : null,
    additional_metadata: addTestDetectionMetadata(data, {
      form_url: clientInfo.url,
      referrer: clientInfo.referrer,
      submission_timestamp: clientInfo.timestamp,
      payload_size: JSON.stringify(payload).length,
      // Top-level booking fields for easy access
      bookingSource: data.bookingSource || null,
      pricingType: data.pricingType || null,
      hoursBooked: data.hoursBooked || null,
      hourlyRate: data.hourlyRate || null,
      totalPrice: data.totalPrice || null,
      depositAmount: data.depositAmount || null,
        // Enhanced form data storage with comprehensive guest count mapping
        form_data: {
          // Primary guest count field (normalized)
          // Store only the canonical key; keep read-path flexible elsewhere
          numberOfGuests: guestCount,
          
          // Contact information fields - preserve all for enhanced contact display
          brideName: data.brideName,
          groomName: data.groomName,
          brideEmail: data.brideEmail,
          groomEmail: data.groomEmail,
          bridePhone: data.bridePhone,
          groomPhone: data.groomPhone,
          quinceaneraName: data.quinceaneraName,
          parentName: data.parentName,
          parentEmail: data.parentEmail,
          parentPhone: data.parentPhone,
          honoreeName: data.honoreeName,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          
          // Other form fields
          contract: data.contract,
          packageType: data.packageType,
          venueCode: data.venueCode,
          vendors: data.vendors,
          vendorType: data.vendorType,
          email: data.email,
          notes: data.notes,
          
          // Include all other form fields that might be useful for pre-population
          ...Object.fromEntries(
            Object.entries(data).filter(([, value]) =>
              value !== undefined && value !== null && value !== ''
            )
          )
        },
      // Store guest count at top level too for easier access
      numberOfGuests: guestCount,
      guestCount: guestCount
    })
  };
};

// Enhanced guest count extraction function
const extractGuestCount = (data: FormData): number | null => {
  // Try multiple field variations in order of priority
  const guestCountFields = [
    'numberOfGuests',
    'guestCount', 
    'number_of_guests',
    'expected_guests',
    'Number of Guests',
    'number of guests'
  ];
  
  for (const field of guestCountFields) {
    const value = data[field as keyof FormData];
    if (value !== undefined && value !== null && value !== '') {
      const numValue = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (!isNaN(numValue) && numValue > 0) {
        logger.debug(`Found guest count ${numValue} in field: ${field}`);
        return numValue;
      }
    }
  }
  
  logger.debug('No valid guest count found in form data');
  return null;
};
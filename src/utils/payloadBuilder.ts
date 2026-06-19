import { format } from 'date-fns';
import { FormData } from '@/types/eventForm';
import { toLocalDateString } from '@/lib/dateWrite';

export interface PayloadMetadata {
  timestamp: string;
  formProgress: number;
  source: string;
  version: string;
}

export interface EventPayload {
  metadata: PayloadMetadata;
  wedding_id: string;
  coordinator: {
    name: string;
    role: string;
  };
  event: {
    type: string;
    date: string;
    dateFormatted: string;
    guestCount: number;
    contract: string | null;
    packageType: string | null;
    venue: string;
    venueCode: string | null;
  };
  vendor: {
    names: string;
    type: string;
    assignedVendorId: string | null;
    details: string[];
  };
  participants: Record<string, any>;
  additional: {
    email: string | null;
    notes: string | null;
    uploadedFile: {
      name: string;
      size: number;
      type: string;
    } | null;
  };
}

export const getParticipantsByEventType = (data: FormData): Record<string, any> => {
  switch (data.eventType) {
    case 'wedding':
      return {
        bride: {
          name: data.brideName,
          phone: data.bridePhone,
          email: data.brideEmail
        },
        groom: {
          name: data.groomName,
          phone: data.groomPhone,
          email: data.groomEmail
        }
      };
    case 'quince':
      return {
        quinceañera: {
          name: data.quinceaneraName
        },
        parent: {
          name: data.parentName,
          phone: data.parentPhone,
          email: data.parentEmail
        }
      };
    case 'birthday':
    case 'sweet16':
      return {
        honoree: {
          name: data.honoreeName
        },
        contact: {
          name: data.parentName,
          phone: data.parentPhone,
          email: data.parentEmail
        }
      };
    case 'graduation':
      return {
        graduate: {
          name: data.graduateName || ''
        },
        contact: {
          name: data.contactName,
          phone: data.contactPhone,
          email: data.contactEmail
        }
      };
    case 'banquet':
      return {
        contact: {
          name: data.contactName,
          phone: data.contactPhone,
          email: data.contactEmail
        }
      };
    default:
      return {};
  }
};

export const buildEventPayload = (
  data: FormData,
  uploadedFile: File | null,
  formProgress: number
): EventPayload => {
  // Extract wedding_id from form data or generate fallback
  const weddingId = data.wedding_id || crypto.randomUUID();
  
  return {
    metadata: {
      timestamp: new Date().toISOString(),
      formProgress: Math.round(formProgress),
      source: "Event Notification Form",
      version: "1.0"
    },
    wedding_id: weddingId,
    coordinator: {
      name: data.from,
      role: "Event Coordinator"
    },
    event: {
      type: data.eventType,
      date: toLocalDateString(data.weddingDate),
      dateFormatted: format(data.weddingDate, 'PPP'),
      guestCount: data.numberOfGuests,
      contract: data.contract || null,
      packageType: data.packageType || null,
      venue: data.venue,
      venueCode: data.venueCode || null
    },
    vendor: {
      names: data.vendors,
      type: data.vendorType,
      assignedVendorId: data.assignedVendorId || null,
      details: data.vendors.split(',').map(v => v.trim()).filter(v => v.length > 0)
    },
    participants: getParticipantsByEventType(data),
    additional: {
      email: data.email || null,
      notes: data.notes || null,
      uploadedFile: uploadedFile ? {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type
      } : null
    }
  };
};
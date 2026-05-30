import { EventNotification, WebhookPayload } from '@/types/notification';
import { parseLocalDate } from '@/utils/dateHelpers';

/**
 * Parse participants based on event type from notification data
 */
export const parseParticipants = (notification: EventNotification) => {
  switch (notification.event_type) {
    case 'wedding':
      // For weddings, we need to split the couple_name
      const names = (notification.couple_name || '').split(' & ');
      return {
        bride: {
          name: names[0] || '',
          phone: notification.contact_phone || '',
          email: notification.contact_email || ''
        },
        groom: {
          name: names[1] || '',
          phone: '',
          email: ''
        }
      };
    case 'quince':
      return {
        quinceañera: {
          name: notification.couple_name
        },
        parent: {
          name: notification.submitted_by,
          phone: notification.contact_phone || '',
          email: notification.contact_email || ''
        }
      };
    case 'birthday':
    case 'sweet16':
      return {
        honoree: {
          name: notification.couple_name
        },
        contact: {
          name: notification.submitted_by,
          phone: notification.contact_phone || '',
          email: notification.contact_email || ''
        }
      };
    case 'graduation':
      return {
        graduate: {
          name: notification.couple_name
        },
        contact: {
          name: notification.submitted_by,
          phone: notification.contact_phone || '',
          email: notification.contact_email || ''
        }
      };
    case 'banquet':
      return {
        contact: {
          name: notification.couple_name,
          phone: notification.contact_phone || '',
          email: notification.contact_email || ''
        }
      };
    default:
      return {};
  }
};

/**
 * Reconstruct webhook payload from notification data
 */
export const reconstructWebhookPayload = (
  notification: EventNotification,
  options: {
    source?: string;
    reason?: string;
    editCount?: number;
    isEdited?: boolean;
  } = {}
): WebhookPayload => {
  const {
    source = "Event Notification Form (Resend)",
    reason,
    editCount,
    isEdited = false
  } = options;

  // Extract wedding_id from notification metadata or generate fallback
  const weddingId = (notification.additional_metadata as any)?.wedding_id || 
                   `${notification.event_type}-${notification.id.substring(0, 8)}`;

  // Derive guestCount for resend payloads: prefer top-level guest_count, then metadata
  const meta = (notification.additional_metadata as any) || {};
  const formData = typeof meta.form_data === 'string' ? (() => { try { return JSON.parse(meta.form_data); } catch { return {}; } })() : (meta.form_data || {});
  const derivedGuestCount = (notification as any).guest_count ?? meta.numberOfGuests ?? meta.guestCount ?? formData.numberOfGuests ?? formData.guestCount ?? formData.number_of_guests ?? formData.expected_guests ?? formData['Number of Guests'] ?? formData['number of guests'] ?? null;

  // Extract individual participant details from formData
  const participantDetails: Record<string, any> = {
    bride_name: formData.brideName || '',
    groom_name: formData.groomName || '',
    bride_email: formData.brideEmail || '',
    groom_email: formData.groomEmail || '',
    bride_phone: formData.bridePhone || '',
    groom_phone: formData.groomPhone || '',
    parent_name: formData.parentName || '',
    parent_email: formData.parentEmail || '',
    parent_phone: formData.parentPhone || '',
    contact_name: formData.contactName || '',
    contact_email: formData.contactEmail || '',
    contact_phone: formData.contactPhone || '',
    quinceañera_name: formData.quinceañeraName || formData.quinceanera || '',
    honoree_name: formData.honoreeName || ''
  };

  return {
    metadata: {
      timestamp: new Date().toISOString(),
      formProgress: notification.form_progress || 100,
      source,
      version: "1.0",
      resendReason: reason || null,
      originalSubmissionId: notification.id,
      ...(editCount !== undefined && { editCount }),
      ...(isEdited && { isEdited })
    },
    wedding_id: weddingId,
    coordinator: {
      name: notification.coordinator_name || notification.submitted_by,
      role: "Event Coordinator"
    },
    event: {
      type: notification.event_type,
      date: notification.event_date,
      dateFormatted: parseLocalDate(notification.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      guestCount: derivedGuestCount,
      contract: null, // Not stored in history
      packageType: notification.package_type,
      venue: notification.venue,
      venueCode: null // Not stored in history
    },
    vendor: {
      names: notification.dj_name || '',
      type: notification.dj_name ? 'DJ' : '',
      details: notification.dj_name ? [notification.dj_name] : []
    },
    participants: parseParticipants(notification),
    participant_details: participantDetails,
    additional: {
      email: notification.contact_email,
      notes: notification.notes,
      uploadedFile: notification.file_uploaded ? {
        name: "File uploaded (details not stored)",
        size: null,
        type: null
      } : null
    }
  };
};

/**
 * Send webhook payload to specified URL
 */
export const sendWebhookPayload = async (
  url: string,
  payload: WebhookPayload
): Promise<{
  response: string;
  statusCode: number;
  error: string | null;
}> => {
  let webhookResponse = '';
  let webhookStatusCode = 0;
  let webhookError: string | null = null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    webhookStatusCode = response.status;
    
    try {
      webhookResponse = await response.text();
    } catch (parseError) {
      webhookResponse = `Response parsing failed: ${parseError}`;
    }

    if (!response.ok) {
      webhookError = `HTTP ${response.status}: ${webhookResponse}`;
    }
  } catch (fetchError) {
    webhookError = `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
    webhookStatusCode = 0;
    webhookResponse = webhookError;
  }

  return {
    response: webhookResponse,
    statusCode: webhookStatusCode,
    error: webhookError
  };
};
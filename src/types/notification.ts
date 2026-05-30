export interface EventNotification {
  id: string;
  event_type: string;
  couple_name: string;
  event_date: string;
  venue?: string;
  coordinator_name?: string;
  dj_name?: string;
  package_type?: string;
  status: 'submitted' | 'in_progress' | 'completed';
  submitted_by: string;
  contact_email: string;
  contact_phone?: string;
  guest_count?: number;
  file_uploaded: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  webhook_url?: string;
  webhook_response?: string;
  webhook_status_code?: number;
  form_progress?: number;
  ip_address?: string;
  user_agent?: string;
  resend_count?: number;
  last_resent_at?: string;
  printed_at?: string;
  edit_count?: number;
  edited_at?: string;
  email_sent_at?: string;
  additional_metadata?: Record<string, any>;
  is_test?: boolean;
}

export interface WebhookPayload {
  metadata: {
    timestamp: string;
    formProgress: number;
    source: string;
    version: string;
    resendReason?: string | null;
    originalSubmissionId?: string;
    editCount?: number;
    isEdited?: boolean;
  };
  wedding_id: string;
  coordinator: {
    name: string;
    role: string;
  };
    event: {
      type: string;
      date: string;
      dateFormatted: string;
      guestCount: number | null;
      contract: string | null;
      packageType?: string;
      venue?: string;
      venueCode: string | null;
    };
  vendor: {
    names: string;
    type: string;
    details: string[];
  };
  participants: Record<string, any>;
  participant_details?: Record<string, any>;
  additional: {
    email: string;
    notes?: string;
    uploadedFile?: {
      name: string;
      size: null;
      type: null;
    } | null;
  };
}

export interface WebhookResponse {
  response: string | null;
  statusCode: number | null;
  error: string | null;
}

export interface ResendHistoryEntry {
  timestamp: string;
  reason?: string | null;
  webhook_status: number | null;
  webhook_error?: string | null;
  type?: string;
}

export interface EditHistoryEntry {
  timestamp: string;
  reason?: string | null;
  changes: Partial<EventNotification>;
  edited_by: string;
}
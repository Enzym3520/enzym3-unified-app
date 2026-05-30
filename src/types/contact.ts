import { EventNotification } from './notification';

export interface ContactPerson {
  name: string;
  email?: string;
  phone?: string;
}

export interface FormSubmission {
  id: string;
  wedding_id: string;
  form_template_id: string;
  form_data: Record<string, any>;
  contact_email: string;
  contact_name: string;
  status: 'draft' | 'submitted' | 'processed' | 'emailed';
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  pdf_generated_at?: string;
  email_sent_at?: string;
  webhook_url?: string;
  webhook_sent_at?: string;
  metadata: Record<string, any>;
}

export interface UploadedDetailsForm {
  id: string;
  wedding_id: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  uploaded_by: string;
  notes?: string;
  uploaded_at: string;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eventHistory: EventNotification[];
  formSubmissions: FormSubmission[];
  uploadedDetailsForms: UploadedDetailsForm[];
  primaryEventDate: string;
  primaryEventType: string;
  totalEvents: number;
  eventTypes: string[];
  preferredVenues: string[];
  totalRevenue?: number;
  status: 'active' | 'past_client' | 'potential';
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced contact info for weddings
  brideInfo?: ContactPerson;
  groomInfo?: ContactPerson;
  // For other event types
  honoreeInfo?: ContactPerson;
  parentInfo?: ContactPerson;
  quinceaneraInfo?: ContactPerson;
  contactInfo?: ContactPerson;
  // Form completion tracking
  completedForms: number;
  totalForms: number;
  formCompletionRate: number;
}

export interface ContactFilters {
  status: string;
  eventType: string;
  search: string;
  tags: string[];
}

export interface ContactStats {
  totalContacts: number;
  activeClients: number;
  pastClients: number;
  totalRevenue: number;
  avgEventsPerClient: number;
}
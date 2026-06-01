export interface VendorEventDetails {
  id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
  status: string;
  guest_count: number | null;
  package_type: string | null;
  coordinator_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  hours_booked: number | null;
  booking_source: string | null;
  contact_instruction?: string | null;
  start_time?: string | null;
  dress_code?: string | null;
  client_name?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  honoree_name?: string | null;
}

export interface VendorAssignment {
  id: string;
  dj_user_id: string;
  event_id: string;
  status: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  declined_reason: string | null;
  assignment_notes: string | null;
  vendor_files_uploaded: boolean | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  event: VendorEventDetails;
}

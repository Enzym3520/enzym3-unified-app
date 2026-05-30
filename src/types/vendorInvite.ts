export interface VendorInvite {
  id: string;
  code: string;
  invited_email: string;
  invited_first_name?: string;
  invited_last_name?: string;
  invited_company?: string;
  invited_role: string;
  vendor_type?: string;
  active: boolean;
  expires_at: string;
  used_at?: string;
  used_by?: string;
  created_at: string;
  email: string;
  name: string;
  notes?: string;
}

export interface BulkInviteRow {
  email: string;
  firstName?: string;
  lastName?: string;
  vendorType: string;
  companyName?: string;
  expiresInDays?: number;
}

export interface BulkInviteResult {
  successful: Array<{
    email: string;
    code: string;
    registrationLink: string;
  }>;
  failed: Array<{
    email: string;
    error: string;
  }>;
  skipped: Array<{
    email: string;
    reason: string;
  }>;
}

export interface VendorAssignment {
  id: string;
  event_id: string;
  event_notification_id?: string;
  dj_user_id: string;
  status: string;
  notes?: string;
  assignment_notes?: string;
  assigned_at?: string;
  assigned_by?: string;
  confirmed_at?: string;
  declined_reason?: string;
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  vendor_files_uploaded: boolean;
  created_at: string;
  updated_at: string;
  event?: any;
}

export interface VendorUpload {
  id: string;
  event_id: string;
  vendor_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  notes?: string;
  category?: string;
  created_at: string;
}

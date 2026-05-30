export interface Reminder {
  id: string;
  contact_email: string;
  contact_name: string;
  reminder_type: 'pre_wedding' | 'post_wedding' | 'anniversary' | 'business_development' | 'custom';
  scheduled_date: string;
  status: 'pending' | 'sent' | 'completed' | 'cancelled' | 'pending_approval' | 'approved';
  message_template?: string;
  generated_message?: string;
  channel: 'email' | 'phone' | 'both';
  priority: 'low' | 'medium' | 'high';
  event_context?: Record<string, any>;
  notes?: string;
  sent_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ReminderFilters {
  status: string;
  type: string;
  priority: string;
  search: string;
  dateRange: {
    start?: string;
    end?: string;
  };
}

export interface ReminderStats {
  totalReminders: number;
  pendingReminders: number;
  sentReminders: number;
  overdueReminders: number;
  upcomingReminders: number;
}

export interface ReminderTemplate {
  type: 'pre_wedding' | 'post_wedding' | 'anniversary' | 'business_development' | 'custom';
  title: string;
  description: string;
  defaultDays: number;
  chatGPTPrompt: string;
  variables: string[];
}

export interface CreateReminderData {
  contact_email: string;
  contact_name: string;
  reminder_type: Reminder['reminder_type'];
  scheduled_date: string;
  channel?: Reminder['channel'];
  priority?: Reminder['priority'];
  message_template?: string;
  notes?: string;
  event_context?: Record<string, any>;
}
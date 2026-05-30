export type CalendarItemType = 'event' | 'meeting';

export interface CalendarMeeting {
  id: string;
  wedding_id: string;
  booking_date: string;
  booking_time: string;
  meeting_type: string;
  meeting_format: string | null;
  meeting_link: string | null;
  status: string;
  customer_notes: string | null;
  couple_name: string;
  contact_email: string;
  venue: string | null;
}

export interface CalendarItemFilters {
  itemType?: 'all' | 'events' | 'meetings';
  eventType?: string;
  meetingType?: string;
  status?: string;
  search?: string;
}

import { Contact } from '@/types/contact';
import { Reminder, ReminderTemplate, CreateReminderData } from '@/types/reminder';
import { addDays, subDays, addYears, format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';

export const REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    type: 'pre_wedding',
    title: 'Pre-Wedding Check-in',
    description: 'Follow up with couple before their wedding',
    defaultDays: -7, // 7 days before wedding
    variables: ['couple_name', 'wedding_date', 'venue', 'package_type'],
    chatGPTPrompt: `Create a warm, professional pre-wedding check-in message for {couple_name}. Their wedding is on {wedding_date} at {venue}. They have the {package_type} package. Express excitement, offer final assistance, and ensure everything is ready. Keep it personal but professional, around 100-150 words.`
  },
  {
    type: 'post_wedding',
    title: 'Post-Wedding Thank You',
    description: 'Thank the couple after their wedding',
    defaultDays: 3, // 3 days after wedding
    variables: ['couple_name', 'wedding_date', 'venue', 'package_type'],
    chatGPTPrompt: `Write a heartfelt post-wedding thank you message for {couple_name}. Their wedding was on {wedding_date} at {venue} with the {package_type} package. Thank them for choosing our services, express hope that their day was perfect, and subtly encourage them to share feedback or refer friends. Keep it genuine and grateful, around 100-150 words.`
  },
  {
    type: 'anniversary',
    title: 'Wedding Anniversary',
    description: 'Celebrate their wedding anniversary',
    defaultDays: 365, // 1 year after wedding
    variables: ['couple_name', 'wedding_date', 'years_married'],
    chatGPTPrompt: `Create a warm anniversary message for {couple_name} celebrating {years_married} year(s) of marriage. Their wedding was on {wedding_date}. Share in their joy, acknowledge this milestone, and subtly mention our services for future celebrations or referrals. Keep it celebratory and personal, around 80-120 words.`
  },
  {
    type: 'business_development',
    title: 'Business Development',
    description: 'Reach out for potential new opportunities',
    defaultDays: 180, // 6 months after wedding
    variables: ['couple_name', 'wedding_date', 'package_type'],
    chatGPTPrompt: `Write a friendly business development message for {couple_name}. Their wedding was {wedding_date} with the {package_type} package. Check in on married life, ask if they know anyone planning events, and mention our services for other celebrations (anniversaries, birthdays, corporate events). Keep it natural and relationship-focused, around 100-150 words.`
  }
];

export const generateAutomaticReminders = (contact: Contact): CreateReminderData[] => {
  const reminders: CreateReminderData[] = [];
  const primaryEventDate = parseLocalDate(contact.primaryEventDate);
  const now = new Date();

  // Only generate reminders for future events or recent past events (within 30 days)
  const daysSinceEvent = Math.floor((now.getTime() - primaryEventDate.getTime()) / (1000 * 60 * 60 * 24));
  const isRecentOrFuture = daysSinceEvent <= 30;

  if (!isRecentOrFuture) return reminders;

  REMINDER_TEMPLATES.forEach(template => {
    let scheduledDate: Date;
    const eventContext: Record<string, any> = {
      contact_email: contact.email,
      event_type: contact.primaryEventType,
      event_date: contact.primaryEventDate,
      venue: contact.preferredVenues[0] || '',
      package_type: contact.eventHistory[0]?.package_type || 'standard'
    };

    switch (template.type) {
      case 'pre_wedding':
        scheduledDate = addDays(primaryEventDate, template.defaultDays);
        // Only create if wedding is in the future and reminder hasn't passed
        if (primaryEventDate > now && scheduledDate > now) {
          reminders.push({
            contact_email: contact.email,
            contact_name: contact.name,
            reminder_type: template.type,
            scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
            channel: 'email',
            priority: 'high',
            event_context: eventContext
          });
        }
        break;

      case 'post_wedding':
        scheduledDate = addDays(primaryEventDate, template.defaultDays);
        // Only create if wedding is recent (within 30 days) and reminder is due
        if (daysSinceEvent >= 0 && daysSinceEvent <= 30) {
          reminders.push({
            contact_email: contact.email,
            contact_name: contact.name,
            reminder_type: template.type,
            scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
            channel: 'email',
            priority: 'medium',
            event_context: eventContext
          });
        }
        break;

      case 'anniversary':
        // Create anniversary reminders for the next few years
        for (let year = 1; year <= 3; year++) {
          scheduledDate = addYears(primaryEventDate, year);
          if (scheduledDate > now) {
            reminders.push({
              contact_email: contact.email,
              contact_name: contact.name,
              reminder_type: template.type,
              scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
              channel: 'email',
              priority: 'medium',
              event_context: {
                ...eventContext,
                years_married: year
              }
            });
          }
        }
        break;

      case 'business_development':
        scheduledDate = addDays(primaryEventDate, template.defaultDays);
        if (scheduledDate > now) {
          reminders.push({
            contact_email: contact.email,
            contact_name: contact.name,
            reminder_type: template.type,
            scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
            channel: 'email',
            priority: 'low',
            event_context: eventContext
          });
        }
        break;
    }
  });

  return reminders;
};

export const generatePersonalizedMessage = (reminder: Reminder, template: ReminderTemplate): string => {
  let prompt = template.chatGPTPrompt;

  // Replace variables in the prompt with actual values
  if (reminder.event_context) {
    Object.entries(reminder.event_context).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });
  }

  // Replace contact-specific variables
  prompt = prompt.replace(/\{couple_name\}/g, reminder.contact_name);
  prompt = prompt.replace(/\{contact_name\}/g, reminder.contact_name);

  return prompt;
};

export const getReminderTemplate = (type: Reminder['reminder_type']): ReminderTemplate | undefined => {
  return REMINDER_TEMPLATES.find(template => template.type === type);
};

export const filterReminders = (
  reminders: Reminder[],
  filters: Partial<{
    status: string;
    type: string;
    priority: string;
    search: string;
    dateRange: { start?: string; end?: string };
  }>
): Reminder[] => {
  return reminders.filter(reminder => {
    // Status filter
    if (filters.status && filters.status !== 'all' && reminder.status !== filters.status) {
      return false;
    }

    // Type filter
    if (filters.type && filters.type !== 'all' && reminder.reminder_type !== filters.type) {
      return false;
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all' && reminder.priority !== filters.priority) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchMatch = 
        (reminder.contact_name || '').toLowerCase().includes(searchLower) ||
        (reminder.contact_email || '').toLowerCase().includes(searchLower) ||
        reminder.notes?.toLowerCase().includes(searchLower);
      
      if (!searchMatch) return false;
    }

    // Date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      const reminderDate = parseLocalDate(reminder.scheduled_date);

      if (filters.dateRange.start && reminderDate < parseLocalDate(filters.dateRange.start)) {
        return false;
      }

      if (filters.dateRange.end && reminderDate > parseLocalDate(filters.dateRange.end)) {
        return false;
      }
    }

    return true;
  });
};
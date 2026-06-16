import { EventNotification } from '@/types/notification';
import { Contact } from '@/types/contact';
import { parseLocalDate } from '@/utils/dateHelpers';

export interface TagCategory {
  name: string;
  color: string;
  icon: string;
  tags: string[];
}

export const TAG_CATEGORIES: TagCategory[] = [
  {
    name: 'Event Types',
    color: 'rose',
    icon: 'Heart',
    tags: ['wedding', 'birthday', 'quince', 'banquet']
  },
  {
    name: 'Package Types',
    color: 'warning',
    icon: 'Package',
    tags: ['platinum', 'diamond', 'gold', 'silver', 'bronze', 'ceremony only']
  },
  {
    name: 'Services',
    color: 'success',
    icon: 'Users',
    tags: ['has_coordinator', 'has_vendor', 'file_uploaded', 'full_service']
  },
  {
    name: 'Venue Types',
    color: 'venue',
    icon: 'MapPin',
    tags: ['indoor', 'outdoor', 'garden', 'hall', 'church', 'beach']
  },
  {
    name: 'Status',
    color: 'info',
    icon: 'Calendar',
    tags: ['upcoming', 'in_progress', 'completed', 'cancelled']
  },
  {
    name: 'Special',
    color: 'purple',
    icon: 'Sparkles',
    tags: ['vip', 'repeat_client', 'referral', 'premium_venue']
  }
];

export const generateEnhancedContactTags = (notification: EventNotification, contact?: Contact): string[] => {
  const tags: string[] = [];
  
  // Event type tag (always include)
  tags.push(notification.event_type);
  
  // Package type with better naming
  if (notification.package_type) {
    const packageTag = normalizePackageType(notification.package_type);
    tags.push(packageTag);
  }
  
  // Service tags with better names
  if (notification.coordinator_name) {
    tags.push('has_coordinator');
  }
  
  if (notification.dj_name) {
    tags.push('has_vendor');
  }
  
  if (notification.file_uploaded) {
    tags.push('file_uploaded');
  }
  
  // Venue-based tags
  if (notification.venue) {
    const venueTag = generateVenueTag(notification.venue);
    if (venueTag) tags.push(venueTag);
  }
  
  // Event date-based tags
  const eventDate = parseLocalDate(notification.event_date);
  const now = new Date();
  const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 0) {
    tags.push('upcoming');
    if (daysDiff <= 7) tags.push('this_week');
    if (daysDiff <= 30) tags.push('this_month');
  } else {
    tags.push('past_event');
  }
  
  // Guest count-based tags (if available in metadata)
  const guestCount = notification.additional_metadata?.guest_count;
  if (guestCount && typeof guestCount === 'number') {
    if (guestCount >= 200) tags.push('large_event');
    else if (guestCount >= 100) tags.push('medium_event');
    else tags.push('intimate_event');
  }
  
  // Contact-based tags (if contact history is available)
  if (contact) {
    if (contact.totalEvents > 1) tags.push('repeat_client');
    if (contact.totalEvents >= 3) tags.push('vip');
  }
  
  // Season-based tags
  const month = eventDate.getMonth();
  if ([11, 0, 1].includes(month)) tags.push('winter');
  else if ([2, 3, 4].includes(month)) tags.push('spring');
  else if ([5, 6, 7].includes(month)) tags.push('summer');
  else tags.push('fall');
  
  return [...new Set(tags)]; // Remove duplicates
};

export const normalizePackageType = (packageType: string): string => {
  const normalized = packageType.toLowerCase().trim();
  
  if (normalized.includes('ceremony') && normalized.includes('only')) {
    return 'ceremony_only';
  }
  
  return normalized.replace(/\s+/g, '_');
};

export const generateVenueTag = (venue: string): string | null => {
  const venueLower = venue.toLowerCase();
  
  if (venueLower.includes('garden') || venueLower.includes('outdoor')) return 'garden';
  if (venueLower.includes('hall') || venueLower.includes('ballroom')) return 'hall';
  if (venueLower.includes('church') || venueLower.includes('chapel')) return 'church';
  if (venueLower.includes('beach') || venueLower.includes('waterfront')) return 'beach';
  if (venueLower.includes('hotel') || venueLower.includes('resort')) return 'hotel';
  if (venueLower.includes('club') || venueLower.includes('country')) return 'country_club';
  
  return null;
};

export const getTagDisplayName = (tag: string): string => {
  const displayNames: Record<string, string> = {
    'has_coordinator': 'Coordinator',
    'has_vendor': 'Vendor Service',
    'has_dj': 'Vendor Service',
    'file_uploaded': 'Documents',
    'ceremony_only': 'Ceremony Only',
    'ceremony-only': 'Ceremony Only',
    'ceremony-w-patio': 'Ceremony W/ Patio',
    'repeat_client': 'Repeat Client',
    'large_event': 'Large Event',
    'medium_event': 'Medium Event',
    'intimate_event': 'Intimate Event',
    'this_week': 'This Week',
    'this_month': 'This Month',
    'past_event': 'Past Event',
    'country_club': 'Country Club',
    'vip': 'VIP Client',
    'event_notification': 'Event Notification',
    'form_submission': 'Form Submission',
    'wedding': 'Wedding Record'
  };
  
  return displayNames[tag] || tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const filterTagsByCategory = (tags: string[], category: string): string[] => {
  const categoryConfig = TAG_CATEGORIES.find(cat => cat.name.toLowerCase() === category.toLowerCase());
  if (!categoryConfig) return tags;
  
  return tags.filter(tag => categoryConfig.tags.includes(tag.toLowerCase()));
};

export const getPopularTags = (contacts: Contact[], limit: number = 10): Array<{tag: string, count: number}> => {
  const tagCounts = new Map<string, number>();
  
  contacts.forEach(contact => {
    contact.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const suggestTagsForContact = (contact: Contact, allContacts: Contact[]): string[] => {
  // Suggest tags based on similar contacts
  const similarContacts = allContacts.filter(c => 
    c.id !== contact.id && 
    c.eventTypes.some(type => contact.eventTypes.includes(type))
  );
  
  const similarTags = new Map<string, number>();
  similarContacts.forEach(c => {
    c.tags.forEach(tag => {
      if (!contact.tags.includes(tag)) {
        similarTags.set(tag, (similarTags.get(tag) || 0) + 1);
      }
    });
  });
  
  // Return top 3 suggestions
  return Array.from(similarTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
};
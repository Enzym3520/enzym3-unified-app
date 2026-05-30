/**
 * Notification helpers — thin wrappers that work standalone (hardcoded fallback)
 * but components should prefer `useEventTypes()` from useAppConfig for DB-backed values.
 */

const STATIC_EVENT_TYPES: Record<string, { label: string; emoji: string; formLabel: string; contactLabel: string }> = {
  wedding:    { label: 'Wedding',           emoji: '💒', formLabel: 'Couple Names',      contactLabel: 'Couple Names' },
  quince:     { label: 'Quinceañera',       emoji: '👑', formLabel: 'Quinceañera Name',  contactLabel: 'Quinceañera Name' },
  birthday:   { label: 'Birthday',          emoji: '🎂', formLabel: 'Honoree Name',      contactLabel: 'Honoree Name' },
  banquet:    { label: 'Banquet',           emoji: '🍽️', formLabel: 'Event Name',        contactLabel: 'Event Name' },
  graduation: { label: 'Graduation Party',  emoji: '🎓', formLabel: 'Graduate Name',     contactLabel: 'Graduate Name' },
  sweet16:    { label: 'Sweet 16',          emoji: '🎀', formLabel: 'Honoree Name',      contactLabel: 'Honoree Name' },
};

const STATIC_CALENDAR_COLORS: Record<string, string> = {
  wedding: 'pink-500',
  quince: 'purple-500',
  birthday: 'blue-500',
  banquet: 'amber-500',
  graduation: 'emerald-500',
  sweet16: 'rose-500',
};

function lookup(eventType: string) {
  return STATIC_EVENT_TYPES[eventType?.toLowerCase()] ?? null;
}

/** Format event type for display */
export const formatEventType = (eventType: string): string => {
  if (!eventType) return '';
  const found = lookup(eventType);
  if (found) return found.label;
  return eventType.replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

/** Get emoji icon for event type */
export const getEventTypeIcon = (eventType: string): string => {
  if (!eventType) return '🎉';
  return lookup(eventType)?.emoji ?? '🎉';
};

/** Get display name for event type */
export const getEventDisplayName = (eventType: string, _coupleName?: string): string => {
  if (!eventType) return 'Event Name';
  return lookup(eventType)?.contactLabel ?? 'Event Name';
};

/** Format display name for form labels */
export const getFormDisplayName = (eventType: string): string => {
  if (!eventType) return 'Event Name';
  return lookup(eventType)?.formLabel ?? 'Event Name';
};

/** Get calendar color class for event type (Tailwind color token without `bg-` prefix) */
export const getEventCalendarColor = (eventType: string): string => {
  if (!eventType) return 'primary';
  return STATIC_CALENDAR_COLORS[eventType.toLowerCase()] ?? 'primary';
};

/** Build Tailwind color classes from a calendar_color value like 'pink-500' */
export const buildCalendarColorClasses = (color: string) => {
  if (!color || color === 'primary') {
    return { bg: 'bg-primary', text: 'text-primary-foreground', hover: 'hover:bg-primary/90' };
  }
  return {
    bg: `bg-${color}`,
    text: 'text-white',
    hover: `hover:bg-${color.replace('-500', '-600')}`,
  };
};

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

/**
 * Build Tailwind color classes from a calendar_color value like 'pink-500'.
 *
 * IMPORTANT: classes must be complete LITERAL strings — Tailwind's compiler does
 * not generate CSS for runtime-built names like `bg-${color}`, which left chips
 * with no background (white text on the page background = invisible). Each entry
 * is a tinted background + colored text with a `dark:` variant so chips read in
 * both light and dark mode. Mirrors the pattern in vendorHelpers.ts.
 */
export const buildCalendarColorClasses = (color: string) => {
  const map: Record<string, { bg: string; text: string; hover: string }> = {
    pink:    { bg: 'bg-pink-500/20',    text: 'text-pink-700 dark:text-pink-300',       hover: 'hover:bg-pink-500/30' },
    purple:  { bg: 'bg-purple-500/20',  text: 'text-purple-700 dark:text-purple-300',   hover: 'hover:bg-purple-500/30' },
    blue:    { bg: 'bg-blue-500/20',    text: 'text-blue-700 dark:text-blue-300',       hover: 'hover:bg-blue-500/30' },
    amber:   { bg: 'bg-amber-500/20',   text: 'text-amber-700 dark:text-amber-300',     hover: 'hover:bg-amber-500/30' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', hover: 'hover:bg-emerald-500/30' },
    rose:    { bg: 'bg-rose-500/20',    text: 'text-rose-700 dark:text-rose-300',       hover: 'hover:bg-rose-500/30' },
    primary: { bg: 'bg-primary/20',     text: 'text-primary',                           hover: 'hover:bg-primary/30' },
  };
  if (!color) return map.primary;
  const base = color.replace(/-\d+$/, ''); // 'pink-500' -> 'pink'
  return map[base] ?? map.primary;
};

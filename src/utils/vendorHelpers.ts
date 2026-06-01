const ACRONYMS: Record<string, string> = { dj: 'DJ', mc: 'MC' };

export function formatVendorType(type: string | null | undefined): string {
  if (!type) return 'Vendor';
  return type
    .split('_')
    .map(w => ACRONYMS[w.toLowerCase()] || w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const EVENT_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  quinceanera: 'Quinceañera',
  sweet_16: 'Sweet 16',
  birthday: 'Birthday',
  corporate: 'Corporate',
  graduation: 'Graduation',
  banquet: 'Banquet',
};

export function formatEventType(type: string | null | undefined): string {
  if (!type) return 'Event';
  return EVENT_LABELS[type.toLowerCase()] || formatVendorType(type);
}

export function capitalizeNames(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: '💒',
  quinceanera: '👑',
  birthday: '🎂',
  corporate: '🏢',
  banquet: '🍽️',
};

export function getEventTypeIcon(eventType: string): string {
  const lower = eventType.toLowerCase();
  for (const [key, icon] of Object.entries(EVENT_TYPE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '🎉';
}

export function getEventCalendarColor(eventType: string): string {
  const lower = eventType.toLowerCase();
  if (lower.includes('wedding')) return 'pink';
  if (lower.includes('quince')) return 'purple';
  if (lower.includes('birthday')) return 'blue';
  if (lower.includes('corporate') || lower.includes('banquet')) return 'slate';
  return 'primary';
}

export function buildCalendarColorClasses(color: string) {
  const map: Record<string, { bg: string; text: string; hover: string }> = {
    pink: { bg: 'bg-pink-500/20', text: 'text-pink-700 dark:text-pink-300', hover: 'hover:bg-pink-500/30' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', hover: 'hover:bg-purple-500/30' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', hover: 'hover:bg-blue-500/30' },
    slate: { bg: 'bg-slate-500/20', text: 'text-slate-700 dark:text-slate-300', hover: 'hover:bg-slate-500/30' },
    primary: { bg: 'bg-primary/20', text: 'text-primary', hover: 'hover:bg-primary/30' },
  };
  return map[color] || map.primary;
}

/**
 * Parse an event date string from the DB (which is a DATE type returned as
 * 'YYYY-MM-DD') as a *local* calendar date. Using `new Date('2026-06-06')`
 * parses as UTC midnight and shifts back a day in west-of-UTC timezones.
 */
export function parseEventDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoDateOnly) {
    const [, y, m, d] = isoDateOnly;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(value);
}

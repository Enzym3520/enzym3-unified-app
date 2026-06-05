import { format, isValid, parseISO } from 'date-fns';

/**
 * Parse a date string as local midnight when it's a date-only string (YYYY-MM-DD).
 * Prevents the common timezone bug where `new Date("2026-06-05")` is interpreted
 * as UTC midnight, which shifts back a day in western-hemisphere timezones.
 */
export function parseLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  // Date-only string like "2026-06-05" → local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(y, m - 1, d);
  }
  return new Date(date); // ISO timestamps with time component are fine
}

/**
 * Safely format a date string or Date object
 * Returns formatted string or fallback if date is invalid
 */
export function safeFormatDate(
  date: string | Date | null | undefined,
  formatStr: string,
  fallback: string = 'Invalid date'
): string {
  if (!date) {
    return fallback;
  }

  try {
    const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
    
    if (!isValid(dateObj)) {
      return fallback;
    }

    return format(dateObj, formatStr);
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error formatting date:', error);
    return fallback;
  }
}

/**
 * Check if a date string or Date object is valid
 */
export function isValidDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
    return isValid(dateObj);
  } catch {
    return false;
  }
}

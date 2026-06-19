/**
 * Format a Date as 'yyyy-MM-dd' using its LOCAL calendar components.
 * Avoids the date-fns `format` / toISOString off-by-one where a UTC-derived
 * Date renders the previous day in negative-offset timezones (e.g. Arizona).
 * If given a 'yyyy-MM-dd' string, returns it unchanged.
 */
export function toLocalDateString(value: Date | string): string {
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : value;
  }
  const y = value.getFullYear();
  const mo = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

import { format, isToday, isYesterday, differenceInMinutes, formatDistanceToNowStrict } from 'date-fns';

/**
 * Returns "Today", "Yesterday", or "MMM d, yyyy" for date separator labels
 */
export function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

/**
 * Check if two messages should be grouped (same sender, within 2 minutes)
 */
export function shouldGroupWithPrevious(
  currentSenderId: string,
  currentTime: string,
  prevSenderId: string | undefined,
  prevTime: string | undefined
): boolean {
  if (!prevSenderId || !prevTime) return false;
  if (currentSenderId !== prevSenderId) return false;
  return Math.abs(differenceInMinutes(new Date(currentTime), new Date(prevTime))) < 2;
}

/**
 * Check if a date separator should be shown between two messages
 */
export function shouldShowDateSeparator(
  currentTime: string,
  prevTime: string | undefined
): boolean {
  if (!prevTime) return true;
  const curr = new Date(currentTime);
  const prev = new Date(prevTime);
  return curr.toDateString() !== prev.toDateString();
}

/**
 * Format a relative timestamp for thread lists: "2m", "1h", "3d"
 */
export function relativeTime(dateStr: string): string {
  try {
    return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false })
      .replace(' seconds', 's')
      .replace(' second', 's')
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' hours', 'h')
      .replace(' hour', 'h')
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(' months', 'mo')
      .replace(' month', 'mo')
      .replace(' years', 'y')
      .replace(' year', 'y');
  } catch {
    return '';
  }
}

/**
 * Get initials from a name string
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

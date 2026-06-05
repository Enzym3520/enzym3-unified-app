/**
 * Centralized event time accessors that survive the legacy column drift:
 *   - canonical column: event_notification_history.start_time / end_time
 *   - alias some surfaces use: event_start_time / event_end_time
 *   - submitted form payload: additional_metadata.form_data.eventStartTime / eventEndTime
 */
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const pick = (...candidates: any[]): string | null => {
  for (const c of candidates) {
    if (c == null) continue;
    const v = String(c).trim();
    if (v && TIME_RE.test(v)) return v;
  }
  return null;
};

export const getEventStartTime = (event: any): string | null => {
  if (!event) return null;
  const fd = event?.additional_metadata?.form_data || {};
  return pick(event.start_time, event.event_start_time, fd.eventStartTime);
};

export const getEventEndTime = (event: any): string | null => {
  if (!event) return null;
  const fd = event?.additional_metadata?.form_data || {};
  return pick(event.end_time, event.event_end_time, fd.eventEndTime);
};

/** Format "HH:MM" or "HH:MM:SS" as "h:mm a". Returns null if invalid. */
export const formatEventTime = (value: string | null | undefined): string | null => {
  if (!value || !TIME_RE.test(value)) return null;
  const [hStr, mStr] = value.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return null;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
};

/** Convenience: read + format start time directly from an event row. */
export const getFormattedStartTime = (event: any): string | null =>
  formatEventTime(getEventStartTime(event));

export const getFormattedEndTime = (event: any): string | null =>
  formatEventTime(getEventEndTime(event));

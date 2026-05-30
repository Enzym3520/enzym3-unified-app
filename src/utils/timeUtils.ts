// Time utility functions for 12-hour to 24-hour conversion and validation

export interface Time12Hour {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

/**
 * Convert 24-hour time string (HH:mm) to 12-hour format
 */
export function convert24HourTo12Hour(time24: string): Time12Hour {
  if (!time24) {
    return { hour: '12', minute: '00', period: 'AM' };
  }

  const [hourStr, minuteStr] = time24.split(':');
  const hour24 = parseInt(hourStr, 10);
  const minute = minuteStr || '00';

  let hour12: number;
  let period: 'AM' | 'PM';

  if (hour24 === 0) {
    hour12 = 12;
    period = 'AM';
  } else if (hour24 < 12) {
    hour12 = hour24;
    period = 'AM';
  } else if (hour24 === 12) {
    hour12 = 12;
    period = 'PM';
  } else {
    hour12 = hour24 - 12;
    period = 'PM';
  }

  return {
    hour: hour12.toString(),
    minute,
    period,
  };
}

/**
 * Convert 12-hour format to 24-hour time string (HH:mm)
 */
export function convert12HourTo24Hour(time12: Time12Hour): string {
  const { hour, minute, period } = time12;
  
  if (!hour || !minute) {
    return '';
  }

  let hour24 = parseInt(hour, 10);

  if (period === 'AM') {
    if (hour24 === 12) {
      hour24 = 0;
    }
  } else { // PM
    if (hour24 !== 12) {
      hour24 += 12;
    }
  }

  return `${hour24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

/**
 * Validate 12-hour time format
 */
export function validateTime12Hour(time12: Time12Hour): boolean {
  const { hour, minute, period } = time12;

  if (!hour || !minute || !period) {
    return false;
  }

  const hourNum = parseInt(hour, 10);
  const minuteNum = parseInt(minute, 10);

  if (isNaN(hourNum) || isNaN(minuteNum)) {
    return false;
  }

  if (hourNum < 1 || hourNum > 12) {
    return false;
  }

  if (minuteNum < 0 || minuteNum > 59) {
    return false;
  }

  if (period !== 'AM' && period !== 'PM') {
    return false;
  }

  return true;
}

/**
 * Format 12-hour time for display
 */
export function formatTime12Hour(time12: Time12Hour): string {
  const { hour, minute, period } = time12;
  return `${hour}:${minute.padStart(2, '0')} ${period}`;
}

/**
 * Generate hour options for 12-hour format
 */
export function getHourOptions(): string[] {
  return Array.from({ length: 12 }, (_, i) => (i + 1).toString());
}

/**
 * Generate minute options (00, 15, 30, 45)
 */
export function getMinuteOptions(): string[] {
  return ['00', '15', '30', '45'];
}

/**
 * Generate all minute options (00-59)
 */
export function getAllMinuteOptions(): string[] {
  return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
}
import { describe, it, expect } from 'vitest';
import {
  formatVendorType,
  formatEventType,
  capitalizeNames,
  getEventTypeIcon,
  getEventCalendarColor,
  parseEventDate,
} from './vendorHelpers';

describe('formatVendorType', () => {
  it('uppercases known acronyms and title-cases the rest', () => {
    expect(formatVendorType('dj')).toBe('DJ');
    expect(formatVendorType('mc')).toBe('MC');
    expect(formatVendorType('photo_booth')).toBe('Photo Booth');
  });
  it('falls back to "Vendor" for empty input', () => {
    expect(formatVendorType(null)).toBe('Vendor');
    expect(formatVendorType(undefined)).toBe('Vendor');
  });
});

describe('formatEventType', () => {
  it('maps known types (case-insensitive) and falls back gracefully', () => {
    expect(formatEventType('wedding')).toBe('Wedding');
    expect(formatEventType('SWEET_16')).toBe('Sweet 16');
    expect(formatEventType('quinceanera')).toBe('Quinceañera');
    expect(formatEventType('unknown_type')).toBe('Unknown Type'); // via formatVendorType
    expect(formatEventType(null)).toBe('Event');
  });
});

describe('capitalizeNames', () => {
  it('title-cases each word and tolerates empty', () => {
    expect(capitalizeNames('jOHN dOE')).toBe('John Doe');
    expect(capitalizeNames('')).toBe('');
    expect(capitalizeNames(null)).toBe('');
  });
});

describe('getEventTypeIcon / getEventCalendarColor', () => {
  it('matches on substring, with sensible defaults', () => {
    expect(getEventTypeIcon('Beach Wedding')).toBe('💒');
    expect(getEventTypeIcon('mystery party')).toBe('🎉');
    expect(getEventCalendarColor('Quinceañera')).toBe('purple');
    expect(getEventCalendarColor('something else')).toBe('primary');
  });
});

describe('parseEventDate (timezone-safe — regression)', () => {
  it('parses a YYYY-MM-DD string as a LOCAL calendar date (no UTC day shift)', () => {
    const d = parseEventDate('2026-06-06');
    // Must be June 6 2026 in local time regardless of the runner's timezone.
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June (0-indexed)
    expect(d.getDate()).toBe(6);
  });
  it('passes through Date instances unchanged', () => {
    const orig = new Date(2026, 0, 15);
    expect(parseEventDate(orig)).toBe(orig);
  });
  it('returns an invalid date for empty input', () => {
    expect(Number.isNaN(parseEventDate(null).getTime())).toBe(true);
  });
});

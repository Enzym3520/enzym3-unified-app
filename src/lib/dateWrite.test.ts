import { describe, it, expect } from 'vitest';
import { toLocalDateString } from './dateWrite';

describe('toLocalDateString', () => {
  it('returns the picked calendar day for a local-midnight date', () => {
    const d = new Date(2026, 7, 1); // Aug 1 2026 local
    expect(toLocalDateString(d)).toBe('2026-08-01');
  });

  it('does not roll back a date built at local midnight', () => {
    const d = new Date(2026, 11, 31); // Dec 31 2026 local
    expect(toLocalDateString(d)).toBe('2026-12-31');
  });

  it('accepts a yyyy-MM-dd string and returns it unchanged', () => {
    expect(toLocalDateString('2026-08-01')).toBe('2026-08-01');
  });
});

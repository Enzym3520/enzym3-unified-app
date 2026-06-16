import { describe, it, expect } from 'vitest';
import {
  validateFieldLength,
  validateEmail,
  validatePhone,
  validateEventDate,
  validateSafeString,
  validateFormByEventType,
  MAX_LENGTHS,
} from './formValidation';
import type { FormData } from '@/types/eventForm';

describe('validateFieldLength', () => {
  it('accepts strings within the limit and rejects over it', () => {
    expect(validateFieldLength('abc', 3)).toBe(true);
    expect(validateFieldLength('abcd', 3)).toBe(false);
    expect(validateFieldLength('', 0)).toBe(true);
  });
});

describe('validateEmail', () => {
  it('accepts a normal email', () => {
    expect(validateEmail('jj@enzym3.com').valid).toBe(true);
  });
  it('rejects empty and malformed', () => {
    expect(validateEmail('').valid).toBe(false);
    expect(validateEmail('not-an-email').valid).toBe(false);
    expect(validateEmail('a@b').valid).toBe(false);
  });
  it('rejects injection / suspicious patterns', () => {
    expect(validateEmail('a<script>@b.com').valid).toBe(false);
    expect(validateEmail('java script@b.com').valid).toBe(false); // space => format fail
    expect(validateEmail('a..b@c.com').valid).toBe(false); // consecutive dots
  });
});

describe('validatePhone', () => {
  it('accepts common formats', () => {
    expect(validatePhone('(520) 555-1234').valid).toBe(true);
    expect(validatePhone('+1 520 555 1234').valid).toBe(true);
  });
  it('rejects letters and bad lengths', () => {
    expect(validatePhone('call-me').valid).toBe(false);
    expect(validatePhone('123').valid).toBe(false); // too short
    expect(validatePhone('').valid).toBe(false);
  });
});

describe('validateEventDate', () => {
  const offsetYears = (years: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d;
  };
  it('accepts a date within the next 3 years', () => {
    expect(validateEventDate(offsetYears(1)).valid).toBe(true);
  });
  it('rejects dates more than ~1 year in the past', () => {
    expect(validateEventDate(offsetYears(-2)).valid).toBe(false);
  });
  it('rejects dates more than ~3 years out', () => {
    expect(validateEventDate(offsetYears(5)).valid).toBe(false);
  });
});

describe('validateSafeString (XSS guard)', () => {
  it('flags script/handler/iframe injection', () => {
    expect(validateSafeString('<script>alert(1)</script>', 'notes').valid).toBe(false);
    expect(validateSafeString('<img onerror=alert(1)>', 'notes').valid).toBe(false);
    expect(validateSafeString('javascript:alert(1)', 'notes').valid).toBe(false);
    expect(validateSafeString('<iframe src=evil>', 'notes').valid).toBe(false);
  });
  it('allows ordinary text', () => {
    expect(validateSafeString('First dance: at 7pm, near the garden!', 'notes').valid).toBe(true);
  });
});

describe('validateFormByEventType', () => {
  const make = (over: Partial<FormData>): FormData => over as FormData;

  it('wedding requires both names, both phones, and at least one email', () => {
    const missingEmail = validateFormByEventType(
      make({ eventType: 'wedding', brideName: 'A', groomName: 'B', bridePhone: '5205551234', groomPhone: '5205550000' }),
    );
    expect(missingEmail.isValid).toBe(false);
    expect(missingEmail.missingFields.join(' ')).toMatch(/email/i);

    const ok = validateFormByEventType(
      make({ eventType: 'wedding', brideName: 'A', groomName: 'B', bridePhone: '5205551234', groomPhone: '5205550000', brideEmail: 'a@b.com' }),
    );
    expect(ok.isValid).toBe(true);
  });

  it('reports each missing required field for a quince', () => {
    const res = validateFormByEventType(make({ eventType: 'quince' }));
    expect(res.isValid).toBe(false);
    expect(res.missingFields).toEqual(
      expect.arrayContaining(['quinceaneraName', 'parentName', 'parentPhone', 'parentEmail']),
    );
  });

  it('birthday and sweet16 share the same required set', () => {
    const fields = { honoreeName: 'H', parentName: 'P', parentPhone: '5205551234', parentEmail: 'p@x.com' };
    expect(validateFormByEventType(make({ eventType: 'birthday', ...fields })).isValid).toBe(true);
    expect(validateFormByEventType(make({ eventType: 'sweet16', ...fields })).isValid).toBe(true);
  });

  it('flags an over-length field as invalid', () => {
    const res = validateFormByEventType(
      make({
        eventType: 'banquet',
        contactName: 'N',
        contactPhone: '5205551234',
        contactEmail: 'n@x.com',
        notes: 'x'.repeat(MAX_LENGTHS.notes + 1),
      }),
    );
    expect(res.isValid).toBe(false);
    expect(res.missingFields.join(' ')).toMatch(/exceeds maximum length/);
  });

  it('unknown event type has no required fields (valid by default)', () => {
    expect(validateFormByEventType(make({ eventType: 'other' as any })).isValid).toBe(true);
  });
});

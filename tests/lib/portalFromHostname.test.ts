import { describe, it, expect } from 'vitest';
import { portalFromHostname } from '@/lib/portalFromHostname';
describe('portalFromHostname', () => {
  it('returns client for plan domain', () => expect(portalFromHostname('plan.enzym3entertainment.vip')).toBe('client'));
  it('returns staff for coordination domain', () => expect(portalFromHostname('coordination.enzymentertainment.vip')).toBe('staff'));
  it('returns vendor for vendor domain', () => expect(portalFromHostname('vendor.enzym3entertainment.vip')).toBe('vendor'));
  it('returns null for localhost', () => expect(portalFromHostname('localhost')).toBeNull());
  it('returns null for unknown', () => expect(portalFromHostname('unknown.com')).toBeNull());
});

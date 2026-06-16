import { describe, it, expect } from 'vitest';
import { portalFromHostname } from '@/lib/portalFromHostname';

// The unified app routes every portal by user role (RequireRole in App.tsx),
// NOT by hostname/subdomain. portalFromHostname is intentionally a no-op that
// always returns null; these tests lock in that contract so it isn't silently
// "fixed" back into hostname-based routing. (The old multi-domain assertions
// here were stale and failing against the current architecture.)
describe('portalFromHostname', () => {
  it('returns null for the plan domain (role-based routing)', () =>
    expect(portalFromHostname('plan.enzym3entertainment.vip')).toBeNull());
  it('returns null for the coordination domain (role-based routing)', () =>
    expect(portalFromHostname('coordination.enzymentertainment.vip')).toBeNull());
  it('returns null for the vendor domain (role-based routing)', () =>
    expect(portalFromHostname('vendor.enzym3entertainment.vip')).toBeNull());
  it('returns null for localhost', () => expect(portalFromHostname('localhost')).toBeNull());
  it('returns null for unknown', () => expect(portalFromHostname('unknown.com')).toBeNull());
});

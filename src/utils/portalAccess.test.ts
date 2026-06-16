import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => ({
  state: { queues: {} as Record<string, Array<{ data: any; error?: any }>> },
}));

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (table: string) => {
    const terminal = () => {
      const q = h.state.queues[table] || [];
      return Promise.resolve(q.length ? q.shift()! : { data: null, error: null });
    };
    const chain: any = {};
    for (const m of ['select', 'or', 'eq', 'not', 'order', 'limit', 'in', 'gte', 'lte', 'neq', 'contains']) {
      chain[m] = () => chain;
    }
    chain.maybeSingle = terminal;
    chain.single = terminal;
    chain.then = (res: any, rej: any) => terminal().then(res, rej);
    return chain;
  };
  return { supabase: { from: (t: string) => makeChain(t) } };
});

import { isPortalUser, isVendorOnlyUser } from './portalAccess';

// profile = maybeSingle result; roles = the array returned by the user_roles query.
const setUser = (
  profile: { role: string | null; vendor_type: string | null } | null,
  roles: string[],
) => {
  h.state.queues = {
    profiles: [{ data: profile, error: null }],
    user_roles: [{ data: roles.map((role) => ({ role })), error: null }],
  };
};

describe('isPortalUser (coordination portal access)', () => {
  beforeEach(() => {
    h.state.queues = {};
  });

  it('allows staff roles', async () => {
    setUser({ role: null, vendor_type: null }, ['admin']);
    expect(await isPortalUser('u1')).toBe(true);
  });
  it('allows coordinators', async () => {
    setUser({ role: 'coordinator', vendor_type: null }, []);
    expect(await isPortalUser('u1')).toBe(true);
  });
  it('allows vendors (have a vendor_type)', async () => {
    setUser({ role: 'vendor', vendor_type: 'dj' }, []);
    expect(await isPortalUser('u1')).toBe(true);
  });
  it('denies a plain client', async () => {
    setUser({ role: 'client', vendor_type: null }, []);
    expect(await isPortalUser('u1')).toBe(false);
  });
  it('denies when the profile is missing', async () => {
    setUser(null, []);
    expect(await isPortalUser('u1')).toBe(false);
  });
});

describe('isVendorOnlyUser (redirect to standalone vendor app)', () => {
  beforeEach(() => {
    h.state.queues = {};
  });

  it('true for a vendor with no staff/coordinator role', async () => {
    setUser({ role: 'vendor', vendor_type: 'dj' }, []);
    expect(await isVendorOnlyUser('u1')).toBe(true);
  });
  it('false for a vendor who is also an admin', async () => {
    setUser({ role: 'vendor', vendor_type: 'dj' }, ['admin']);
    expect(await isVendorOnlyUser('u1')).toBe(false);
  });
  it('false for a vendor who is also a coordinator', async () => {
    setUser({ role: 'coordinator', vendor_type: 'dj' }, []);
    expect(await isVendorOnlyUser('u1')).toBe(false);
  });
  it('false for a non-vendor client', async () => {
    setUser({ role: 'client', vendor_type: null }, []);
    expect(await isVendorOnlyUser('u1')).toBe(false);
  });
});

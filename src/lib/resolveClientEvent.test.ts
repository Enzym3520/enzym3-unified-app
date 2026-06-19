import { describe, it, expect, beforeEach, vi } from 'vitest';

// Shared mutable query-result state, hoisted so the vi.mock factory can read it.
const h = vi.hoisted(() => ({
  state: { queues: {} as Record<string, Array<{ data: any; error?: any }>> },
}));

// Minimal chainable Supabase mock: every filter method returns the chain; the
// terminal calls (maybeSingle/await) shift the next queued result for that table.
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
  return {
    supabase: {
      from: (t: string) => makeChain(t),
      rpc: () => {
        const q = h.state.queues['rpc'] || [];
        return Promise.resolve(q.length ? q.shift()! : { data: null, error: null });
      },
    },
  };
});

import { resolveClientEvent } from './resolveClientEvent';

const setQueues = (q: Record<string, Array<{ data: any; error?: any }>>) => {
  h.state.queues = q;
};

describe('resolveClientEvent — 3-step fallback', () => {
  beforeEach(() => {
    h.state.queues = {};
  });

  it('step 1: resolves via couple_codes for partner-invited users', async () => {
    setQueues({
      couple_codes: [{ data: { wedding_id: 'w1' }, error: null }],
      event_notification_history: [{ data: { id: 'w1', couple_name: 'A & B' }, error: null }],
    });
    const r = await resolveClientEvent('u1', 'A@B.com', 'id, couple_name');
    expect(r).toEqual({ id: 'w1', couple_name: 'A & B' });
  });

  it('step 2: falls through to direct email match on event_notification_history', async () => {
    setQueues({
      couple_codes: [{ data: null, error: null }],
      event_notification_history: [{ data: { id: 'w2' }, error: null }],
    });
    const r = await resolveClientEvent('u1', 'a@b.com', 'id');
    expect(r).toEqual({ id: 'w2' });
  });

  it('step 3: falls through to vendor_client_assignments', async () => {
    setQueues({
      couple_codes: [{ data: null, error: null }],
      event_notification_history: [
        { data: null, error: null }, // step 2 email miss
        { data: { id: 'e3' }, error: null }, // step 3 by-id lookup
      ],
      vendor_client_assignments: [{ data: { event_id: 'e3' }, error: null }],
    });
    const r = await resolveClientEvent('u1', 'a@b.com', 'id');
    expect(r).toEqual({ id: 'e3' });
  });

  it('returns null when no source matches', async () => {
    setQueues({
      couple_codes: [{ data: null, error: null }],
      event_notification_history: [{ data: null, error: null }, { data: null, error: null }],
      vendor_client_assignments: [{ data: null, error: null }],
    });
    const r = await resolveClientEvent('u1', 'a@b.com', 'id');
    expect(r).toBeNull();
  });

  it('a couple_code with a stale wedding_id still falls through to email match', async () => {
    setQueues({
      couple_codes: [
        { data: null, error: null }, // step 0 used_by lookup misses (no inviteCode)
        { data: { wedding_id: 'gone' }, error: null }, // step 1 by-email
      ],
      event_notification_history: [
        { data: null, error: null }, // step 1 by-id lookup misses (stale)
        { data: { id: 'w5' }, error: null }, // step 2 email match
      ],
    });
    const r = await resolveClientEvent('u1', 'a@b.com', 'id');
    expect(r).toEqual({ id: 'w5' });
  });

  it('resolves via a couple_code already redeemed by the user', async () => {
    setQueues({
      couple_codes: [{ data: { wedding_id: 'wid-1' }, error: null }], // step 0 used_by lookup hits
      event_notification_history: [{ data: { id: 'wid-1', couple_name: 'A & B' }, error: null }],
    });
    const result = await resolveClientEvent('user-1', 'x@y.com', 'id, couple_name', null);
    expect(result).toEqual({ id: 'wid-1', couple_name: 'A & B' });
  });

  it('self-heals: redeems an unused code from metadata then resolves', async () => {
    setQueues({
      couple_codes: [{ data: null, error: null }], // step 0 used_by lookup misses
      rpc: [{ data: 'wid-2', error: null }], // redeem_couple_code returns wedding id
      event_notification_history: [{ data: { id: 'wid-2', couple_name: 'C & D' }, error: null }],
    });
    const result = await resolveClientEvent('user-2', 'typo@y.com', 'id, couple_name', 'WED-ABC123');
    expect(result).toEqual({ id: 'wid-2', couple_name: 'C & D' });
  });
});

# Portal Binding, Vendor Assignment & Date Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make couple accounts bind to their wedding by invite code (typo-proof), make vendor assignment from the Event Notification form persist for any staff role, and stop event dates from saving off-by-one.

**Architecture:** Privileged/correctness-critical writes move server-side. Two new SECURITY DEFINER paths (a `redeem_couple_code` function and an extension to the existing `create_event_notification` RPC) plus two additive RLS policies. Client code is simplified to call these and to format dates in local time.

**Tech Stack:** React + TypeScript (Vite), Supabase (Postgres + RLS + RPC), date-fns, vitest. DB changes applied to the e3e project via `mcp__supabase-e3e__apply_migration`. Typecheck gate: `npx tsc --noEmit`. Tests: `npx vitest run <file>`.

**Source specs:**
- `docs/superpowers/specs/2026-06-19-invite-code-binding-design.md`
- `docs/superpowers/specs/2026-06-19-vendor-assignment-and-date-hardening-design.md`

**Sequencing note:** Phase A (DB migrations) is applied to live production e3e and must land before the app tasks that call it. Migrations are additive and safe.

---

## File Structure

- DB (migrations, applied via MCP): `redeem_couple_code` fn, two RLS policies, `create_event_notification` extended.
- Create: `src/lib/dateWrite.ts` — `toLocalDateString` helper. Test: `src/lib/dateWrite.test.ts`.
- Modify: `src/utils/notificationDataBuilder.ts` — use helper for `event_date`.
- Modify: `src/utils/payloadBuilder.ts` — use helper for `event.date`/`dateFormatted`.
- Modify: `src/lib/resolveClientEvent.ts` — invite-code resolution step + self-heal. Test: `src/lib/resolveClientEvent.test.ts` (exists).
- Modify: `src/pages/ClientOnboarding.tsx` — call `redeem_couple_code` after signup.
- Modify: `src/hooks/useFormSubmission.ts` — pass `assigned_vendors` to RPC, drop client insert, fire vendor emails.
- Modify: `src/app/changelog.py`-equivalent → `src/` changelog (see Task 9 for exact path discovery).

---

## Phase A — Database migrations (apply to e3e)

### Task 1: `redeem_couple_code` function

**Files:** Migration `redeem_couple_code` via `mcp__supabase-e3e__apply_migration`.

- [ ] **Step 1: Apply the migration**

```sql
CREATE OR REPLACE FUNCTION public.redeem_couple_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.couple_codes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row
  FROM public.couple_codes
  WHERE code = p_code
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;                       -- invalid / expired
  END IF;

  IF v_row.used_by IS NULL THEN
    UPDATE public.couple_codes
       SET used_at = now(), used_by = v_uid
     WHERE id = v_row.id;
    RETURN v_row.wedding_id;
  ELSIF v_row.used_by = v_uid THEN
    RETURN v_row.wedding_id;           -- idempotent
  ELSE
    RETURN NULL;                       -- bound to another user; no rebind, no leak
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.redeem_couple_code(text) TO authenticated;
```

- [ ] **Step 2: Verify in SQL**

Run via `mcp__supabase-e3e__execute_sql`:
```sql
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'redeem_couple_code';
```
Expected: one row, `prosecdef = true`.

---

### Task 2: RLS — couples linked by redeemed code can read their event

**Files:** Migration `rls_event_linked_by_code`.

- [ ] **Step 1: Apply the migration**

```sql
CREATE POLICY "Couples linked by redeemed code view events"
ON public.event_notification_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.couple_codes cc
    WHERE cc.wedding_id = event_notification_history.id
      AND cc.used_by = auth.uid()
  )
);
```

- [ ] **Step 2: Verify**

```sql
SELECT policyname FROM pg_policies
WHERE tablename = 'event_notification_history'
  AND policyname = 'Couples linked by redeemed code view events';
```
Expected: one row.

---

### Task 3: RLS — users can read the couple_code they redeemed

**Files:** Migration `rls_couple_code_self_redeemed`.

- [ ] **Step 1: Apply the migration**

```sql
CREATE POLICY "Clients can read codes they redeemed"
ON public.couple_codes
FOR SELECT
TO authenticated
USING (used_by = auth.uid());
```

- [ ] **Step 2: Verify**

```sql
SELECT policyname FROM pg_policies
WHERE tablename = 'couple_codes'
  AND policyname = 'Clients can read codes they redeemed';
```
Expected: one row.

---

### Task 4: Extend `create_event_notification` to create vendor assignments

**Files:** Migration `create_event_notification_vendors`. This replaces the function body; preserve everything that exists today (verified current source on 2026-06-19) and add the vendor block before `RETURN v_id;`.

- [ ] **Step 1: Apply the migration** (full function — existing logic unchanged except the new block)

```sql
CREATE OR REPLACE FUNCTION public.create_event_notification(p_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_couple_code TEXT;
  v_prefix TEXT;
  v_dj_name TEXT;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'moderator'::app_role)) THEN
    RAISE EXCEPTION 'Permission denied: only staff can create event notifications';
  END IF;

  INSERT INTO public.event_notification_history (
    status, webhook_status_code, last_resent_at, ip_address, venue,
    file_uploaded, contact_email, event_type, contact_phone, submitted_by,
    submitted_by_user_id, webhook_response, form_progress, user_agent,
    coordinator_name, guest_count, edit_count, printed_at, additional_metadata,
    notes, couple_name, dj_name, event_date, resend_count, is_test,
    package_type, assigned_vendor_id, bride_email, groom_email, booking_source,
    hours_booked, hourly_rate, total_price, deposit_amount,
    dress_code, pricing_type, primary_contact_name, secondary_contact_name
  )
  VALUES (
    COALESCE((p_data->>'status')::text, 'submitted'),
    NULLIF(p_data->>'webhook_status_code','')::integer,
    NULLIF(p_data->>'last_resent_at','')::timestamptz,
    p_data->>'ip_address',
    p_data->>'venue',
    COALESCE((p_data->>'file_uploaded')::boolean, false),
    p_data->>'contact_email',
    p_data->>'event_type',
    p_data->>'contact_phone',
    p_data->>'submitted_by',
    auth.uid(),
    p_data->>'webhook_response',
    NULLIF(p_data->>'form_progress','')::integer,
    p_data->>'user_agent',
    p_data->>'coordinator_name',
    NULLIF(p_data->>'guest_count','')::integer,
    NULLIF(p_data->>'edit_count','')::integer,
    NULLIF(p_data->>'printed_at','')::timestamptz,
    COALESCE(p_data->'additional_metadata','{}'::jsonb),
    p_data->>'notes',
    p_data->>'couple_name',
    p_data->>'dj_name',
    NULLIF(p_data->>'event_date','')::date,
    COALESCE(NULLIF(p_data->>'resend_count','')::integer, 0),
    COALESCE((p_data->>'is_test')::boolean, false),
    p_data->>'package_type',
    NULLIF(p_data->>'assigned_vendor_id','')::uuid,
    p_data->>'bride_email',
    p_data->>'groom_email',
    p_data->>'booking_source',
    NULLIF(p_data->>'hours_booked','')::numeric,
    NULLIF(p_data->>'hourly_rate','')::numeric,
    NULLIF(p_data->>'total_price','')::numeric,
    NULLIF(p_data->>'deposit_amount','')::numeric,
    p_data->>'dress_code',
    COALESCE(p_data->>'pricing_type', 'hourly'),
    p_data->>'primary_contact_name',
    p_data->>'secondary_contact_name'
  )
  RETURNING id INTO v_id;

  v_prefix := public.couple_code_prefix(p_data->>'event_type');
  v_couple_code := v_prefix || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  INSERT INTO public.couple_codes (wedding_id, code, bride_email, groom_email)
  VALUES (v_id, v_couple_code, p_data->>'bride_email', p_data->>'groom_email');

  UPDATE public.event_notification_history
     SET additional_metadata = jsonb_set(
           COALESCE(additional_metadata, '{}'::jsonb),
           '{couple_code}', to_jsonb(v_couple_code))
   WHERE id = v_id;

  -- NEW: create vendor assignments from p_data->'assigned_vendors' (array of {vendorId, vendorName, vendorType})
  IF jsonb_typeof(p_data->'assigned_vendors') = 'array' THEN
    INSERT INTO public.event_dj_assignments (event_id, event_notification_id, dj_user_id, assigned_by, status)
    SELECT DISTINCT ON (vendor_id) v_id, v_id, vendor_id, auth.uid(), 'assigned'
    FROM (
      SELECT NULLIF(elem->>'vendorId','')::uuid AS vendor_id
      FROM jsonb_array_elements(p_data->'assigned_vendors') elem
    ) s
    WHERE vendor_id IS NOT NULL;

    SELECT string_agg(DISTINCT name, ', ') INTO v_dj_name
    FROM (
      SELECT NULLIF(elem->>'vendorName','') AS name
      FROM jsonb_array_elements(p_data->'assigned_vendors') elem
    ) n
    WHERE name IS NOT NULL;

    IF v_dj_name IS NOT NULL THEN
      UPDATE public.event_notification_history SET dj_name = v_dj_name WHERE id = v_id;
    END IF;
  END IF;

  RETURN v_id;
END;
$function$;
```

- [ ] **Step 2: Verify the function compiles and still returns uuid**

```sql
SELECT pg_get_function_result(oid) FROM pg_proc WHERE proname = 'create_event_notification';
```
Expected: `uuid`.

---

## Phase B — Date hardening (Fix 3)

### Task 5: `toLocalDateString` helper + tests

**Files:**
- Create: `src/lib/dateWrite.ts`
- Test: `src/lib/dateWrite.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/dateWrite.test.ts
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
```

- [ ] **Step 2: Run it, expect fail**

Run: `npx vitest run src/lib/dateWrite.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// src/lib/dateWrite.ts
/**
 * Format a Date as 'yyyy-MM-dd' using its LOCAL calendar components.
 * Avoids the date-fns `format` / toISOString off-by-one where a UTC-derived
 * Date renders the previous day in negative-offset timezones (e.g. Arizona).
 * If given a 'yyyy-MM-dd' string, returns it unchanged.
 */
export function toLocalDateString(value: Date | string): string {
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : value;
  }
  const y = value.getFullYear();
  const mo = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}
```

- [ ] **Step 4: Run it, expect pass**

Run: `npx vitest run src/lib/dateWrite.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dateWrite.ts src/lib/dateWrite.test.ts
git commit -m "feat: timezone-safe toLocalDateString helper for date writes"
```

---

### Task 6: Use the helper at event-date write sites

**Files:**
- Modify: `src/utils/notificationDataBuilder.ts:106`
- Modify: `src/utils/payloadBuilder.ts:130-131`

- [ ] **Step 1: notificationDataBuilder — replace the event_date line**

At top of `src/utils/notificationDataBuilder.ts`, add import:
```ts
import { toLocalDateString } from '@/lib/dateWrite';
```
Replace:
```ts
    event_date: format(data.weddingDate, 'yyyy-MM-dd'),
```
with:
```ts
    event_date: toLocalDateString(data.weddingDate),
```

- [ ] **Step 2: payloadBuilder — replace the date line**

At top of `src/utils/payloadBuilder.ts`, add import:
```ts
import { toLocalDateString } from '@/lib/dateWrite';
```
Replace:
```ts
      date: format(data.weddingDate, 'yyyy-MM-dd'),
      dateFormatted: format(data.weddingDate, 'PPP'),
```
with:
```ts
      date: toLocalDateString(data.weddingDate),
      dateFormatted: format(data.weddingDate, 'PPP'),
```
(`dateFormatted` is display-only; leave it on `format`.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (If `format` becomes unused in a file, remove its import.)

- [ ] **Step 4: Commit**

```bash
git add src/utils/notificationDataBuilder.ts src/utils/payloadBuilder.ts
git commit -m "fix: write event_date in local time to prevent off-by-one"
```

---

## Phase C — Invite-code binding (Fix 1)

### Task 7: `resolveClientEvent` — code-first resolution + self-heal

**Files:**
- Modify: `src/lib/resolveClientEvent.ts`
- Modify: `src/hooks/useClientEvent.ts` (pass invite code)
- Test: `src/lib/resolveClientEvent.test.ts` (exists)

- [ ] **Step 1: Add the new resolution path to `resolveClientEvent`**

Change the signature to accept an optional invite code and add Step 0 before the existing Step 1. Full new top of the function:

```ts
export async function resolveClientEvent<T = any>(
  userId: string,
  userEmail: string,
  select: string,
  inviteCode?: string | null
): Promise<T | null> {
  const emailLower = userEmail.toLowerCase();

  // Step 0: bind by invite code (typo-proof, account-id based)
  // 0a) already redeemed by this user?
  let { data: redeemed } = await supabase
    .from('couple_codes')
    .select('wedding_id')
    .eq('used_by', userId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 0b) not yet bound but the user carries an invite code → redeem now (self-heal)
  if (!redeemed?.wedding_id && inviteCode) {
    const { data: weddingId } = await supabase.rpc('redeem_couple_code', { p_code: inviteCode });
    if (weddingId) redeemed = { wedding_id: weddingId as string };
  }

  if (redeemed?.wedding_id) {
    const { data } = await supabase
      .from('event_notification_history')
      .select(select)
      .eq('id', redeemed.wedding_id)
      .maybeSingle();
    if (data) {
      if (import.meta.env.DEV) console.log('[resolveClientEvent] Resolved via redeemed couple code');
      return data as T;
    }
  }

  // …existing Step 1 (couple_codes by email) continues unchanged below…
```

Leave existing Steps 1–3 exactly as they are.

- [ ] **Step 2: Pass the invite code from the hook**

In `src/hooks/useClientEvent.ts`, change the resolve call:
```ts
const data = await resolveClientEvent<T>(
  user.id,
  user.email!,
  select,
  (user.user_metadata as any)?.invite_code ?? null
);
```

- [ ] **Step 3: Add tests** (append to `src/lib/resolveClientEvent.test.ts`)

```ts
it('resolves via a couple_code already redeemed by the user', async () => {
  // mock supabase: couple_codes.eq('used_by', userId) → { wedding_id: 'wid-1' }
  // event_notification_history.eq('id','wid-1') → { id: 'wid-1', couple_name: 'A & B' }
  const result = await resolveClientEvent('user-1', 'x@y.com', 'id, couple_name', null);
  expect(result).toEqual({ id: 'wid-1', couple_name: 'A & B' });
});

it('self-heals: redeems an unused code from metadata then resolves', async () => {
  // mock: couple_codes used_by lookup → null; rpc('redeem_couple_code') → 'wid-2';
  // event_notification_history.eq('id','wid-2') → { id:'wid-2', couple_name:'C & D' }
  const result = await resolveClientEvent('user-2', 'typo@y.com', 'id, couple_name', 'WED-ABC123');
  expect(result).toEqual({ id: 'wid-2', couple_name: 'C & D' });
});
```
The existing mock (top of `resolveClientEvent.test.ts`) only stubs `supabase.from()` via per-table queues set with `setQueues({ table: [{data,error}] })`. Extend the `vi.mock` factory to also expose `rpc`: add an `rpc` queue and return it from a `supabase.rpc` stub, e.g.:
```ts
// inside the vi.mock factory return:
return {
  supabase: {
    from: (t: string) => makeChain(t),
    rpc: () => {
      const q = h.state.queues['rpc'] || [];
      return Promise.resolve(q.length ? q.shift()! : { data: null, error: null });
    },
  },
};
```
Then in the self-heal test, queue `rpc: [{ data: 'wid-2', error: null }]` and `couple_codes: [{ data: null, error: null }]` (the used_by lookup misses) plus the `event_notification_history` row. In the first test, queue `couple_codes: [{ data: { wedding_id: 'wid-1' }, error: null }]` for the used_by lookup followed by the event row.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/resolveClientEvent.test.ts`
Expected: PASS (existing + 2 new).

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/resolveClientEvent.ts src/hooks/useClientEvent.ts src/lib/resolveClientEvent.test.ts
git commit -m "feat: bind client portal by invite code with self-heal"
```

---

### Task 8: `ClientOnboarding` — redeem code after signup

**Files:** Modify `src/pages/ClientOnboarding.tsx` (the couple-code branch, ~lines 153-167).

- [ ] **Step 1: Replace the client-side couple_codes update with the RPC**

In `handleProfileSubmit`, replace this block:
```ts
      const source = valid.source as 'couple_codes' | 'dj_codes';
      if (source === 'couple_codes') {
        await supabase
          .from('couple_codes')
          .update({ used_at: new Date().toISOString(), used_by: userId })
          .eq('code', code)
          .is('used_at', null);
      } else {
        await supabase
          .from('dj_codes')
          .update({ used_at: new Date().toISOString(), used_by: userId })
          .eq('code', code)
          .is('used_at', null);
      }
```
with:
```ts
      const source = valid.source as 'couple_codes' | 'dj_codes';
      if (source === 'couple_codes') {
        // Server-side redeem stamps used_by reliably (clients cannot UPDATE couple_codes via RLS).
        const { error: redeemErr } = await supabase.rpc('redeem_couple_code', { p_code: code });
        if (redeemErr) console.error('redeem_couple_code failed (non-fatal):', redeemErr);
      } else {
        await supabase
          .from('dj_codes')
          .update({ used_at: new Date().toISOString(), used_by: userId })
          .eq('code', code)
          .is('used_at', null);
      }
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ClientOnboarding.tsx
git commit -m "fix: redeem couple code server-side at signup"
```

---

## Phase D — Vendor assignment server-side (Fix 2)

### Task 9: `useFormSubmission` — send vendors to the RPC, drop the client insert

**Files:** Modify `src/hooks/useFormSubmission.ts`.

- [ ] **Step 1: Attach `assigned_vendors` to the RPC payload**

After `notificationData.additional_metadata = { ... }` (around line 83-87) and before the `rpc('create_event_notification', ...)` call, add:
```ts
      const assignedVendors = (data as any).assignedVendors as
        Array<{ vendorId?: string; vendorName?: string; vendorType?: string }> | undefined;
      notificationData.assigned_vendors = Array.isArray(assignedVendors) ? assignedVendors : [];
```

- [ ] **Step 2: Replace the client-side assignment block**

Delete the entire block that does `supabase.from('event_dj_assignments').insert(rows)` (current lines ~102-142) and replace with a post-create email trigger that reads the assignments the RPC created:
```ts
      // Vendor assignments are created inside create_event_notification (server-side).
      // Fire vendor-assignment emails for whatever the RPC inserted (fire-and-forget).
      const assignedVendorList = (data as any).assignedVendors as
        Array<{ vendorId?: string; vendorName?: string }> | undefined;
      if (Array.isArray(assignedVendorList) && assignedVendorList.some(v => v?.vendorId) && user) {
        const { data: createdAssignments } = await supabase
          .from('event_dj_assignments')
          .select('id, dj_user_id')
          .eq('event_id', notificationId);
        (createdAssignments ?? []).forEach((a: { id: string; dj_user_id: string }) => {
          supabase.functions.invoke('send-vendor-assignment-email', {
            body: { assignment_id: a.id, dj_user_id: a.dj_user_id, event_id: notificationId },
          }).catch((err) => console.error('vendor assignment email failed (non-fatal):', err));
        });
      }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (`notificationData` is typed `any`, so `.assigned_vendors` is fine.)

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useFormSubmission.ts
git commit -m "fix: create vendor assignments server-side via RPC (role-combo proof)"
```

---

### Task 10: Live verification of vendor flow

**Files:** none (manual / SQL verification using `mcp__supabase-e3e__execute_sql`).

- [ ] **Step 1:** Confirm the RPC path by simulating data — insert a test event via the app as a moderator coordinator with one vendor selected, then:
```sql
SELECT e.id, e.dj_name, a.dj_user_id, a.status
FROM event_notification_history e
LEFT JOIN event_dj_assignments a ON a.event_id = e.id
WHERE e.couple_name ILIKE '%<test couple>%'
ORDER BY e.created_at DESC LIMIT 5;
```
Expected: assignment row present, `dj_name` populated.

- [ ] **Step 2:** Clean up the test event if created (delete assignment, event, couple_code).

---

## Phase E — Changelog + final gate

### Task 11: Final gate — full typecheck, tests, push

**Files:** none. (The enzym3 app has no user-facing release changelog file — the only "changelog" in `src` is the music-sheet feature. The "always update changelog" rule applies to the separate TTT app, not this repo. Skip the changelog edit here.)

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit`
Expected: clean (Lovable build gate).

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: all green.

- [ ] **Step 4: Commit + push to both remotes**

```bash
git add -A
git commit -m "docs: changelog — portal binding, vendor assignment, date fixes"
git pushall
```

---

## Self-Review notes (author)

- **Spec coverage:** invite-code (Tasks 1-3,7,8) ✓ · vendor server-side (Tasks 4,9,10) ✓ · date hardening (Tasks 5,6) ✓.
- **Role-combo concern:** handled by routing the vendor write through the staff-gated SECURITY DEFINER RPC; no client-side role check remains in the write path.
- **Type consistency:** `assigned_vendors` (snake_case) is the RPC/JSON key; `assignedVendors` (camelCase) is the form field — mapped explicitly in Task 9 Step 1.
- **Open verification during execution:** confirm the exact mock-builder API in `resolveClientEvent.test.ts` before writing Task 7 tests; confirm changelog file path in Task 11.

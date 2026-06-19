# Invite-Code Account Binding — Design

**Date:** 2026-06-19
**Status:** Approved (design), pending implementation plan
**Author:** JJ + Claude

## Problem

A logged-in couple is connected to their wedding **only by exact email match**. The
`event_notification_history` SELECT policy grants couple access via
`contact_email / bride_email / groom_email = auth.email()`. If the email a couple registers
with differs from the email on their booking by even one character, no event resolves and they
fall through to the generic `PortalGate` "Sign your contract and complete your deposit" lock
screen, whose CTA dead-ends on "No Wedding Found."

Confirmed real case: Eric Jones registered as `e78merlin@gmail.com`; his booking groom email was
`ee78merlin@gmail.com`. He entered the **correct** invite code (`WED-14AF7C`, which is bound to his
`wedding_id`), but the app never uses the code's wedding link — only email.

### Secondary defect (same root)

Clients cannot `UPDATE couple_codes` (only the "Admins can manage couple codes" policy permits
writes). The onboarding flow's client-side `couple_codes.update({ used_at, used_by })` therefore
fails silently. Codes are never marked used → they can be reused, and there is no durable
account→wedding link recorded.

## Goal

Bind a couple's account to their wedding by the **invite code's `wedding_id`**, keyed on account
`user_id` rather than email — so registration is typo-proof. Mark codes consumed reliably.

Non-goals: changing the DJ/vendor (`dj_codes`) flow; backfilling historical data (the design
self-heals existing accounts on next load); altering pricing, contract, or venue-partner logic.

## Approach: redeem-on-bind (mirrors the existing DJ pattern)

DJs already bind to events by `user_id` via `event_dj_assignments` with no email dependency. We
mirror that for couples using the existing `couple_codes.used_by` column. Four additive pieces.

### 1. `redeem_couple_code(p_code text)` — SECURITY DEFINER function

Runs with elevated privileges (clients cannot write `couple_codes` directly).

Behavior:
- Resolve `auth.uid()`; if null, raise (must be authenticated).
- Find `couple_codes` row by `code = p_code` AND `active = true` AND
  (`expires_at IS NULL` OR `expires_at > now()`).
- If none → return null (invalid/expired).
- If `used_by` is null → set `used_at = now()`, `used_by = auth.uid()`.
- If `used_by = auth.uid()` already → no-op (idempotent).
- If `used_by` is a **different** user → do **not** rebind and return null (the caller gets no
  binding and no event leak). Prevents a code from hijacking another couple's binding.
- Return `wedding_id`.

Granted to `authenticated`. `SECURITY DEFINER`, `search_path = public`.

### 2. New SELECT policy on `event_notification_history`

Additive (policies are OR'd). Couples linked by a redeemed code can read their event:

```
EXISTS (
  SELECT 1 FROM couple_codes cc
  WHERE cc.wedding_id = event_notification_history.id
    AND cc.used_by = auth.uid()
)
```

The existing email-match and staff/DJ clauses remain untouched.

### 3. New SELECT policy on `couple_codes`

Additive. Let a user read the code they personally redeemed:

```
used_by = auth.uid()
```

The existing email-match read policy remains.

### 4. App wiring

- **`ClientOnboarding.tsx`:** after `supabase.auth.signUp(...)` succeeds and a session exists
  (auto-confirm is enabled on this project), call
  `supabase.rpc('redeem_couple_code', { p_code: code })`. Replace the current broken client-side
  `couple_codes.update(...)`. Keep `dj_codes` consumption path as-is for the vendor source.
- **`resolveClientEvent.ts`:** add a new **Step 0** (runs first):
  1. Read `couple_codes` where `used_by = userId` (newest, active) → `wedding_id`.
  2. If none found AND the user has `invite_code` in auth metadata, call
     `redeem_couple_code` once, then retry the read. (Self-heal for accounts created before this
     change or where confirmation delayed the session at signup.)
  3. If a `wedding_id` is resolved, fetch the event via the new RLS path and return it.
  - Existing Steps 1–3 (couple_codes-by-email, event-by-email, vendor assignment) remain as
    fallbacks.
- `resolveClientEvent` signature gains the user's invite code (the caller `useClientEvent`
  already has `user`, so it reads `user.user_metadata?.invite_code`).

## Data flow (new happy path)

```
Signup with code  → redeem_couple_code() stamps used_by = userId
Later login       → resolveClientEvent Step 0 reads couple_codes by used_by → wedding_id
                  → event_notification_history readable via new "linked by code" policy
                  → useEventAccess sees booking_source=venue_partner → portal unlocks correctly
```

## Error handling

- `redeem_couple_code` returns null on invalid/expired/foreign-bound codes; callers treat null as
  "no binding" and fall through to email-based resolution. No throw to the UI for the normal
  not-found case (only throw on unauthenticated).
- Self-heal redeem in `resolveClientEvent` is best-effort: failure is swallowed and resolution
  falls through to existing email steps, preserving today's behavior.

## Testing

- **Function/RLS (SQL against the project):**
  - Redeem with a valid unused code stamps `used_by` and returns `wedding_id`.
  - Second redeem by same user is idempotent.
  - Redeem of a code already used by another user does not rebind and does not leak the event.
  - As an authenticated couple with a redeemed code but **non-matching email**, selecting their
    event returns the row (new policy works); a couple with neither email nor code sees nothing.
- **`resolveClientEvent` (pure logic, mocked supabase):** Step 0 resolves by `used_by`; self-heal
  path invokes redeem then retries; falls back to email steps when no code.
- **Manual:** a fresh signup with a deliberately mismatched email lands on the correct portal, not
  the contract wall.

## Risks & mitigations

- *RLS recursion / performance:* the new `EXISTS` subquery on `couple_codes` mirrors the existing
  `event_dj_assignments` EXISTS clause already in production — same shape, acceptable.
- *Auto-confirm assumption:* if email confirmation is later turned on, signup-time redeem may run
  without a session; the `resolveClientEvent` self-heal covers that case on first authenticated
  load.
- *Additive only:* no existing policy or resolution step is removed, so currently-working couples
  are unaffected.

## Out of scope / follow-ups

- Auditing other venue-partner couples' `event_date` values for the suspected bad-import dates
  (tracked separately).

# Vendor Assignment (server-side) + Date Timezone Hardening — Design

**Date:** 2026-06-19
**Status:** Approved (design), pending implementation plan
**Author:** JJ + Claude

Two related root fixes, same philosophy as the invite-code binding work: privileged or
correctness-critical writes must not depend on the client's role or the browser's timezone.

---

## Fix 2 — Vendor assignment created server-side

### Problem

The Event Notification form (`useFormSubmission.ts`) creates the event row via the
`create_event_notification` RPC (SECURITY DEFINER — works for any submitter), then creates the
vendor↔event link with a **direct client-side insert** into `event_dj_assignments`
(`useFormSubmission.ts:103-142`). That table's INSERT policy is gated to `admin`/`moderator`
(`e3c_admins_can_assign_vendors`). Consequences:

- A coordinator whose role isn't exactly admin/moderator is silently rejected — the event saves,
  the vendors don't "stick." (A red "Vendor assignment failed" toast may flash by.)
- Even when it works, a critical write depends on the submitter's client-side role, which is
  fragile across multi-role users (the `user_roles` multi vs `profiles.role` single split).

Vendor selection itself only allows **registered, active vendor profiles**
(`MultiVendorSelector` filters `profiles.role IN ('vendor','dj') AND is_active`), and the submit
loop drops any vendor lacking a `vendorId`. Those constraints stay; this fix is about the write.

### Approach

Move vendor-assignment creation into the server-side event-creation flow.

1. **Extend `create_event_notification` RPC** (or add a companion `assign_event_vendors` RPC,
   whichever keeps the function focused) to accept the `assignedVendors` array and, within the
   same SECURITY DEFINER context:
   - Insert one `event_dj_assignments` row per vendor (`event_id`, `event_notification_id`,
     `dj_user_id`, `assigned_by = auth.uid()`, `status = 'assigned'`), de-duplicated by
     `dj_user_id`.
   - Set `event_notification_history.dj_name` to the joined vendor names.
   - Authorization inside the function: require the caller hold a staff role
     (`has_role(auth.uid(),'admin' | 'moderator' | 'super_admin')`). This keeps the same intent
     as today's RLS but evaluates it correctly against `user_roles` regardless of role combo, and
     no longer fails on a per-table client insert.
2. **`useFormSubmission.ts`:** stop doing the direct `event_dj_assignments` insert; pass
   `assignedVendors` to the RPC instead. Keep the existing post-create calls
   (`process-form-submission`, `send-client-invite`) unchanged. The vendor-assignment email
   (`send-vendor-assignment-email`) currently fires from `useCreateAssignment`; ensure the form
   path triggers vendor notification too (either the RPC returns the new assignment IDs and the
   client invokes the email function, or `process-form-submission` sends it). Decide during
   planning; do not drop the email.

### Out of scope

- The event-detail "Assign" panel (`useCreateAssignment`) — that path is used by admins and is
  not the reported break. Leave as-is unless trivially unifiable.
- Allowing free-text / unregistered vendors — unchanged.

### Testing

- RPC inserts assignments + sets `dj_name` when called by a moderator-only and a user+moderator
  account (role-combo coverage); rejects a caller with no staff role.
- Duplicate vendor in the array yields one assignment.
- `useFormSubmission` happy path: event + assignments created, vendor email triggered, no
  client-side `event_dj_assignments` insert remains.
- Manual: as a moderator coordinator, add a vendor on the Event Notification form → assignment
  persists, shows in Assigned Vendors, vendor gets the email/portal item.

---

## Fix 3 — Date timezone hardening

### Problem

`notificationDataBuilder.ts:106` and `payloadBuilder.ts:130` write the event date with
`format(data.weddingDate, 'yyyy-MM-dd')`. `date-fns` `format` uses **local** time. A
`weddingDate` that originated as a UTC-midnight `Date` renders as the previous calendar day in
Arizona (UTC-7), silently saving the date one day early. (This is a latent off-by-one, distinct
from Eric's manual +6 entry, which is already corrected.)

### Approach

Introduce one shared helper (e.g. `toLocalDateString(date): 'yyyy-MM-dd'`) that formats using
local Y/M/D components — or reuse the existing `parseLocalDate`/formatter utilities the codebase
already has for the read side — and use it at every event-date **write**:

- `notificationDataBuilder.ts` (event_date)
- `payloadBuilder.ts` (event.date / dateFormatted)

Audit the other `format(..., 'yyyy-MM-dd')` write sites surfaced in grep (meeting booking dates,
reminder scheduled_date) and apply the same helper where the value is persisted as a calendar
date. Pure display/query-range formatting that already round-trips correctly can stay.

### Testing

- Unit: `toLocalDateString` returns the same calendar day the user picked for a date at local
  midnight and at a UTC-midnight-derived Date, across a negative-offset timezone.
- Regression: building notification data for a known picked date yields that exact `event_date`.

---

## Rollout

All three fixes (these two plus the approved invite-code binding) ship together: DB migrations
applied to the e3e project, app changes typechecked (`npx tsc --noEmit` must pass — Lovable build
gate), changelog entry added, committed atomically, pushed to both remotes. Eric and Amelia data
fixes are already live and independent of this rollout.

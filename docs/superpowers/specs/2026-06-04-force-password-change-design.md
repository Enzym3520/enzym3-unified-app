# Force Password Change on Login

**Date:** 2026-06-04  
**Status:** Approved  

## Problem

When an admin resets a user's password (staff, vendor, or client), there is no mechanism to force the user to choose a new password before accessing their portal. Users may continue using the temporary password indefinitely.

## Scope

Applies to all user types: staff (admin/moderator), vendors, and clients.

## Architecture

### 1. Database Migration

Add a single column to the existing `profiles` table:

```sql
ALTER TABLE profiles ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;
```

No RLS changes required — the column is covered by the existing profiles policy (authenticated users can read/update their own row).

### 2. `/change-password` Page

- New route at `/change-password` in `App.tsx`
- No `RequireRole` wrapper — only requires an active Supabase session
- If no session, redirects to `/login`
- Form fields: new password + confirm password (min 8 chars, must match)
- On submit:
  1. `supabase.auth.updateUser({ password: newPassword })`
  2. `supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id)`
  3. Redirect to correct portal based on role (`/staff`, `/vendor`, or `/app`)
- Styled to match existing `ResetPassword.tsx` page

### 3. `RequireRole` Guard Update

After the existing role check passes, fetch `must_change_password` from `profiles` for the current user. If `true`, redirect to `/change-password` before rendering children. This intercepts all three portals (`/app`, `/staff`, `/vendor`) transparently.

The fetch is a lightweight single-column query — no impact on existing load times in practice.

### 4. Staff Portal Admin UI — Password Reset Modal

Location: Vendor Management page (`/staff/vendor-management`) — the existing user management table where staff already see and manage vendor accounts. Extend this to cover staff/moderator users as well if needed later; for now scoped to the vendor table where admin-initiated resets are most common.

**New "Reset Password" action** per user row (button or dropdown item):
- Opens a small modal: "New password" + "Confirm password" fields
- On save:
  1. Calls a new Supabase Edge Function `admin-reset-password` with `{ userId, newPassword }`
  2. Edge function verifies caller is admin/moderator, then calls `supabase.auth.admin.updateUserById(userId, { password })`
  3. Edge function also sets `profiles.must_change_password = true` for that user
- On success: toast "Password reset — user will be prompted to change it on next login"

The admin API call must happen server-side (edge function) because `auth.admin` is not available client-side.

### 5. Carlos Caldera — Immediate Action

After the migration runs, set `must_change_password = true` on Carlos's profile (`c.caldera@borderland.com`, user ID `a45444ad-a566-4646-ad91-91e6b53b302e`) so he is prompted on next login.

## Data Flow

```
Admin resets password (modal)
  → edge fn: auth.admin.updateUserById + profiles.must_change_password = true

User logs in
  → RequireRole checks must_change_password
  → if true → redirect /change-password
  → user sets new password
  → profiles.must_change_password = false
  → redirect to portal
```

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/pages/ChangePassword.tsx` | Create |
| `src/components/RequireRole.tsx` | Modify — add flag check |
| `src/App.tsx` | Modify — add `/change-password` route |
| `supabase/functions/admin-reset-password/index.ts` | Create |
| `src/pages/staff/VendorManagement.tsx` | Modify — add Reset Password action + modal |
| Supabase migration SQL | Create |

## Error Handling

- If the profiles fetch in `RequireRole` fails, fail open (don't block login) and log the error
- If the edge function fails, show a toast error; do not set the flag
- `/change-password` validates password match and min length client-side before submitting

## Out of Scope

- Email notification when admin resets a password (future)
- Password strength meter (future)
- Audit log of password resets (future)

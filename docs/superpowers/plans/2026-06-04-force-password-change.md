# Force Password Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Force users to set a new password on first login after an admin resets their credentials.

**Architecture:** A `must_change_password` boolean column on `profiles` drives everything. `RequireRole` checks it on every protected route and redirects to `/change-password` if set. Admins trigger resets via a modal in VendorManagement that calls a new `admin-reset-password` edge function, which uses the admin API and flips the flag.

**Tech Stack:** React + React Router v6, Supabase (PostgreSQL, Auth, Edge Functions / Deno), TanStack Query, react-hook-form + zod, sonner toasts, shadcn/ui Dialog

---

## File Map

| File | Action |
|------|--------|
| `supabase/migrations/20260604000001_add_must_change_password.sql` | Create — adds column, sets Carlos's flag |
| `supabase/functions/admin-reset-password/index.ts` | Create — edge function: verifies admin, resets auth password, sets flag |
| `src/pages/ChangePassword.tsx` | Create — auth-gated page for setting a new password |
| `src/components/RequireRole.tsx` | Modify — check flag and redirect before rendering portal |
| `src/App.tsx` | Modify — register `/change-password` route |
| `src/hooks/useAdminResetPassword.ts` | Create — TanStack mutation that calls the edge function |
| `src/components/staff/vendor-management/ResetPasswordModal.tsx` | Create — Dialog modal with password fields |
| `src/components/staff/vendor-management/VendorManagementTable.tsx` | Modify — add "Reset Password" dropdown item + wire modal |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260604000001_add_must_change_password.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260604000001_add_must_change_password.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Mark Carlos Caldera so he is prompted on next login
UPDATE profiles
SET must_change_password = true
WHERE id = 'a45444ad-a566-4646-ad91-91e6b53b302e';
```

- [ ] **Step 2: Apply the migration via MCP (Supabase execute_sql)**

Run the two statements above against project `ytembomoyhuwdtrzlwbi`. Verify by selecting:
```sql
SELECT id, email, must_change_password FROM profiles WHERE id = 'a45444ad-a566-4646-ad91-91e6b53b302e';
```
Expected: one row with `must_change_password = true`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260604000001_add_must_change_password.sql
git commit -m "feat: add must_change_password column to profiles"
```

---

## Task 2: Edge Function — `admin-reset-password`

**Files:**
- Create: `supabase/functions/admin-reset-password/index.ts`

- [ ] **Step 1: Create the edge function**

```typescript
// supabase/functions/admin-reset-password/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is admin or moderator
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'moderator', 'super_admin'])
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin or moderator role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'userId and newPassword are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset the password via admin API
    const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (resetError) {
      return new Response(
        JSON.stringify({ error: resetError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set must_change_password flag
    const { error: flagError } = await adminClient
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);
    if (flagError) {
      return new Response(
        JSON.stringify({ error: 'Password reset but failed to set flag: ' + flagError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

- [ ] **Step 2: Deploy the edge function**

```bash
cd enzym3-workspace/enzym3-unified-app
npx supabase functions deploy admin-reset-password --project-ref ytembomoyhuwdtrzlwbi
```

Expected output: `Deployed Function admin-reset-password`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/admin-reset-password/index.ts
git commit -m "feat: add admin-reset-password edge function"
```

---

## Task 3: `ChangePassword` Page

**Files:**
- Create: `src/pages/ChangePassword.tsx`

- [ ] **Step 1: Write the test**

```typescript
// src/pages/ChangePassword.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockUpdateUser = vi.fn();
const mockFrom = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      updateUser: mockUpdateUser,
    },
    from: mockFrom,
  },
}));
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: false, isModerator: false, isVendor: false, isLoading: false, roles: ['user'] }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import ChangePassword from './ChangePassword';

describe('ChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('renders new password and confirm fields', () => {
    render(<MemoryRouter><ChangePassword /></MemoryRouter>);
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<MemoryRouter><ChangePassword /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'Password1!' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'Different1!' } });
    fireEvent.click(screen.getByRole('button', { name: /set password/i }));
    await waitFor(() => expect(screen.getByText(/do not match/i)).toBeInTheDocument());
  });

  it('calls updateUser and clears flag on valid submit', async () => {
    render(<MemoryRouter><ChangePassword /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'NewPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /set password/i }));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPass123!' }));
    expect(mockNavigate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd enzym3-workspace/enzym3-unified-app
npx vitest run src/pages/ChangePassword.test.tsx
```

Expected: FAIL — `ChangePassword` module not found.

- [ ] **Step 3: Create the page**

```typescript
// src/pages/ChangePassword.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  password: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type F = z.infer<typeof schema>;

export default function ChangePassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isAdmin, isModerator, isVendor, isLoading } = useUserRole();

  const { register, handleSubmit, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/login', { replace: true });
    };
    checkSession();
  }, [navigate]);

  const onSubmit = async ({ password }: F) => {
    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      toast.error('Failed to update password. Please try again.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id);
    }

    toast.success('Password updated successfully.');

    if (isAdmin || isModerator) navigate('/staff', { replace: true });
    else if (isVendor) navigate('/vendor', { replace: true });
    else navigate('/app', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#85D4FA]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="text-sm text-muted-foreground">
            Your password was reset by an admin. Please set a new password to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : 'Set password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/pages/ChangePassword.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/ChangePassword.tsx src/pages/ChangePassword.test.tsx
git commit -m "feat: add ChangePassword page"
```

---

## Task 4: Register the Route in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import**

In `src/App.tsx`, add the import after the existing `ResetPassword` import:

```typescript
import ChangePassword from '@/pages/ChangePassword';
```

- [ ] **Step 2: Add route**

In `src/App.tsx`, add the route directly after the `/reset-password` route:

```tsx
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/change-password" element={<ChangePassword />} />
```

- [ ] **Step 3: Verify build**

```bash
cd enzym3-workspace/enzym3-unified-app
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: register /change-password route"
```

---

## Task 5: Update `RequireRole` to Check the Flag

**Files:**
- Modify: `src/components/RequireRole.tsx`

- [ ] **Step 1: Write the test**

```typescript
// src/components/RequireRole.test.tsx
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: true, isModerator: false, isVendor: false, isLoading: false }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/staff' }) };
});

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
    from: mockFrom,
  },
}));

import { RequireRole } from './RequireRole';

describe('RequireRole', () => {
  it('redirects to /change-password when must_change_password is true', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { must_change_password: true }, error: null }),
        }),
      }),
    });
    render(
      <MemoryRouter>
        <RequireRole role="admin"><div>content</div></RequireRole>
      </MemoryRouter>
    );
    await vi.waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/change-password', { replace: true }));
  });

  it('renders children when must_change_password is false', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { must_change_password: false }, error: null }),
        }),
      }),
    });
    const { getByText } = render(
      <MemoryRouter>
        <RequireRole role="admin"><div>content</div></RequireRole>
      </MemoryRouter>
    );
    await vi.waitFor(() => expect(getByText('content')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/RequireRole.test.tsx
```

Expected: FAIL — redirect to `/change-password` does not happen.

- [ ] **Step 3: Update `RequireRole.tsx`**

Replace the entire file with:

```typescript
// src/components/RequireRole.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

interface Props { role: 'admin' | 'vendor' | 'client'; children: ReactNode; }

export function RequireRole({ role, children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isModerator, isVendor, isLoading } = useUserRole();
  const [flagChecked, setFlagChecked] = useState(false);

  let allowed = false;
  if (!isLoading) {
    if (role === 'admin') allowed = isAdmin || isModerator;
    else if (role === 'vendor') allowed = isVendor;
    else if (role === 'client') allowed = !isAdmin && !isModerator && !isVendor;
  }

  useEffect(() => {
    if (isLoading || !allowed) return;

    const checkFlag = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setFlagChecked(true); return; }

      const { data } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.must_change_password) {
        navigate('/change-password', { replace: true });
      } else {
        setFlagChecked(true);
      }
    };

    checkFlag();
  }, [isLoading, allowed, navigate]);

  useEffect(() => {
    if (isLoading || allowed) return;
    navigate('/login', { state: { from: location.pathname } });
  }, [isLoading, allowed, navigate, location.pathname]);

  if (isLoading || !allowed || !flagChecked) return null;
  return <>{children}</>;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/RequireRole.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/RequireRole.tsx src/components/RequireRole.test.tsx
git commit -m "feat: RequireRole checks must_change_password flag before rendering portal"
```

---

## Task 6: `useAdminResetPassword` Hook

**Files:**
- Create: `src/hooks/useAdminResetPassword.ts`

- [ ] **Step 1: Write the test**

```typescript
// src/hooks/useAdminResetPassword.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: mockInvoke } },
}));

import { useAdminResetPassword } from './useAdminResetPassword';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient() }, children);

describe('useAdminResetPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls admin-reset-password edge function with userId and newPassword', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
    const { result } = renderHook(() => useAdminResetPassword(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ userId: 'u1', newPassword: 'Pass1234!' });
    });
    expect(mockInvoke).toHaveBeenCalledWith('admin-reset-password', {
      body: { userId: 'u1', newPassword: 'Pass1234!' },
    });
  });

  it('throws when edge function returns error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Forbidden' } });
    const { result } = renderHook(() => useAdminResetPassword(), { wrapper });
    await expect(
      act(async () => { await result.current.mutateAsync({ userId: 'u1', newPassword: 'Pass1234!' }); })
    ).rejects.toThrow('Forbidden');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/hooks/useAdminResetPassword.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the hook**

```typescript
// src/hooks/useAdminResetPassword.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResetPasswordArgs {
  userId: string;
  newPassword: string;
}

export function useAdminResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newPassword }: ResetPasswordArgs) => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, newPassword },
      });
      if (error) throw new Error(error.message || 'Failed to reset password');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Password reset — user will be prompted to change it on next login.');
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to reset password.'),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/hooks/useAdminResetPassword.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAdminResetPassword.ts src/hooks/useAdminResetPassword.test.ts
git commit -m "feat: add useAdminResetPassword hook"
```

---

## Task 7: `ResetPasswordModal` Component

**Files:**
- Create: `src/components/staff/vendor-management/ResetPasswordModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/staff/vendor-management/ResetPasswordModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAdminResetPassword } from '@/hooks/useAdminResetPassword';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const schema = z.object({
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type F = z.infer<typeof schema>;

export function ResetPasswordModal({ open, onOpenChange, userId, userName }: Props) {
  const { mutate: resetPassword, isPending } = useAdminResetPassword();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  const onSubmit = ({ newPassword }: F) => {
    resetPassword({ userId, newPassword }, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  const handleClose = (open: boolean) => {
    if (!isPending) { reset(); onOpenChange(open); }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new temporary password for {userName}. They will be prompted to change it on next login.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" {...register('newPassword')} />
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting…</> : 'Reset password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/staff/vendor-management/ResetPasswordModal.tsx
git commit -m "feat: add ResetPasswordModal component"
```

---

## Task 8: Wire Modal into `VendorManagementTable`

**Files:**
- Modify: `src/components/staff/vendor-management/VendorManagementTable.tsx`

- [ ] **Step 1: Add import for `KeyRound` icon and `ResetPasswordModal`**

In `VendorManagementTable.tsx`, update the lucide import to include `KeyRound`:

```typescript
import { MoreHorizontal, Eye, Copy, Send, Ban, Trash2, Edit, ShieldCheck, ShieldAlert, ShieldX, Star, Power, PowerOff, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, KeyRound } from 'lucide-react';
```

Add the modal import after the other modal imports (after line with `EditVendorModal`):

```typescript
import { ResetPasswordModal } from './ResetPasswordModal';
```

- [ ] **Step 2: Add state for the reset modal**

Inside the component, after the existing modal state declarations, add:

```typescript
const [resetPasswordTarget, setResetPasswordTarget] = useState<{ userId: string; userName: string } | null>(null);
```

- [ ] **Step 3: Add "Reset Password" dropdown item in the desktop table**

In the desktop table section (around line 578), inside the `{(vendor.status === 'active' || vendor.status === 'inactive') && vendor.userId && (` block, add the new item after the "Edit Profile" item and its separator:

```tsx
<DropdownMenuItem onClick={() => setResetPasswordTarget({ userId: vendor.userId!, userName: vendor.name })}>
  <KeyRound className="mr-2 h-4 w-4" />
  Reset Password
</DropdownMenuItem>
<DropdownMenuSeparator />
```

Place this immediately before the existing `<DropdownMenuSeparator />` that precedes the Deactivate/Activate item.

- [ ] **Step 4: Add the same item in the mobile card dropdown**

In the mobile card section (around line 415), inside the same `{(vendor.status === 'active' || vendor.status === 'inactive') && vendor.userId && (` block, add after "Edit Profile":

```tsx
<DropdownMenuItem onClick={() => setResetPasswordTarget({ userId: vendor.userId!, userName: vendor.name })}>
  <KeyRound className="mr-2 h-4 w-4" />
  Reset Password
</DropdownMenuItem>
```

- [ ] **Step 5: Render the modal**

At the bottom of the component's return statement, after the other modals, add:

```tsx
{resetPasswordTarget && (
  <ResetPasswordModal
    open={!!resetPasswordTarget}
    onOpenChange={(open) => { if (!open) setResetPasswordTarget(null); }}
    userId={resetPasswordTarget.userId}
    userName={resetPasswordTarget.userName}
  />
)}
```

- [ ] **Step 6: Verify build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/staff/vendor-management/VendorManagementTable.tsx
git commit -m "feat: add Reset Password action to VendorManagementTable"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run full build**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: no TS errors, all tests pass.

- [ ] **Step 2: Run dev server and smoke test**

```bash
npm run dev
```

1. Log in as Carlos (`c.caldera@borderland.com`, password `Border!2026`) — should be redirected to `/change-password` immediately.
2. Set a new password → should land on the correct portal.
3. Log out, log in again with the new password → no redirect to `/change-password`.
4. Log in as admin → go to Vendor Management → find an active vendor → open the `⋯` menu → confirm "Reset Password" item is present → click it → modal appears → set a password → toast confirms.

- [ ] **Step 3: Push to GitHub and Lovable**

```bash
git push origin main
git push lovable main
```

Expected: clean push, Lovable build passes.

---

## Post-Deploy

Set Carlos's flag now (before his next login) if not already done by Task 1:

```sql
UPDATE profiles SET must_change_password = true WHERE id = 'a45444ad-a566-4646-ad91-91e6b53b302e';
```

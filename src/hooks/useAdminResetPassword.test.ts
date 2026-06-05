// src/hooks/useAdminResetPassword.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

const { mockInvoke } = vi.hoisted(() => ({ mockInvoke: vi.fn() }));
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

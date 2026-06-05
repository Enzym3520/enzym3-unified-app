import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const { mockNavigate, mockFrom } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: true, isModerator: false, isVendor: false, isLoading: false }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/staff' }) };
});

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

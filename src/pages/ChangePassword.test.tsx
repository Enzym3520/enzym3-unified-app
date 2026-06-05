import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const { mockUpdateUser, mockInvoke, mockNavigate } = vi.hoisted(() => ({
  mockUpdateUser: vi.fn(),
  mockInvoke: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      updateUser: mockUpdateUser,
    },
    functions: {
      invoke: mockInvoke,
    },
  },
}));
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: false, isModerator: false, isVendor: false, isLoading: false, roles: ['user'] }),
  clearRoleCache: vi.fn(),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import ChangePassword from './ChangePassword';

describe('ChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it('renders new password and confirm fields', async () => {
    render(<MemoryRouter><ChangePassword /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText(/new password/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/confirm/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<MemoryRouter><ChangePassword /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText(/new password/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'Password1!' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'Different1!' } });
    fireEvent.click(screen.getByRole('button', { name: /set password/i }));
    await waitFor(() => expect(screen.getByText(/do not match/i)).toBeInTheDocument());
  });

  it('calls updateUser and clears flag on valid submit', async () => {
    render(<MemoryRouter><ChangePassword /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText(/new password/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'NewPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'NewPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /set password/i }));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPass123!' }));
    expect(mockInvoke).toHaveBeenCalledWith('clear-password-flag');
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('shows error when password is too short', async () => {
    render(<MemoryRouter><ChangePassword /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText(/new password/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /set password/i }));
    await waitFor(() => expect(screen.getByText(/min 8 characters/i)).toBeInTheDocument());
  });
});

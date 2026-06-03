import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
interface Props { role: 'admin' | 'vendor' | 'client'; children: ReactNode; }
export function RequireRole({ role, children }: Props) {
  const navigate = useNavigate();
  const { isAdmin, isModerator, isVendor, isLoading } = useUserRole();

  let allowed = false;
  if (!isLoading) {
    if (role === 'admin') allowed = isAdmin || isModerator;
    else if (role === 'vendor') allowed = isVendor;
    else if (role === 'client') allowed = !isAdmin && !isModerator && !isVendor;
  }

  useEffect(() => {
    if (isLoading || allowed) return;
    navigate('/login');
  }, [isLoading, allowed, navigate]);

  if (isLoading || !allowed) return null;
  return <>{children}</>;
}

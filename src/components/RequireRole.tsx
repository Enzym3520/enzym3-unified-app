import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
interface Props { role: 'admin' | 'vendor' | 'client'; children: ReactNode; }
export function RequireRole({ role, children }: Props) {
  const navigate = useNavigate();
  const { isAdmin, isModerator, isVendor, isLoading, roles } = useUserRole();
  useEffect(() => {
    if (isLoading) return;
    let allowed = false;
    if (role === 'admin') allowed = isAdmin || isModerator;
    else if (role === 'vendor') allowed = isVendor;
    else if (role === 'client') allowed = !isAdmin && !isModerator && !isVendor;
    if (!allowed) navigate('/login');
  }, [isAdmin, isModerator, isVendor, isLoading, roles, role, navigate]);
  if (isLoading) return null;
  return <>{children}</>;
}

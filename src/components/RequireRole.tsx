import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserRole } from '@/hooks/useUserRole';
import { useUserRole } from '@/hooks/useUserRole';
interface Props { role: Exclude<UserRole, null>; children: ReactNode; }
export function RequireRole({ role, children }: Props) {
  const navigate = useNavigate();
  const { role: userRole, loading } = useUserRole();
  useEffect(() => {
    if (loading) return;
    if (!userRole) { navigate('/login'); return; }
    const allowed = role === 'admin' ? userRole === 'admin' : userRole === role;
    if (!allowed) navigate('/login');
  }, [userRole, loading, role, navigate]);
  if (loading) return null;
  return <>{children}</>;
}

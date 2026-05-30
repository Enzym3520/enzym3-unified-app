import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { portalFromHostname } from '@/lib/portalFromHostname';
export function RoleRouter() {
  const navigate = useNavigate();
  const { isAdmin, isVendor, isLoading, roles } = useUserRole();
  useEffect(() => {
    if (isLoading) return;
    const isAuthenticated = roles.length > 0;
    if (!isAuthenticated) { navigate('/login'); return; }
    const hp = portalFromHostname(window.location.hostname);
    if (hp === 'client' || (!hp && !isAdmin && !isVendor)) navigate('/app');
    else if (hp === 'staff' || (!hp && isAdmin)) navigate('/staff');
    else if (hp === 'vendor' || (!hp && isVendor)) navigate('/vendor');
    else navigate('/login');
  }, [isAdmin, isVendor, isLoading, roles, navigate]);
  return null;
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { portalFromHostname } from '@/lib/portalFromHostname';
export function RoleRouter() {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  useEffect(() => {
    if (loading) return;
    if (!role) { navigate('/login'); return; }
    const hp = portalFromHostname(window.location.hostname);
    if (hp === 'client' || (!hp && role === 'client')) navigate('/app');
    else if (hp === 'staff' || (!hp && role === 'admin')) navigate('/staff');
    else if (hp === 'vendor' || (!hp && role === 'vendor')) navigate('/vendor');
    else navigate('/login');
  }, [role, loading, navigate]);
  return null;
}

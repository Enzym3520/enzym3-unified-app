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
    if (isLoading || !allowed) {
      setFlagChecked(false);
      return;
    }
    let cancelled = false;

    const checkFlag = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { if (!cancelled) setFlagChecked(true); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('RequireRole: profiles query error', error);
        setFlagChecked(true);
        return;
      }
      if (data === null) {
        setFlagChecked(true);
        return;
      }
      if (data.must_change_password) {
        navigate('/change-password', { replace: true });
      } else {
        setFlagChecked(true);
      }
    };

    checkFlag();
    return () => { cancelled = true; };
  }, [isLoading, allowed, navigate, location.pathname]);

  useEffect(() => {
    if (isLoading || allowed) return;
    navigate('/login', { state: { from: location.pathname } });
  }, [isLoading, allowed, navigate, location.pathname]);

  if (isLoading || !allowed || !flagChecked) return null;
  return <>{children}</>;
}

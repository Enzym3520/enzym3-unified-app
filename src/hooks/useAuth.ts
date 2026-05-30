import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
interface AuthState { session: Session | null; user: User | null; loading: boolean; signOut: () => Promise<void>; }
interface AuthStateInternal { session: Session | null; user: User | null; loading: boolean; }
export function useAuth(): AuthState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthStateInternal>({ session: null, user: null, loading: true });
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') queryClient.clear();
      setState({ session: session ?? null, user: session?.user ?? null, loading: false });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => prev.loading ? { session: session ?? null, user: session?.user ?? null, loading: false } : prev);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);
  const signOut = async () => { await supabase.auth.signOut(); };
  return { ...state, signOut };
}

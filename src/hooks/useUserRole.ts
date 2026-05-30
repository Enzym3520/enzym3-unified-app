import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
export type UserRole = 'admin' | 'client' | 'vendor' | null;
export function useUserRole(): { role: UserRole; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const { data: role, isLoading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async (): Promise<UserRole> => {
      const { data: isAdmin } = await supabase.rpc('has_role', { role: 'admin' });
      if (isAdmin) return 'admin';
      const { data: isVendor } = await supabase.rpc('has_role', { role: 'vendor' });
      if (isVendor) return 'vendor';
      const { data: isClient } = await supabase.rpc('has_role', { role: 'client' });
      if (isClient) return 'client';
      return null;
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
  });
  return { role: role ?? null, loading: authLoading || isLoading };
}

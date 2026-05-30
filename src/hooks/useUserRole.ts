import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * ============================================================================
 * SECURITY WARNING - CLIENT-SIDE UI ONLY
 * ============================================================================
 * This hook fetches user roles for UI display purposes ONLY (showing/hiding 
 * menu items, conditional rendering). 
 * 
 * NEVER use these client-side role checks for authorization decisions!
 * 
 * All sensitive operations are protected server-side:
 * - Database operations: RLS policies check roles using has_role() function
 * - Edge Functions: Verify admin/moderator roles before executing operations
 *   (e.g., process-form-submission verifies admin role on lines 533-547)
 * 
 * Client-side role values can be manipulated by attackers - always verify
 * roles on the server before performing any privileged action.
 * ============================================================================
 */

// Cache for user roles to prevent excessive queries
const roleCache = new Map<string, { roles: string[], isVendor: boolean, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Clear the role cache so the next useUserRole call fetches fresh data. */
export function clearRoleCache() {
  roleCache.clear();
}

interface UserRoles {
  roles: string[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isUser: boolean;
  isVendor: boolean;
  isLoading: boolean;
}

export const useUserRole = (): UserRoles => {
  const [roles, setRoles] = useState<string[]>([]);
  const [isVendor, setIsVendor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoles([]);
          setIsVendor(false);
          setIsLoading(false);
          return;
        }

        // Check cache first
        const cached = roleCache.get(user.id);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setRoles(cached.roles);
          setIsVendor(cached.isVendor);
          setIsLoading(false);
          return;
        }

        // Combined query to fetch both roles and profile in one call
        const [rolesResult, profileResult] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', user.id).limit(10),
          supabase.from('profiles').select('role, vendor_type').eq('id', user.id).maybeSingle()
        ]);

        if (rolesResult.error) throw rolesResult.error;
        
        const userRoles = rolesResult.data?.map(r => r.role) || [];
        const isUserVendor = 
          profileResult.data?.role === 'vendor' || 
          profileResult.data?.role === 'dj' || 
          !!profileResult.data?.vendor_type;
        
        // Update cache
        roleCache.set(user.id, {
          roles: userRoles,
          isVendor: isUserVendor,
          timestamp: Date.now()
        });

        setRoles(userRoles);
        setIsVendor(isUserVendor);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching user roles:', error);
        setRoles([]);
        setIsVendor(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();

    // Subscribe to auth changes and invalidate cache
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Clear cache on auth changes
        if (session?.user) {
          roleCache.delete(session.user.id);
        }
        fetchRoles();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    roles,
    isSuperAdmin: roles.includes('super_admin'),
    isAdmin: roles.includes('admin') || roles.includes('super_admin'),
    isModerator: roles.includes('moderator'),
    isUser: roles.includes('user'),
    isVendor,
    isLoading,
  };
};

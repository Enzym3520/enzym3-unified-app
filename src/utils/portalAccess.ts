import { supabase } from '@/integrations/supabase/client';

const PORTAL_CHECK_TIMEOUT = 5000; // 5 seconds

/**
 * Checks whether the given user ID belongs to a staff/vendor account
 * that is allowed to access the Coordination Portal.
 *
 * Includes a 5-second timeout — if queries hang, access is denied.
 */
export async function isPortalUser(userId: string): Promise<boolean> {
  try {
    return await Promise.race([
      _checkPortalAccess(userId),
      new Promise<false>((resolve) =>
        setTimeout(() => {
          if (import.meta.env.DEV) console.warn('[isPortalUser] Timed out after 5s — denying');
          resolve(false);
        }, PORTAL_CHECK_TIMEOUT)
      ),
    ]);
  } catch (err) {
    if (import.meta.env.DEV) console.error('[isPortalUser] Unexpected error — denying access', err);
    return false;
  }
}

async function _checkPortalAccess(userId: string): Promise<boolean> {
  try {
    const { profile, userRoles } = await _fetchUserAccessData(userId);

    const hasStaffRole = userRoles.some((r) =>
      ['admin', 'super_admin', 'moderator'].includes(r)
    );
    if (hasStaffRole) return true;

    if (profile?.role === 'coordinator') return true;

    if (!!profile?.vendor_type) return true;

    return false;
  } catch (err) {
    if (import.meta.env.DEV) console.error('[isPortalUser] Query failed — denying access', err);
    return false;
  }
}

/**
 * Returns true if the user has a vendor_type but holds NO staff/coordinator roles.
 * These users should be redirected to the standalone Vendor App.
 */
export async function isVendorOnlyUser(userId: string): Promise<boolean> {
  try {
    const { profile, userRoles } = await _fetchUserAccessData(userId);

    // Not a vendor at all
    if (!profile?.vendor_type && profile?.role !== 'vendor' && profile?.role !== 'dj') {
      return false;
    }

    // Has staff roles → not vendor-only
    const hasStaffRole = userRoles.some((r) =>
      ['admin', 'super_admin', 'moderator'].includes(r)
    );
    if (hasStaffRole) return false;

    if (profile?.role === 'coordinator') return false;

    return true;
  } catch {
    return false;
  }
}

async function _fetchUserAccessData(userId: string): Promise<{
  profile: { role: string | null; vendor_type: string | null } | null;
  userRoles: string[];
}> {
  const [profileResult, rolesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, vendor_type')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(10),
  ]);

  return {
    profile: profileResult.data,
    userRoles: rolesResult.data?.map((r) => r.role) ?? [],
  };
}

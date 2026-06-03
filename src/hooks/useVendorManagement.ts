import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedVendor {
  id: string;
  name: string;
  email: string;
  vendorType: string;
  company?: string;
  status: 'active' | 'pending' | 'expired' | 'inactive';
  phone?: string;
  
  // For pending invites
  inviteCode?: string;
  inviteId?: string;
  expiresAt?: string;
  invitedAt?: string;
  
  // For registered vendors
  userId?: string;
  registeredAt?: string;
  lastActive?: string;
  isActive?: boolean;
  
  // Performance metrics
  averageRating?: number;
  totalReviews?: number;
  eventsCompleted?: number;
  
  // Computed
  avatarInitials: string;
}

interface UseVendorManagementOptions {
  scopeToCurrentUser?: boolean;
}

export const useVendorManagement = (options?: UseVendorManagementOptions) => {
  const scopeToCurrentUser = options?.scopeToCurrentUser ?? false;

  return useQuery({
    queryKey: ['vendor-management', scopeToCurrentUser],
    staleTime: 10 * 1000,
    queryFn: async () => {
      let currentUserId: string | null = null;

      if (scopeToCurrentUser) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id ?? null;
        if (!currentUserId) return [];
      }

      // Query invites — scoped if coordinator
      let invitesQuery = supabase
        .from('dj_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (scopeToCurrentUser && currentUserId) {
        invitesQuery = invitesQuery.eq('invited_by', currentUserId);
      }

      const { data: invites, error: invitesError } = await invitesQuery;
      if (invitesError) throw invitesError;

      // For scoped view, only fetch profiles that registered via this coordinator's invites
      let profiles: any[] = [];

      if (scopeToCurrentUser && currentUserId) {
        // Get user IDs of vendors who used this coordinator's invite codes
        const usedByIds = invites
          ?.filter(inv => inv.used_by)
          .map(inv => inv.used_by as string) ?? [];

        if (usedByIds.length > 0) {
          const { data: scopedProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*, average_rating, total_reviews, events_completed, vendor_types')
            .in('id', usedByIds)
            .order('created_at', { ascending: false })
            .limit(500);

          if (profilesError) throw profilesError;
          profiles = scopedProfiles ?? [];
        }
      } else {
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*, average_rating, total_reviews, events_completed, vendor_types')
          .not('vendor_type', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500);

        if (profilesError) throw profilesError;
        profiles = allProfiles ?? [];
      }

      const unifiedVendors: UnifiedVendor[] = [];

      // Add pending invites (not used yet)
      invites?.forEach((invite) => {
        if (!invite.used_at && invite.active) {
          const isExpired = invite.expires_at ? new Date(invite.expires_at) < new Date() : false;
          const name = invite.invited_first_name && invite.invited_last_name
            ? `${invite.invited_first_name} ${invite.invited_last_name}`
            : invite.name || invite.invited_email;

          unifiedVendors.push({
            id: invite.id,
            name,
            email: invite.invited_email || invite.email,
            vendorType: invite.vendor_type || invite.invited_role || 'vendor',
            company: invite.invited_company,
            status: isExpired ? 'expired' : 'pending',
            inviteCode: invite.code,
            inviteId: invite.id,
            expiresAt: invite.expires_at,
            invitedAt: invite.created_at,
            avatarInitials: name ? name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) : '??',
          });
        }
      });

      // Add registered vendors
      profiles?.forEach((profile) => {
        const name = profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.email;

        const matchingInvite = invites?.find(inv => inv.used_by === profile.id);

        unifiedVendors.push({
          id: profile.id,
          name,
          email: profile.email || '',
          vendorType: (profile.vendor_types?.length > 0 ? profile.vendor_types.join(', ') : profile.vendor_type) || profile.role || 'vendor',
          company: profile.company_name,
          status: profile.is_active ? 'active' : 'inactive',
          phone: profile.phone,
          userId: profile.id,
          registeredAt: profile.created_at,
          lastActive: profile.created_at,
          isActive: profile.is_active,
          inviteCode: matchingInvite?.code,
          invitedAt: matchingInvite?.created_at,
          averageRating: profile.average_rating,
          totalReviews: profile.total_reviews,
          eventsCompleted: profile.events_completed,
          avatarInitials: name ? name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) : '??',
        });
      });

      return unifiedVendors;
    },
  });
};

export const useVendorStats = (options?: UseVendorManagementOptions) => {
  const { data: vendors } = useVendorManagement(options);

  const stats = {
    total: vendors?.length || 0,
    active: vendors?.filter(v => v.status === 'active').length || 0,
    pending: vendors?.filter(v => v.status === 'pending').length || 0,
    expired: vendors?.filter(v => v.status === 'expired').length || 0,
    inactive: vendors?.filter(v => v.status === 'inactive').length || 0,
    byType: {} as Record<string, number>,
  };

  vendors?.forEach(vendor => {
    const type = vendor.vendorType;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return stats;
};

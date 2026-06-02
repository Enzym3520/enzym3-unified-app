import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';
import { safeFormatDate } from '@/utils/dateHelpers';

export interface DashboardStats {
  totalUsers: number;
  totalDJs: number;
  totalPlanners: number;
  totalEvents: number;
  upcomingEvents: number;
  pendingAssignments: number;
  activeVendors: number;
  pendingInvites: number;
}

export interface RecentEvent {
  id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
  status: string;
}

export interface PendingItem {
  id: string;
  type: 'assignment' | 'invite' | 'event';
  title: string;
  subtitle: string;
  date: string;
  action?: string;
}

async function fetchDashboardData() {
  // Count roles server-side to avoid 1000-row truncation
  const [{ count: adminCount }, { count: djCount }, { count: plannerCount }] = await Promise.all([
    supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'moderator'),
  ]);

  // Fetch total events
  const { count: eventCount } = await supabase
    .from('event_notification_history')
    .select('*', { count: 'exact', head: true });

  // Fetch upcoming events (next 30 days)
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = addDays(new Date(), 30).toISOString().split('T')[0];

  const { data: upcomingEventsData, count: upcomingCount } = await supabase
    .from('event_notification_history')
    .select('id, couple_name, event_date, event_type, venue, status', { count: 'exact' })
    .gte('event_date', today)
    .lte('event_date', thirtyDaysLater)
    .order('event_date', { ascending: true })
    .limit(5);

  // Fetch pending assignments
  const { count: pendingAssignmentsCount } = await supabase
    .from('event_dj_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'assigned');

  // Fetch active vendors
  const { count: activeVendorsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('vendor_type', 'is', null);

  // Fetch pending invites
  const { count: pendingInvitesCount } = await supabase
    .from('dj_codes')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)
    .is('used_at', null);

  // Build pending items list
  const items: PendingItem[] = [];

  const { data: pendingAssignments } = await supabase
    .from('event_dj_assignments')
    .select(`
      id, status, created_at,
      event_notification_history:event_id (couple_name, event_date)
    `)
    .eq('status', 'assigned')
    .limit(3);

  pendingAssignments?.forEach(a => {
    const event = a.event_notification_history as any;
    if (event) {
      items.push({
        id: a.id,
        type: 'assignment',
        title: `Pending confirmation: ${event.couple_name}`,
        subtitle: 'Vendor has not confirmed assignment',
        date: safeFormatDate(event.event_date, 'MMM d, yyyy'),
        action: '/staff/vendor-management',
      });
    }
  });

  const { data: pendingInvites } = await supabase
    .from('dj_codes')
    .select('id, invited_first_name, invited_last_name, invited_email, created_at')
    .eq('active', true)
    .is('used_at', null)
    .limit(3);

  pendingInvites?.forEach(inv => {
    items.push({
      id: inv.id,
      type: 'invite',
      title: `Pending: ${inv.invited_first_name || ''} ${inv.invited_last_name || ''}`.trim() || inv.invited_email || 'Unknown',
      subtitle: 'Has not registered yet',
      date: format(new Date(inv.created_at), 'MMM d, yyyy'),
      action: '/staff/vendor-management',
    });
  });

  const stats: DashboardStats = {
    totalUsers: (adminCount ?? 0) + (djCount ?? 0) + (plannerCount ?? 0),
    totalDJs: djCount ?? 0,
    totalPlanners: plannerCount ?? 0,
    totalEvents: eventCount ?? 0,
    upcomingEvents: upcomingCount ?? 0,
    pendingAssignments: pendingAssignmentsCount ?? 0,
    activeVendors: activeVendorsCount ?? 0,
    pendingInvites: pendingInvitesCount ?? 0,
  };

  return {
    stats,
    recentEvents: (upcomingEventsData || []) as RecentEvent[],
    pendingItems: items,
  };
}

export function useAdminDashboardData() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-data'],
    queryFn: fetchDashboardData,
  });

  return {
    stats: data?.stats ?? {
      totalUsers: 0, totalDJs: 0, totalPlanners: 0, totalEvents: 0,
      upcomingEvents: 0, pendingAssignments: 0, activeVendors: 0, pendingInvites: 0,
    },
    recentEvents: data?.recentEvents ?? [],
    pendingItems: data?.pendingItems ?? [],
    isLoading,
  };
}

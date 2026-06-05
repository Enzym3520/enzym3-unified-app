import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';

export interface RevenueData {
  month: string;
  revenue: number;
  profit: number;
  events: number;
}

export interface VendorPerformance {
  id: string;
  name: string;
  company: string;
  events_completed: number;
  total_revenue: number;
  average_rating: number;
  compliance_status: 'compliant' | 'attention' | 'non_compliant';
}

export interface EventTypeStats {
  event_type: string;
  count: number;
  revenue: number;
  profit: number;
}

export interface PaymentStatus {
  status: string;
  count: number;
  amount: number;
}

export const useAdminAnalytics = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['admin-analytics', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const start = startDate || subMonths(new Date(), 12);
      const end = endDate || new Date();

      // Fetch assignment costs with event and vendor details
      const { data: costs, error: costsError } = await supabase
        .from('assignment_costs')
        .select(`
          *,
          assignment:event_dj_assignments!inner(
            event:event_notification_history!inner(
              couple_name,
              event_date,
              event_type,
              venue
            ),
            vendor:profiles!dj_user_id(
              id,
              first_name,
              last_name,
              company_name,
              average_rating,
              events_completed
            )
          )
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .limit(2000);

      if (costsError) throw costsError;

      // Calculate revenue by month
      const revenueByMonth = new Map<string, { revenue: number; profit: number; events: number }>();
      
      costs?.forEach((cost: any) => {
        if (!cost.assignment?.event?.event_date) return;
        const month = format(parseLocalDate(cost.assignment.event.event_date), 'MMM yyyy');
        const existing = revenueByMonth.get(month) || { revenue: 0, profit: 0, events: 0 };
        
        revenueByMonth.set(month, {
          revenue: existing.revenue + Number(cost.total_client_price),
          profit: existing.profit + (Number(cost.total_client_price) - Number(cost.total_vendor_cost)),
          events: existing.events + 1,
        });
      });

      const revenueData: RevenueData[] = Array.from(revenueByMonth.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // Calculate totals
      const totalRevenue = costs?.reduce((sum, c) => sum + Number(c.total_client_price), 0) || 0;
      const totalProfit = costs?.reduce((sum, c) => sum + (Number(c.total_client_price) - Number(c.total_vendor_cost)), 0) || 0;
      const totalVendorCosts = costs?.reduce((sum, c) => sum + Number(c.total_vendor_cost), 0) || 0;

      // Calculate event type stats
      const eventTypeMap = new Map<string, { count: number; revenue: number; profit: number }>();
      
      costs?.forEach((cost: any) => {
        const type = cost.assignment.event.event_type;
        const existing = eventTypeMap.get(type) || { count: 0, revenue: 0, profit: 0 };
        
        eventTypeMap.set(type, {
          count: existing.count + 1,
          revenue: existing.revenue + Number(cost.total_client_price),
          profit: existing.profit + (Number(cost.total_client_price) - Number(cost.total_vendor_cost)),
        });
      });

      const eventTypeStats: EventTypeStats[] = Array.from(eventTypeMap.entries())
        .map(([event_type, data]) => ({ event_type, ...data }));

      // Calculate vendor performance
      const vendorMap = new Map<string, {
        name: string;
        company: string;
        events: number;
        revenue: number;
        rating: number;
      }>();

      costs?.forEach((cost: any) => {
        const vendor = cost.assignment.vendor;
        if (!vendor) return;

        const vendorId = vendor.id;
        const existing = vendorMap.get(vendorId) || {
          name: `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim(),
          company: vendor.company_name || 'N/A',
          events: 0,
          revenue: 0,
          rating: vendor.average_rating || 0,
        };

        vendorMap.set(vendorId, {
          ...existing,
          events: existing.events + 1,
          revenue: existing.revenue + Number(cost.total_vendor_cost),
        });
      });

      // Fetch vendor documents for compliance
      const { data: documents } = await supabase
        .from('vendor_documents')
        .select('vendor_id, expires_at, document_type')
        .limit(2000);

      const vendorCompliance = new Map<string, 'compliant' | 'attention' | 'non_compliant'>();
      
      if (documents) {
        const vendorDocs = new Map<string, any[]>();
        documents.forEach(doc => {
          const docs = vendorDocs.get(doc.vendor_id) || [];
          docs.push(doc);
          vendorDocs.set(doc.vendor_id, docs);
        });

        vendorDocs.forEach((docs, vendorId) => {
          const now = new Date();
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const hasExpired = docs.some(d => d.expires_at && new Date(d.expires_at) < now);
          const expiringSoon = docs.some(d => d.expires_at && new Date(d.expires_at) < thirtyDaysFromNow && new Date(d.expires_at) >= now);
          
          if (hasExpired) {
            vendorCompliance.set(vendorId, 'non_compliant');
          } else if (expiringSoon) {
            vendorCompliance.set(vendorId, 'attention');
          } else {
            vendorCompliance.set(vendorId, 'compliant');
          }
        });
      }

      const vendorPerformance: VendorPerformance[] = Array.from(vendorMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          company: data.company,
          events_completed: data.events,
          total_revenue: data.revenue,
          average_rating: data.rating,
          compliance_status: vendorCompliance.get(id) || 'compliant',
        }))
        .sort((a, b) => b.events_completed - a.events_completed);

      // Calculate payment status
      const paymentStatusMap = new Map<string, { count: number; amount: number }>();
      
      costs?.forEach((cost: any) => {
        const status = cost.payment_status;
        const existing = paymentStatusMap.get(status) || { count: 0, amount: 0 };
        
        paymentStatusMap.set(status, {
          count: existing.count + 1,
          amount: existing.amount + Number(cost.total_client_price),
        });
      });

      const paymentStatus: PaymentStatus[] = Array.from(paymentStatusMap.entries())
        .map(([status, data]) => ({ status, ...data }));

      return {
        revenueData,
        totalRevenue,
        totalProfit,
        totalVendorCosts,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        eventTypeStats,
        vendorPerformance,
        paymentStatus,
        totalEvents: costs?.length || 0,
      };
    },
  });
};

export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ['upcoming-events-report'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('event_notification_history')
        .select(`
          id,
          couple_name,
          event_date,
          event_type,
          venue,
          assignments:event_dj_assignments(count)
        `)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) throw error;

      return data?.map((event: any) => ({
        ...event,
        assignment_count: event.assignments?.[0]?.count || 0,
      })) || [];
    },
  });
};

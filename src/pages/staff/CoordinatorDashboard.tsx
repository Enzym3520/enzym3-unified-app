import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, TrendingUp, FileText, Users, Upload, List, Calendar, MapPin, Archive } from 'lucide-react';
import { UploadedFormsTable } from '@/components/staff/admin/UploadedFormsTable';
import { EventReadinessOverview } from '@/components/staff/dashboard/EventReadinessOverview';
import { EventListTab } from '@/components/staff/dashboard/EventListTab';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { safeFormatDate } from '@/utils/dateHelpers';
import { formatEventType } from '@/utils/notificationHelpers';

export const CoordinatorDashboard: React.FC = () => {
  const [timedOut, setTimedOut] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'deposit_paid' | 'awaiting_deposit' | 'venue_partner'>('all');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Fetch event notifications directly
  const { data: notifications, isLoading: loading } = useQuery({
    queryKey: ['coordinator-event-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  // 5-second timeout so dashboard never stalls forever
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setTimedOut(true), 5000);
      return () => clearTimeout(timer);
    }
    setTimedOut(false);
  }, [loading]);

  const showSkeleton = loading && !timedOut;
  // Stable reference so the downstream useMemo hooks don't recompute every render.
  const safeNotifications = useMemo(() => notifications ?? [], [notifications]);

  // Memoize dashboard stats calculation
  const dashboardStats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thisWeekSubmissions = safeNotifications.filter(n => {
      const createdAt = new Date(n.created_at);
      return createdAt >= weekAgo;
    }).length;

    const pendingEvents = safeNotifications.filter(n => n.status === 'submitted').length;

    return {
      totalSubmissions: safeNotifications.length,
      thisWeekSubmissions,
      pendingEvents
    };
  }, [safeNotifications]);

  // Memoize recent activity slice
  const recentActivity = useMemo(() =>
    safeNotifications.slice(0, 10),
    [safeNotifications]
  );

  // Filter notifications by payment status for the events tab
  const filteredNotifications = useMemo(() => {
    if (paymentFilter === 'deposit_paid') return safeNotifications.filter(n => n.deposit_paid);
    if (paymentFilter === 'awaiting_deposit') return safeNotifications.filter(n => !n.deposit_paid && n.booking_source !== 'venue_partner');
    if (paymentFilter === 'venue_partner') return safeNotifications.filter(n => n.booking_source === 'venue_partner');
    return safeNotifications;
  }, [safeNotifications, paymentFilter]);

  const pastEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return safeNotifications.filter(n => n.event_date && n.event_date < today);
  }, [safeNotifications]);

  if (showSkeleton) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-6">
      {/* PortalTour: Plan 4 — stub placeholder */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2">Event Planner Dashboard</h1>
        <p className="text-muted-foreground">Manage event notifications and assignments</p>
      </div>

      {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-luxury">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{dashboardStats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.thisWeekSubmissions} this week
              </p>
            </CardContent>
          </Card>

          <Card className="card-luxury">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{dashboardStats.thisWeekSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                New submissions
              </p>
            </CardContent>
          </Card>

          <Card className="card-luxury">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Events</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">
                {dashboardStats.pendingEvents}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting action
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Event Details
            </TabsTrigger>
            <TabsTrigger value="uploads" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Uploaded Forms
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Past Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="card-luxury">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? undefined : 'p-0'}>
                {recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No recent activity</p>
                ) : isMobile ? (
                  <div className="space-y-2">
                    {recentActivity.map((n) => (
                      <Card
                        key={n.id}
                        className="cursor-pointer active:bg-muted/50"
                        onClick={() => navigate(`/staff/event/${n.id}`)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{n.couple_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {formatEventType(n.event_type)}
                              </p>
                            </div>
                            <Badge variant={
                              n.status === 'completed' ? 'default' :
                              n.status === 'in_progress' ? 'secondary' : 'outline'
                            } className="shrink-0 text-xs">
                              {n.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {safeFormatDate(n.event_date, 'MMM d, yyyy', '—')}
                            </span>
                            {n.venue && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[140px]">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {n.venue}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Venue</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentActivity.map((n) => (
                          <TableRow
                            key={n.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/staff/event/${n.id}`)}
                          >
                            <TableCell className="font-medium">{n.couple_name || 'Unknown'}</TableCell>
                            <TableCell>{formatEventType(n.event_type)}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {safeFormatDate(n.event_date, 'MMM d, yyyy', '—')}
                              </span>
                            </TableCell>
                            <TableCell>
                              {n.venue ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {n.venue}
                                </span>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                n.status === 'completed' ? 'default' :
                                n.status === 'in_progress' ? 'secondary' : 'outline'
                              }>
                                {n.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="card-luxury">
              <CardHeader>
                <CardTitle>All Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment filter chips */}
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'all', label: 'All' },
                    { value: 'deposit_paid', label: 'Deposit Paid' },
                    { value: 'awaiting_deposit', label: 'Awaiting Deposit' },
                    { value: 'venue_partner', label: 'Venue Partner' },
                  ] as const).map(({ value, label }) => (
                    <Badge
                      key={value}
                      onClick={() => setPaymentFilter(value)}
                      className={
                        paymentFilter === value
                          ? 'cursor-pointer bg-primary text-primary-foreground border-primary'
                          : 'cursor-pointer bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      }
                    >
                      {label}
                      {value !== 'all' && (
                        <span className="ml-1 opacity-70">
                          ({value === 'deposit_paid'
                            ? safeNotifications.filter(n => n.deposit_paid).length
                            : value === 'awaiting_deposit'
                            ? safeNotifications.filter(n => !n.deposit_paid && n.booking_source !== 'venue_partner').length
                            : safeNotifications.filter(n => n.booking_source === 'venue_partner').length})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
                <EventListTab externalEvents={filteredNotifications} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploads">
            <Card className="card-luxury">
              <CardHeader>
                <CardTitle>Uploaded Details Forms</CardTitle>
              </CardHeader>
              <CardContent>
                <UploadedFormsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card className="card-luxury">
              <CardHeader>
                <CardTitle>Past Events ({pastEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <EventListTab externalEvents={pastEvents} />
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>

      {/* Readiness Overview */}
      <EventReadinessOverview />
    </div>
  );
};

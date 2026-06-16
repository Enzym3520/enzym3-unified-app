import { useState } from 'react';
import { subMonths } from 'date-fns';
import { useAdminAnalytics, useUpcomingEvents } from '@/hooks/useAdminAnalytics';
import { useEventPostReports } from '@/hooks/useEventPostReports';
import { SummaryCards } from '@/components/staff/reporting/SummaryCards';
import { RevenueChart } from '@/components/staff/reporting/RevenueChart';
import { ProfitByEventTypeChart } from '@/components/staff/reporting/ProfitByEventTypeChart';
import { PaymentStatusChart } from '@/components/staff/reporting/PaymentStatusChart';
import { TopVendorsTable } from '@/components/staff/reporting/TopVendorsTable';
import { EventTrendsChart } from '@/components/staff/reporting/EventTrendsChart';
import { UpcomingEventsTable } from '@/components/staff/reporting/UpcomingEventsTable';
import { EventTypeDistribution } from '@/components/staff/reporting/EventTypeDistribution';
import { DateRangeSelector } from '@/components/staff/reporting/DateRangeSelector';
import { VendorLeaderboard } from '@/components/staff/reporting/VendorLeaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Star, MapPin, Music, ClipboardCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{value > 0 ? value.toFixed(1) : '—'}</span>
    </div>
  );
}

function EventIntelligencePanel() {
  const { reports, loading } = useEventPostReports();

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const filedCount = reports.length;

  // --- Venue Intelligence ---
  const venueMap: Record<string, { sound: number[]; lighting: number[]; wouldBook: boolean[]; count: number }> = {};
  reports.forEach(r => {
    // We need the venue name — it's on the notification, not the report
    // We'll aggregate by report data only (no venue name in report table); skip if no data
    if (!r.venue_sound_rating && !r.venue_lighting_rating) return;
    const key = `report-${r.event_id.slice(0, 8)}`; // fallback key
    if (!venueMap[key]) venueMap[key] = { sound: [], lighting: [], wouldBook: [], count: 0 };
    if (r.venue_sound_rating) venueMap[key].sound.push(r.venue_sound_rating);
    if (r.venue_lighting_rating) venueMap[key].lighting.push(r.venue_lighting_rating);
    if (r.would_book_venue_again !== null) venueMap[key].wouldBook.push(r.would_book_venue_again!);
    venueMap[key].count++;
  });

  // --- Music Trends ---
  const genreCounts: Record<string, number> = {};
  const hitSongCounts: Record<string, number> = {};
  reports.forEach(r => {
    (r.top_genres ?? []).forEach(g => { genreCounts[g] = (genreCounts[g] ?? 0) + 1; });
    (r.hit_songs ?? []).forEach(s => { hitSongCounts[s] = (hitSongCounts[s] ?? 0) + 1; });
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([genre, count]) => ({ genre, count }));

  const topHitSongs = Object.entries(hitSongCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // --- Energy by event type (we don't have event_type in post_reports, so show overall) ---
  const avgEnergy = reports.filter(r => r.energy_level).reduce((sum, r) => sum + (r.energy_level ?? 0), 0) / (reports.filter(r => r.energy_level).length || 1);
  const avgSound = reports.filter(r => r.venue_sound_rating).reduce((sum, r) => sum + (r.venue_sound_rating ?? 0), 0) / (reports.filter(r => r.venue_sound_rating).length || 1);
  const avgLighting = reports.filter(r => r.venue_lighting_rating).reduce((sum, r) => sum + (r.venue_lighting_rating ?? 0), 0) / (reports.filter(r => r.venue_lighting_rating).length || 1);
  const wouldBookAgainPct = reports.filter(r => r.would_book_venue_again !== null).length > 0
    ? Math.round((reports.filter(r => r.would_book_venue_again === true).length / reports.filter(r => r.would_book_venue_again !== null).length) * 100)
    : null;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (filedCount === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Post-Event Reports Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Intelligence builds up as coordinators file post-event reports. Reports can be filed from the{' '}
            <Link to="/staff/notification-history" className="text-primary underline-offset-2 hover:underline">Notification History</Link>{' '}
            page after an event has passed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Reports Filed</p>
            <p className="text-3xl font-bold text-primary">{filedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Energy Level</p>
            <p className="text-3xl font-bold">{avgEnergy > 0 ? avgEnergy.toFixed(1) : '—'}<span className="text-lg text-muted-foreground">/10</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Would Book Again</p>
            <p className="text-3xl font-bold">{wouldBookAgainPct !== null ? `${wouldBookAgainPct}%` : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Sound / Lighting</p>
            <div className="flex gap-3 mt-1">
              <StarDisplay value={avgSound} />
              <StarDisplay value={avgLighting} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Music Trends */}
      {topGenres.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="w-4 h-4" />
              Top Genres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topGenres} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="genre" tick={{ fontSize: 12 }} width={110} />
                  <Tooltip formatter={(v) => [`${v} events`, 'Played at']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {topGenres.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hit Songs */}
      {topHitSongs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Most-Cited Hit Songs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topHitSongs.map(([song, count]) => (
                <Badge key={song} variant="secondary" className="flex items-center gap-1.5 px-3 py-1 text-sm">
                  🔥 {song}
                  <span className="text-muted-foreground font-normal">×{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Venue ratings summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Venue Performance Averages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sound System</p>
              <StarDisplay value={avgSound} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lighting</p>
              <StarDisplay value={avgLighting} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Would Book Again</p>
              <p className="font-semibold">{wouldBookAgainPct !== null ? `${wouldBookAgainPct}%` : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportingDashboard() {
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 12));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: analytics, isLoading } = useAdminAnalytics(startDate, endDate);
  const { data: upcomingEvents, isLoading: isLoadingEvents } = useUpcomingEvents();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">Reporting & Analytics</h1>
        <p className="text-muted-foreground">Comprehensive business intelligence dashboard</p>
      </div>

      <Tabs defaultValue="financial">
        <TabsList className="mb-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Event Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          <SummaryCards
            totalRevenue={analytics.totalRevenue}
            totalProfit={analytics.totalProfit}
            profitMargin={analytics.profitMargin}
            totalEvents={analytics.totalEvents}
            activeVendors={analytics.vendorPerformance.length}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <RevenueChart data={analytics.revenueData} />
            <ProfitByEventTypeChart data={analytics.eventTypeStats} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <EventTrendsChart data={analytics.revenueData} />
            <EventTypeDistribution data={analytics.eventTypeStats} />
          </div>

          <PaymentStatusChart data={analytics.paymentStatus} />

          <TopVendorsTable vendors={analytics.vendorPerformance} limit={10} />

          {!isLoadingEvents && upcomingEvents && (
            <UpcomingEventsTable events={upcomingEvents} />
          )}

          <VendorLeaderboard limit={10} />
        </TabsContent>

        <TabsContent value="intelligence">
          <EventIntelligencePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

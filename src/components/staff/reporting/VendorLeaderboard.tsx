import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useLeaderboard, type LeaderboardMetric } from '@/hooks/useLeaderboard';
import { useRecentAchievements } from '@/hooks/useVendorAchievements';
// AchievementBadge is a Plan 4 component — stubbed until implemented
import { Trophy, Calendar, Star, Flame, Award } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface VendorLeaderboardProps {
  limit?: number;
}

export function VendorLeaderboard({ limit = 10 }: VendorLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardMetric>('events');
  const { data: leaderboard, isLoading } = useLeaderboard(activeTab, limit);
  const { data: recentAchievements } = useRecentAchievements(5);
  const isMobile = useIsMobile();

  const getMetricLabel = (metric: LeaderboardMetric) => {
    switch (metric) {
      case 'events': return 'Events';
      case 'rating': return 'Rating';
      case 'streak': return 'Streak (months)';
      case 'reviews': return 'Reviews';
      default: return 'Value';
    }
  };

  const formatValue = (value: number, metric: LeaderboardMetric) => {
    if (metric === 'rating') return value.toFixed(1);
    return value.toString();
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400/20 text-gray-400 border-gray-400/30">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600/20 text-amber-600 border-amber-600/30">🥉 3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Vendor Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardMetric)}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="events" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {!isMobile && 'Events'}
              </TabsTrigger>
              <TabsTrigger value="rating" className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {!isMobile && 'Rating'}
              </TabsTrigger>
              <TabsTrigger value="streak" className="flex items-center gap-1">
                <Flame className="h-4 w-4" />
                {!isMobile && 'Streak'}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                {!isMobile && 'Reviews'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : isMobile ? (
                <div className="space-y-2">
                  {leaderboard?.map((entry) => (
                    <div key={entry.vendor_id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getRankBadge(entry.rank)}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{entry.company_name || entry.vendor_name}</p>
                          {entry.company_name && (
                            <p className="text-xs text-muted-foreground truncate">{entry.vendor_name}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold shrink-0">{formatValue(entry.value, activeTab)}</span>
                    </div>
                  ))}
                  {(!leaderboard || leaderboard.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No vendor stats available yet</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rank</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">{getMetricLabel(activeTab)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard?.map((entry) => (
                      <TableRow key={entry.vendor_id}>
                        <TableCell>{getRankBadge(entry.rank)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {entry.company_name || entry.vendor_name}
                            </p>
                            {entry.company_name && (
                              <p className="text-xs text-muted-foreground">{entry.vendor_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatValue(entry.value, activeTab)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!leaderboard || leaderboard.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No vendor stats available yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements && recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-primary" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement: any) => {
                const vendorName = achievement.vendor?.company_name ||
                  [achievement.vendor?.first_name, achievement.vendor?.last_name].filter(Boolean).join(' ') ||
                  'Unknown Vendor';

                return (
                  <div
                    key={achievement.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span>{achievement.achievement_name}</span>
                      <div>
                        <p className="font-medium">{vendorName}</p>
                        <p className="text-sm text-muted-foreground">
                          earned <span className="font-medium">{achievement.achievement_name}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(achievement.earned_at), 'MMM d')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorStatsWithProfile } from "@/hooks/use-vendor-stats";
import { useAchievements, ACHIEVEMENT_ICONS, ACHIEVEMENT_COLORS } from "@/hooks/use-achievements";
import { AchievementBadgeList } from "./AchievementBadge";
import { Star, Calendar, Flame, Trophy, ThumbsUp, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VendorStatCardProps {
  vendorId: string;
  compact?: boolean;
}

export function VendorStatCard({ vendorId, compact = false }: VendorStatCardProps) {
  const { data, isLoading } = useVendorStatsWithProfile(vendorId);
  const { data: achievements = [] } = useAchievements(vendorId);

  if (isLoading) return <Card><CardHeader className="pb-2"><Skeleton className="h-6 w-48" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-16 w-full" /></CardContent></Card>;

  const stats = data?.stats;
  const profile = data?.profile;
  const vendorName = profile?.company_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Vendor";
  const totalEvents = stats?.total_events ?? profile?.events_completed ?? 0;
  const rating = profile?.average_rating ?? 0;
  const reviews = profile?.total_reviews ?? 0;

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /><span className="font-semibold">{rating.toFixed(1)}</span></div>
              <div className="flex items-center gap-1 text-muted-foreground"><ThumbsUp className="h-4 w-4" /><span>{reviews} reviews</span></div>
              <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-4 w-4" /><span>{totalEvents} events</span></div>
              {stats?.current_event_streak && stats.current_event_streak > 0 && (
                <div className="flex items-center gap-1 text-orange-500"><Flame className="h-4 w-4" /><span>{stats.current_event_streak}mo streak</span></div>
              )}
            </div>
            {achievements.length > 0 && <AchievementBadgeList achievements={achievements} size="sm" maxVisible={3} />}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />{vendorName}'s Career Stats</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1"><div className="flex items-center justify-center gap-1"><Star className="h-5 w-5 text-yellow-500" /><span className="text-2xl font-bold">{rating.toFixed(1)}</span></div><p className="text-xs text-muted-foreground">Rating</p></div>
          <div className="space-y-1"><div className="flex items-center justify-center gap-1"><ThumbsUp className="h-5 w-5 text-primary" /><span className="text-2xl font-bold">{reviews}</span></div><p className="text-xs text-muted-foreground">Reviews</p></div>
          <div className="space-y-1"><div className="flex items-center justify-center gap-1"><Calendar className="h-5 w-5 text-green-500" /><span className="text-2xl font-bold">{totalEvents}</span></div><p className="text-xs text-muted-foreground">Events</p></div>
        </div>

        {stats && totalEvents > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Events by Type</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {stats.total_weddings > 0 && <div className="flex items-center gap-2 p-2 rounded-md bg-pink-500/10"><span>💒</span><span>Weddings: {stats.total_weddings}</span></div>}
              {stats.total_quinces > 0 && <div className="flex items-center gap-2 p-2 rounded-md bg-purple-500/10"><span>👑</span><span>Quinces: {stats.total_quinces}</span></div>}
              {stats.total_birthdays > 0 && <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10"><span>🎂</span><span>Birthdays: {stats.total_birthdays}</span></div>}
              {stats.total_corporate > 0 && <div className="flex items-center gap-2 p-2 rounded-md bg-slate-500/10"><span>🏢</span><span>Corporate: {stats.total_corporate}</span></div>}
              {stats.total_other > 0 && <div className="flex items-center gap-2 p-2 rounded-md bg-gray-500/10"><span>🎉</span><span>Other: {stats.total_other}</span></div>}
            </div>
          </div>
        )}

        {stats && (stats.current_event_streak > 0 || stats.longest_event_streak > 0) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Streaks</h4>
            <div className="flex gap-4">
              {stats.current_event_streak > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <div><p className="font-semibold">{stats.current_event_streak} months</p><p className="text-xs text-muted-foreground">Current Streak</p></div>
                </div>
              )}
              {stats.longest_event_streak > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div><p className="font-semibold">{stats.longest_event_streak} months</p><p className="text-xs text-muted-foreground">Best Streak</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {stats && stats.confirmation_count > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Reliability</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-cyan-500" /><span>Avg. confirmation: {stats.avg_confirmation_hours.toFixed(1)}hrs</span></div>
              {stats.five_star_count > 0 && <div className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-yellow-500" /><span>{stats.five_star_count} five-star reviews</span></div>}
            </div>
          </div>
        )}

        {achievements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Achievements</h4>
            <AchievementBadgeList achievements={achievements} size="md" maxVisible={6} />
          </div>
        )}

        {stats?.first_event_date && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Member since {format(new Date(stats.first_event_date), "MMMM yyyy")}
            {stats.last_event_date && <> · Last event {format(new Date(stats.last_event_date), "MMM d, yyyy")}</>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

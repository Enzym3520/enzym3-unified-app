import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpcomingReadiness, getReadinessLevel, EventReadiness } from '@/hooks/useEventReadiness';
import { safeFormatDate } from '@/utils/dateHelpers';

const levelIcons = {
  green: CheckCircle2,
  yellow: Clock,
  red: AlertCircle,
};

const levelColors = {
  green: 'text-emerald-600 dark:text-emerald-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  red: 'text-destructive',
};

const levelBg = {
  green: 'bg-emerald-50 dark:bg-emerald-900/20',
  yellow: 'bg-amber-50 dark:bg-amber-900/20',
  red: 'bg-red-50 dark:bg-red-900/20',
};

export const EventReadinessOverview: React.FC = () => {
  const { data: events, isLoading } = useUpcomingReadiness(10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Upcoming Event Readiness</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-32" /></CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Upcoming Event Readiness</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Upcoming Event Readiness</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map((event) => {
            const level = getReadinessLevel(event);
            const Icon = levelIcons[level];
            const checks = [event.contract_signed, event.deposit_paid, event.vendor_confirmed, event.music_sheet_submitted];
            const passed = checks.filter(Boolean).length;

            return (
              <Link
                key={event.event_id}
                to={`/staff/event/${event.event_id}`}
                className={`flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity ${levelBg[level]}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${levelColors[level]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.couple_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {safeFormatDate(event.event_date, 'MMM d, yyyy', '')}
                    {event.venue && ` • ${event.venue}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">{passed}/4</Badge>
                  {event.days_until_event != null && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {event.days_until_event === 0 ? 'Today' :
                       event.days_until_event === 1 ? 'Tomorrow' :
                       `${event.days_until_event}d`}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

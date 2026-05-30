import { useState } from 'react';
import { Calendar, CalendarCheck, AlertCircle, Users, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventCalendar } from '@/components/staff/calendar/EventCalendar';
import { ScheduleMeetingModal } from '@/components/staff/calendar/ScheduleMeetingModal';
import { useCalendarStats } from '@/hooks/useCalendarEvents';
import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarPage() {
  const { data: stats, isLoading: statsLoading } = useCalendarStats(new Date());
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Event Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all scheduled events
          </p>
        </div>
        <Button onClick={() => setScheduleMeetingOpen(true)} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events This Week</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.eventsThisWeek || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Upcoming events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Vendors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.unassigned || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Unassigned events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.pendingConfirmation || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Awaiting vendor response</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Component */}
      <EventCalendar />

      {/* Schedule Meeting Modal (no pre-filled couple — admin picks from selector) */}
      <ScheduleMeetingModal
        isOpen={scheduleMeetingOpen}
        onClose={() => setScheduleMeetingOpen(false)}
      />
    </div>
  );
}

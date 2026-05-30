import React from 'react';
import { Clock, Send, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReminderStats as ReminderStatsType } from '@/types/reminder';

interface ReminderStatsProps {
  stats: ReminderStatsType;
}

const ReminderStats = ({ stats }: ReminderStatsProps) => {
  const statCards = [
    {
      title: 'Total Reminders',
      value: stats.totalReminders,
      icon: Calendar,
      colorClass: 'text-muted-foreground',
    },
    {
      title: 'Pending',
      value: stats.pendingReminders,
      icon: Clock,
      colorClass: 'text-muted-foreground',
    },
    {
      title: 'Sent',
      value: stats.sentReminders,
      icon: Send,
      colorClass: 'text-muted-foreground',
    },
    {
      title: 'Overdue',
      value: stats.overdueReminders,
      icon: AlertTriangle,
      colorClass: 'text-muted-foreground',
    },
    {
      title: 'Upcoming',
      value: stats.upcomingReminders,
      icon: CheckCircle2,
      colorClass: 'text-muted-foreground',
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.colorClass}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReminderStats;
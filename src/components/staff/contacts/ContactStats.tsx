import React from 'react';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactStats as ContactStatsType } from '@/types/contact';

interface ContactStatsProps {
  stats: ContactStatsType;
}

const ContactStats = ({ stats }: ContactStatsProps) => {
  const statItems = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Active Clients',
      value: stats.activeClients,
      icon: UserCheck,
      color: 'text-green-600'
    },
    {
      title: 'Past Clients',
      value: stats.pastClients,
      icon: UserX,
      color: 'text-gray-600'
    },
    {
      title: 'Avg Events/Client',
      value: stats.avgEventsPerClient.toFixed(1),
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ContactStats;
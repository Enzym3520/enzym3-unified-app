import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, XCircle, UserX } from 'lucide-react';
import { useVendorStats } from '@/hooks/useVendorManagement';

interface VendorStatsProps {
  scopeToCurrentUser?: boolean;
}

export function VendorStats({ scopeToCurrentUser }: VendorStatsProps) {
  const stats = useVendorStats({ scopeToCurrentUser });

  const statCards = [
    { title: 'Total Vendors', value: stats.total, icon: Users, color: 'text-primary' },
    { title: 'Active', value: stats.active, icon: UserCheck, color: 'text-green-600' },
    { title: 'Pending Invites', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
    { title: 'Expired', value: stats.expired, icon: XCircle, color: 'text-red-600' },
    { title: 'Inactive', value: stats.inactive, icon: UserX, color: 'text-muted-foreground' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

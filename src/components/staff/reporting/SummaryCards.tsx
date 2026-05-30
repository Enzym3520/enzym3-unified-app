import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';

interface SummaryCardsProps {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  totalEvents: number;
  activeVendors: number;
}

export function SummaryCards({
  totalRevenue,
  totalProfit,
  profitMargin,
  totalEvents,
  activeVendors,
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Profit',
      value: `$${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Profit Margin',
      value: `${profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Total Events',
      value: totalEvents.toString(),
      icon: Calendar,
      color: 'text-orange-600',
    },
    {
      title: 'Active Vendors',
      value: activeVendors.toString(),
      icon: Users,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { EventTypeStats } from '@/hooks/useAdminAnalytics';
import { formatEventType } from '@/utils/notificationHelpers';

interface EventTypeDistributionProps {
  data: EventTypeStats[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function EventTypeDistribution({ data }: EventTypeDistributionProps) {
  const chartData = data.map(d => ({
    name: formatEventType(d.event_type),
    value: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

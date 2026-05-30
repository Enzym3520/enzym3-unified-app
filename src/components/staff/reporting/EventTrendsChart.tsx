import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RevenueData } from '@/hooks/useAdminAnalytics';

interface EventTrendsChartProps {
  data: RevenueData[];
}

export function EventTrendsChart({ data }: EventTrendsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Volume Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="events" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.6}
              name="Events"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

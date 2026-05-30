import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EventTypeStats } from '@/hooks/useAdminAnalytics';
import { formatEventType } from '@/utils/notificationHelpers';

interface ProfitByEventTypeChartProps {
  data: EventTypeStats[];
}

export function ProfitByEventTypeChart({ data }: ProfitByEventTypeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit by Event Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event_type" tickFormatter={formatEventType} />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
            <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RevenueData } from '@/hooks/useAdminAnalytics';

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Profit Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Profit"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

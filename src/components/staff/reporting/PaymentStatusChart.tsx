import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { PaymentStatus } from '@/hooks/useAdminAnalytics';

interface PaymentStatusChartProps {
  data: PaymentStatus[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

const STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  paid_to_vendor: 'Paid to Vendor',
  collected_from_client: 'Collected from Client',
  fully_paid: 'Fully Paid',
};

export function PaymentStatusChart({ data }: PaymentStatusChartProps) {
  const chartData = data.map(d => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: d.amount,
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

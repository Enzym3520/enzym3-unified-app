import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpgradeOrderWithWedding } from '@/types/upgradeOrder';
import { UPGRADE_PACKAGES } from '@/config/upgradePackages';
import { DollarSign, Package, TrendingUp } from 'lucide-react';

interface UpgradeStatsProps {
  orders: UpgradeOrderWithWedding[];
}

export function UpgradeStats({ orders }: UpgradeStatsProps) {
  const totalRevenue = orders.reduce((sum, order) => {
    const price = UPGRADE_PACKAGES[order.selected_package]?.price || 0;
    return sum + price;
  }, 0);

  const packageCounts = orders.reduce((acc, order) => {
    acc[order.selected_package] = (acc[order.selected_package] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paidOrders = orders.filter(o => o.payment_status === 'paid').length;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orders.length}</div>
          <p className="text-xs text-muted-foreground">
            {paidOrders} paid / {orders.length - paidOrders} pending
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From all upgrade packages</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Package Breakdown</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            {Object.entries(packageCounts).map(([pkg, count]) => (
              <div key={pkg} className="flex justify-between">
                <span className="text-muted-foreground">{pkg}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

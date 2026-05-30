import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { UpgradeOrderWithWedding, PaymentStatus } from '@/types/upgradeOrder';
import { UPGRADE_PACKAGES } from '@/config/upgradePackages';
import { safeFormatDate } from '@/utils/dateHelpers';
import { useIsMobile } from '@/hooks/use-mobile';

interface UpgradeOrdersTableProps {
  orders: UpgradeOrderWithWedding[];
  onOrderClick: (order: UpgradeOrderWithWedding) => void;
}

export function UpgradeOrdersTable({ orders, onOrderClick }: UpgradeOrdersTableProps) {
  const isMobile = useIsMobile();

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'default';
      case 'draft':
        return 'secondary';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No upgrade orders found</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.map((order) => {
          const wedding = order.event_notification_history;
          const packageInfo = UPGRADE_PACKAGES[order.selected_package];
          return (
            <Card key={order.id} className="p-4 cursor-pointer active:bg-muted/50" onClick={() => onOrderClick(order)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{wedding.couple_name}</p>
                  <p className="text-sm text-muted-foreground">{safeFormatDate(wedding.event_date, 'MMM d, yyyy')}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs">{order.selected_package}</Badge>
                    <span className="text-sm font-medium">${packageInfo.price}</span>
                  </div>
                </div>
                <Badge variant={getStatusColor(order.payment_status)}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Event Date</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const wedding = order.event_notification_history;
            const packageInfo = UPGRADE_PACKAGES[order.selected_package];
            
            return (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onOrderClick(order)}
              >
                <TableCell className="font-medium">{wedding.couple_name}</TableCell>
                <TableCell>{safeFormatDate(wedding.event_date, 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-muted-foreground">
                  {wedding.venue || 'N/A'}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{order.selected_package}</span>
                  {order.selected_package === 'Emerald' && order.emerald_choice && (
                    <span className="text-xs text-muted-foreground block">
                      {order.emerald_choice}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium">${packageInfo.price}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(order.payment_status)}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {safeFormatDate(order.created_at, 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

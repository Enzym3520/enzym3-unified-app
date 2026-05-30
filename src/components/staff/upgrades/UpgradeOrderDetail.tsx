import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UpgradeOrderWithWedding, PaymentStatus } from '@/types/upgradeOrder';
import { UPGRADE_PACKAGES } from '@/config/upgradePackages';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { safeFormatDate } from '@/utils/dateHelpers';
import { Calendar, Mail, MapPin, Phone, User, Users } from 'lucide-react';
import { capitalizeNames } from '@/utils/contactHelpers';

interface UpgradeOrderDetailProps {
  order: UpgradeOrderWithWedding | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePaymentStatus: (id: string, status: PaymentStatus) => void;
}

export function UpgradeOrderDetail({
  order,
  isOpen,
  onClose,
  onUpdatePaymentStatus,
}: UpgradeOrderDetailProps) {
  if (!order) return null;

  const wedding = order.event_notification_history;
  const packageInfo = UPGRADE_PACKAGES[order.selected_package];

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wedding Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Wedding Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-sm text-muted-foreground">{capitalizeNames(wedding.couple_name || 'Unknown')}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Event Date</p>
                  <p className="text-sm text-muted-foreground">
                    {safeFormatDate(wedding.event_date, 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {wedding.venue && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Venue</p>
                    <p className="text-sm text-muted-foreground">{wedding.venue}</p>
                  </div>
                </div>
              )}

              {wedding.guest_count && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Guest Count</p>
                    <p className="text-sm text-muted-foreground">{wedding.guest_count}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{wedding.contact_email}</p>
                </div>
              </div>

              {wedding.contact_phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{wedding.contact_phone}</p>
                  </div>
                </div>
              )}

              {wedding.coordinator_name && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Coordinator</p>
                    <p className="text-sm text-muted-foreground">{capitalizeNames(wedding.coordinator_name || '')}</p>
                  </div>
                </div>
              )}

              {wedding.dj_name && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">DJ</p>
                    <p className="text-sm text-muted-foreground">{capitalizeNames(wedding.dj_name || '')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Package Info */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-lg font-semibold">Upgrade Package</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{order.selected_package} Package</p>
                <p className="text-2xl font-bold">${packageInfo.price}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Includes:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {packageInfo.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            {order.selected_package === 'Emerald' && order.emerald_choice && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Selected Option:</p>
                <p className="text-sm text-muted-foreground">{order.emerald_choice}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-lg font-semibold">Customer Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Payment Status */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-lg font-semibold">Payment Status</h3>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="payment-status">Status</Label>
                <Select
                  value={order.payment_status}
                  onValueChange={(value) => onUpdatePaymentStatus(order.id, value as PaymentStatus)}
                >
                  <SelectTrigger id="payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Current Status</Label>
                <div className="mt-2">
                  <Badge variant={getStatusColor(order.payment_status)}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Request submitted: {safeFormatDate(order.created_at, 'PPp')}</p>
              <p>Last updated: {safeFormatDate(order.updated_at, 'PPp')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

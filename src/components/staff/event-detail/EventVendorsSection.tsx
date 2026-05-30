import React, { useState } from 'react';
import { Users, UserPlus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventAssignments, useCancelAssignment } from '@/hooks/useAdminAssignments';
import { formatVendorType } from '@/utils/vendorTypeFormatter';
import { Skeleton } from '@/components/ui/skeleton';
import AssignVendorModal from '@/components/staff/vendor-management/AssignVendorModal';

interface EventVendorsSectionProps {
  eventId: string;
  eventDate: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  assigned: { icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
  confirmed: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  completed: { icon: CheckCircle2, color: 'text-primary' },
  declined: { icon: XCircle, color: 'text-destructive' },
};

export const EventVendorsSection: React.FC<EventVendorsSectionProps> = ({ eventId, eventDate }) => {
  const { data: assignments, isLoading } = useEventAssignments(eventId);
  const cancelAssignment = useCancelAssignment();
  const [showAssignModal, setShowAssignModal] = useState(false);

  if (isLoading) return <Card><CardContent className="py-6"><Skeleton className="h-20" /></CardContent></Card>;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Assigned Vendors
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAssignModal(true)}>
              <UserPlus className="w-4 h-4 mr-1" /> Assign
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!assignments || assignments.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">No vendors assigned yet</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a: any) => {
                const cfg = statusConfig[a.status] || statusConfig.assigned;
                const Icon = cfg.icon;
                const name = a.vendor?.company_name || 
                  `${a.vendor?.first_name || ''} ${a.vendor?.last_name || ''}`.trim() || 'Unknown';
                return (
                  <div key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.vendor?.vendor_type ? formatVendorType(a.vendor.vendor_type) : 'Vendor'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{a.status}</Badge>
                      {(a.status === 'assigned' || a.status === 'declined') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-7 text-xs"
                          onClick={() => cancelAssignment.mutate(a.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignVendorModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        eventId={eventId}
        eventDate={eventDate}
      />
    </>
  );
};

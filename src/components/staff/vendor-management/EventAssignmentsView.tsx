import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEventAssignments, useCancelAssignment, useReassignVendor } from '@/hooks/useAdminAssignments';
import { UserPlus, Phone, Mail, AlertCircle, Trash2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatVendorType } from '@/utils/vendorTypeFormatter';
import AssignVendorModal from './AssignVendorModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EventAssignmentsViewProps {
  eventId: string;
  eventDate: string;
  vendorType?: string;
}

const EventAssignmentsView = ({ eventId, eventDate, vendorType }: EventAssignmentsViewProps) => {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reassignId, setReassignId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: assignments, isLoading } = useEventAssignments(eventId);
  const cancelAssignment = useCancelAssignment();
  const reassignVendor = useReassignVendor();

  const getStatusBadge = (status: string) => {
    const config = {
      assigned: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, label: 'Assigned' },
      confirmed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Confirmed' },
      declined: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Declined' },
      completed: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: CheckCircle, label: 'Completed' },
    };

    const { color, icon: Icon, label } = config[status as keyof typeof config] || config.assigned;

    return (
      <Badge variant="outline" className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const handleCancelConfirm = async () => {
    if (cancelId) {
      await cancelAssignment.mutateAsync(cancelId);
      setCancelId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading assignments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assigned Vendors</h3>
        <Button onClick={() => setAssignModalOpen(true)} size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Vendor
        </Button>
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((assignment: any) => (
            <Card key={assignment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">
                        {assignment.vendor?.company_name ||
                          `${assignment.vendor?.first_name || ''} ${assignment.vendor?.last_name || ''}`.trim() ||
                          'Unknown Vendor'}
                      </h4>
                      {getStatusBadge(assignment.status)}
                    </div>

                    {assignment.vendor?.vendor_type && (
                      <p className="text-sm text-muted-foreground">
                        {formatVendorType(assignment.vendor.vendor_type)}
                      </p>
                    )}

                    <div className="flex flex-col gap-1 text-sm">
                      {assignment.vendor?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{assignment.vendor.email}</span>
                        </div>
                      )}
                      {assignment.vendor?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{assignment.vendor.phone}</span>
                        </div>
                      )}
                    </div>

                    {assignment.assignment_notes && (
                      <div className="bg-muted/50 rounded-lg p-3 mt-2">
                        <p className="text-sm font-medium mb-1">Assignment Notes:</p>
                        <p className="text-sm text-muted-foreground">{assignment.assignment_notes}</p>
                      </div>
                    )}

                    {assignment.declined_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                        <p className="text-sm font-medium text-red-800 mb-1">Decline Reason:</p>
                        <p className="text-sm text-red-700">{assignment.declined_reason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                      <span>Assigned {format(new Date(assignment.created_at), 'PPp')}</span>
                      {assignment.confirmed_at && (
                        <span>Confirmed {format(new Date(assignment.confirmed_at), 'PPp')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {assignment.status === 'declined' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReassignId(assignment.id)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reassign
                      </Button>
                    )}
                    {assignment.status === 'assigned' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelId(assignment.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No vendors assigned to this event yet.</p>
              <Button onClick={() => setAssignModalOpen(true)} className="mt-4" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Assign First Vendor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AssignVendorModal
        isOpen={assignModalOpen || !!reassignId}
        onClose={() => {
          setAssignModalOpen(false);
          setReassignId(null);
        }}
        eventId={eventId}
        eventDate={eventDate}
        vendorType={vendorType}
      />

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the vendor from this event. The vendor will be notified of the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Assignment</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>Cancel Assignment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventAssignmentsView;

import React, { useState } from 'react';
import { formatVendorType } from '@/utils/vendorTypeFormatter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAssignment } from '@/hooks/useAdminAssignments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';


interface AssignVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventDate: string;
  vendorType?: string;
}

interface Vendor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  vendor_type: string | null;
  is_active: boolean;
}

const AssignVendorModal = ({ isOpen, onClose, eventId, eventDate, vendorType }: AssignVendorModalProps) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const createAssignment = useCreateAssignment();

  // Fetch available vendors
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['available-vendors', vendorType, eventDate],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, vendor_type, is_active')
        .eq('is_active', true)
        .in('role', ['vendor', 'dj'])
        .not('vendor_types', 'is', null);

      if (vendorType) {
        query = query.contains('vendor_types', [vendorType]);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;

      // Check availability + existing bookings for each vendor
      const vendorsWithAvailability = await Promise.all(
        (data as Vendor[]).map(async (vendor) => {
          const [{ data: blocks }, { data: existingAssignments }] = await Promise.all([
            supabase
              .from('vendor_availability_blocks')
              .select('is_flexible')
              .eq('vendor_id', vendor.id)
              .lte('start_date', eventDate)
              .gte('end_date', eventDate)
              .limit(50),
            supabase
              .from('event_dj_assignments')
              .select('id')
              .eq('dj_user_id', vendor.id)
              .eq('event_id', eventId)
              .limit(50)
          ]);

          // Check if already booked on same date via event lookup
          const { data: dateAssignments } = await supabase
            .from('event_dj_assignments')
            .select('id, event:event_notification_history!event_dj_assignments_event_id_fkey(event_date)')
            .eq('dj_user_id', vendor.id)
            .neq('status', 'declined')
            .limit(200);

          const bookedOnDate = (dateAssignments || []).some(
            (a: any) => a.event?.event_date === eventDate
          );

          const hasHardBlock = blocks?.some((b) => !b.is_flexible);
          const alreadyAssigned = (existingAssignments || []).length > 0;

          return {
            ...vendor,
            hasAvailabilityWarning: blocks && blocks.length > 0 && !hasHardBlock,
            isBlocked: hasHardBlock,
            isAlreadyAssigned: alreadyAssigned,
            isBookedOnDate: bookedOnDate,
          };
        })
      );

      // Filter out completely blocked and already-assigned vendors
      return vendorsWithAvailability.filter((v) => !v.isBlocked && !v.isAlreadyAssigned);
    },
  });

  const handleSubmit = async () => {
    if (!selectedVendorId) return;

    await createAssignment.mutateAsync({
      eventId,
      vendorId: selectedVendorId,
      notes,
    });

    onClose();
    setSelectedVendorId('');
    setNotes('');
  };

  const getVendorDisplayName = (vendor: Vendor & { hasAvailabilityWarning?: boolean; isBookedOnDate?: boolean }) => {
    const name =
      vendor.company_name ||
      `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() ||
      'Unknown Vendor';
    if (vendor.isBookedOnDate) return `${name} 📅 (booked this date)`;
    return vendor.hasAvailabilityWarning ? `${name} ⚠️` : name;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Vendor to Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Select Vendor</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : vendors && vendors.length > 0 ? (
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {getVendorDisplayName(vendor)}
                      {vendor.vendor_type && ` - ${formatVendorType(vendor.vendor_type)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No available vendors found for this date
                  {vendorType && ` and type (${vendorType})`}.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {selectedVendorId && vendors?.find((v: any) => v.id === selectedVendorId)?.hasAvailabilityWarning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This vendor has marked limited availability for this date but hasn't blocked it completely.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Assignment Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes for this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedVendorId || createAssignment.isPending}
          >
            {createAssignment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Vendor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignVendorModal;

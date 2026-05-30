import React, { useState } from 'react';
import { useVendorAvailability } from '@/hooks/useVendorAvailability';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, X, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface VendorAvailabilityManagerProps {
  vendorId: string;
}

export const VendorAvailabilityManager = ({ vendorId }: VendorAvailabilityManagerProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState<'vacation' | 'booked_elsewhere' | 'seasonal_closure' | 'personal' | 'other'>('other');
  const [isFlexible, setIsFlexible] = useState(false);
  const [notes, setNotes] = useState('');

  const { blocks, isLoading, addBlock, deleteBlock } = useVendorAvailability(vendorId);

  const handleAddBlock = () => {
    if (!startDate || !endDate) return;
    
    addBlock.mutate({
      vendor_id: vendorId,
      start_date: startDate,
      end_date: endDate,
      reason,
      is_flexible: isFlexible,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        setStartDate('');
        setEndDate('');
        setReason('other');
        setIsFlexible(false);
        setNotes('');
        setShowAddForm(false);
      },
    });
  };

  const reasonLabels: Record<typeof reason, string> = {
    vacation: 'Vacation',
    booked_elsewhere: 'Booked Elsewhere',
    seasonal_closure: 'Seasonal Closure',
    personal: 'Personal',
    other: 'Other',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Availability Management</h3>
          <p className="text-sm text-muted-foreground">
            {blocks.length} unavailable block(s)
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? 'outline' : 'default'}
          size="sm"
        >
          {showAddForm ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Block
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Unavailable Block</CardTitle>
            <CardDescription>Set dates when this vendor is unavailable</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-start-date">Start Date</Label>
                <Input
                  id="admin-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="admin-end-date">End Date</Label>
                <Input
                  id="admin-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-reason">Reason</Label>
              <Select value={reason} onValueChange={(val: any) => setReason(val)}>
                <SelectTrigger id="admin-reason" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="booked_elsewhere">Booked Elsewhere</SelectItem>
                  <SelectItem value="seasonal_closure">Seasonal Closure</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="admin-flexible" className="cursor-pointer">
                  Flexible Availability
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Vendor might still be available if needed
                </p>
              </div>
              <Switch
                id="admin-flexible"
                checked={isFlexible}
                onCheckedChange={setIsFlexible}
              />
            </div>

            <div>
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this unavailability..."
                rows={2}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleAddBlock}
              disabled={!startDate || !endDate || addBlock.isPending}
              className="w-full"
            >
              {addBlock.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Availability Block'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : blocks.length > 0 ? (
        <div className="space-y-2">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-start justify-between p-3 rounded-lg border bg-card space-x-3"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {format(parseISO(block.start_date), 'MMM d, yyyy')}
                    {block.start_date !== block.end_date && (
                      <> - {format(parseISO(block.end_date), 'MMM d, yyyy')}</>
                    )}
                  </span>
                  <Badge variant="secondary" className="text-xs">{reasonLabels[block.reason]}</Badge>
                  {block.is_flexible && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Flexible
                    </Badge>
                  )}
                </div>
                {block.notes && (
                  <p className="text-xs text-muted-foreground">{block.notes}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteBlock.mutate(block.id)}
                disabled={deleteBlock.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          No unavailable blocks set for this vendor.
        </p>
      )}
    </div>
  );
};

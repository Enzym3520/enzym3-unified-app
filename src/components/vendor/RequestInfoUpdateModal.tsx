import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSubmitUpdateRequest } from '@/hooks/use-update-requests';

const UPDATABLE_FIELDS = [
  { value: 'start_time', label: 'Start Time' },
  { value: 'venue', label: 'Venue' },
  { value: 'guest_count', label: 'Guest Count' },
  { value: 'coordinator_name', label: 'Coordinator' },
  { value: 'contact_phone', label: 'Contact Phone' },
  { value: 'contact_email', label: 'Contact Email' },
  { value: 'dress_code', label: 'Dress Code' },
  { value: 'package_type', label: 'Package Type' },
  { value: 'event_date', label: 'Event Date' },
  { value: 'notes', label: 'Notes' },
  { value: 'other', label: 'Other' },
];

interface RequestInfoUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function RequestInfoUpdateModal({ open, onOpenChange, eventId }: RequestInfoUpdateModalProps) {
  const [fieldName, setFieldName] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [reason, setReason] = useState('');
  const mutation = useSubmitUpdateRequest();

  const selectedLabel = UPDATABLE_FIELDS.find(f => f.value === fieldName)?.label || fieldName;

  const handleSubmit = () => {
    if (!fieldName || !reason.trim()) return;
    mutation.mutate(
      { eventId, fieldName: selectedLabel, suggestedValue: suggestedValue.trim() || undefined, reason: reason.trim() },
      {
        onSuccess: () => {
          setFieldName('');
          setSuggestedValue('');
          setReason('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Info Update</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Which field needs updating?</Label>
            <Select value={fieldName} onValueChange={setFieldName}>
              <SelectTrigger>
                <SelectValue placeholder="Select a field…" />
              </SelectTrigger>
              <SelectContent>
                {UPDATABLE_FIELDS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Suggested value <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              placeholder="What should it be?"
              value={suggestedValue}
              onChange={e => setSuggestedValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Why does this need to be updated?"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!fieldName || !reason.trim() || mutation.isPending}>
            {mutation.isPending ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

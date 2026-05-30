import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VendorInvite } from '@/types/vendorInvite';
import { useUpdateInvite } from '@/hooks/useVendorInvites';

interface EditInviteModalProps {
  invite: VendorInvite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInviteModal({ invite, open, onOpenChange }: EditInviteModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [vendorType, setVendorType] = useState('');
  const [resendEmail, setResendEmail] = useState(false);

  const updateMutation = useUpdateInvite();
  const isRegistered = !!invite?.used_by;

  useEffect(() => {
    if (invite) {
      setEmail(invite.invited_email || invite.email || '');
      setFirstName(invite.invited_first_name || '');
      setLastName(invite.invited_last_name || '');
      setCompany(invite.invited_company || '');
      setVendorType(invite.vendor_type || '');
      setResendEmail(false);
    }
  }, [invite]);

  const handleSave = () => {
    if (!invite) return;
    updateMutation.mutate({
      inviteId: invite.id,
      email,
      firstName,
      lastName,
      company,
      vendorType,
      resendEmail,
      code: invite.code,
      expiresAt: invite.expires_at,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Invite</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-first">First Name</Label>
              <Input id="edit-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-last">Last Name</Label>
              <Input id="edit-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-company">Company</Label>
            <Input id="edit-company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-type">Vendor Type</Label>
            <Select value={vendorType} onValueChange={setVendorType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dj">DJ</SelectItem>
                <SelectItem value="floral">Floral</SelectItem>
                <SelectItem value="catering">Catering</SelectItem>
                <SelectItem value="photography">Photography</SelectItem>
                <SelectItem value="videography">Videography</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="bartending">Bartending</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isRegistered && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              ✅ This vendor has registered — changes will sync to their profile.
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="resend-check"
              checked={resendEmail}
              onChange={(e) => setResendEmail(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="resend-check" className="text-sm font-normal">Resend invitation email after saving</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || !email}>
            {updateMutation.isPending ? 'Saving...' : resendEmail ? 'Save & Send' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateVendorInvite } from '@/hooks/useVendorInvites';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatVendorType } from '@/utils/vendorTypeFormatter';
import { getVendorRegistrationLink } from '@/config/urls';

const VENDOR_TYPE_OPTIONS = [
  'dj', 'mc', 'photography', 'videography', 'lighting', 'photo_booth',
  'floral', 'catering', 'venue', 'transportation', 'bartending', 'coordinator', 'other',
];

interface CreateInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInviteModal({ open, onOpenChange }: CreateInviteModalProps) {
  const [inviteType, setInviteType] = useState<'vendor' | 'coordinator'>('vendor');
  const [email, setEmail] = useState('');
  const [selectedVendorTypes, setSelectedVendorTypes] = useState<string[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [createdInvite, setCreatedInvite] = useState<any>(null);

  const createMutation = useCreateVendorInvite();

  const handleSubmit = () => {
    const primaryType = selectedVendorTypes[0] || '';
    const allTypesNote = selectedVendorTypes.length > 1
      ? `[Multi-role: ${selectedVendorTypes.join(', ')}]${notes ? '\n' + notes : ''}`
      : notes;

    createMutation.mutate(
      {
        email,
        vendorType: inviteType === 'coordinator' ? '' : primaryType,
        firstName,
        lastName,
        companyName,
        expiresInDays: parseInt(expiresInDays),
        notes: allTypesNote,
        inviteRole: inviteType,
      },
      {
        onSuccess: (data) => {
          setCreatedInvite(data);
        },
      }
    );
  };

  const resetForm = () => {
    setInviteType('vendor');
    setEmail('');
    setSelectedVendorTypes([]);
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setExpiresInDays('30');
    setNotes('');
    setCreatedInvite(null);
    onOpenChange(false);
  };

  const copyLink = () => {
    if (createdInvite) {
      navigator.clipboard.writeText(getVendorRegistrationLink(createdInvite.code));
      toast.success('Link copied!');
    }
  };

  if (createdInvite) {
    const registrationLink = getVendorRegistrationLink(createdInvite.code);
    
    return (
      <Dialog open={open} onOpenChange={resetForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Created Successfully!</DialogTitle>
            <DialogDescription>Share this registration link with the vendor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Invite Code</Label>
              <Input value={createdInvite.code} readOnly className="font-mono" />
            </div>
            <div>
              <Label>Registration Link</Label>
              <div className="flex gap-2">
                <Input value={registrationLink} readOnly className="flex-1" />
                <Button size="icon" variant="outline" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => window.open(registrationLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Button onClick={resetForm} className="w-full">Done</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Vendor Invite</DialogTitle>
          <DialogDescription>Generate a new invitation code for a vendor</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 mb-4">
            <Label htmlFor="inviteType">Invite Type *</Label>
            <Select value={inviteType} onValueChange={(v) => setInviteType(v as 'vendor' | 'coordinator')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={inviteType === 'coordinator' ? 'coordinator@example.com' : 'vendor@example.com'}
              />
            </div>
            {inviteType === 'vendor' && (
              <div className="space-y-2 col-span-full">
                <Label>Vendor Type(s) *</Label>
                <p className="text-xs text-muted-foreground">Select all roles this vendor performs</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {VENDOR_TYPE_OPTIONS.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`invite-type-${type}`}
                        checked={selectedVendorTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          setSelectedVendorTypes(prev =>
                            checked
                              ? [...prev, type]
                              : prev.filter(t => t !== type)
                          );
                        }}
                      />
                      <label htmlFor={`invite-type-${type}`} className="text-sm font-medium leading-none cursor-pointer">
                        {formatVendorType(type)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expires In (Days)</Label>
              <Input
                id="expires"
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional internal notes..."
              rows={3}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!email || (inviteType === 'vendor' && selectedVendorTypes.length === 0) || createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Invite'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

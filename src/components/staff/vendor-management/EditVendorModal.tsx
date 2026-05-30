import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UnifiedVendor } from '@/hooks/useVendorManagement';
import { useUpdateVendorProfile } from '@/hooks/useVendorActions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatVendorType } from '@/utils/vendorTypeFormatter';

interface EditVendorModalProps {
  vendor: UnifiedVendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VENDOR_TYPE_OPTIONS = [
  'dj', 'mc', 'photography', 'videography', 'lighting', 'photo_booth',
  'floral', 'catering', 'venue', 'transportation', 'bartending', 'coordinator', 'officiant', 'band', 'other',
];

export function EditVendorModal({ vendor, open, onOpenChange }: EditVendorModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedVendorTypes, setSelectedVendorTypes] = useState<string[]>([]);
  const [startingPrice, setStartingPrice] = useState('');
  const [priceType, setPriceType] = useState('custom_quote');
  const [serviceArea, setServiceArea] = useState('');

  const updateProfile = useUpdateVendorProfile();

  // Fetch full profile for editing
  const { data: fullProfile } = useQuery({
    queryKey: ['vendor-edit-profile', vendor.userId],
    enabled: !!vendor.userId && open,
    queryFn: async () => {
      if (!vendor.userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', vendor.userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Set form values when profile loads
  useEffect(() => {
    if (fullProfile) {
      setFirstName(fullProfile.first_name || '');
      setLastName(fullProfile.last_name || '');
      setEmail(fullProfile.email || '');
      setPhone(fullProfile.phone || '');
      setCompanyName(fullProfile.company_name || '');
      const types = fullProfile.vendor_types?.length > 0
        ? fullProfile.vendor_types
        : fullProfile.vendor_type ? [fullProfile.vendor_type] : [];
      setSelectedVendorTypes(types);
      setStartingPrice(fullProfile.starting_price?.toString() || '');
      setPriceType(fullProfile.price_type || 'custom_quote');
      setServiceArea(fullProfile.service_area?.join(', ') || '');
    }
  }, [fullProfile]);

  const handleSubmit = () => {
    if (!vendor.userId) return;

    const updates: any = {
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      company_name: companyName || null,
      vendor_type: selectedVendorTypes[0] || null,
      vendor_types: selectedVendorTypes,
      starting_price: startingPrice ? parseFloat(startingPrice) : null,
      price_type: priceType,
      service_area: serviceArea ? serviceArea.split(',').map(s => s.trim()).filter(Boolean) : null,
    };

    updateProfile.mutate(
      { vendorId: vendor.userId, updates },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vendor Profile</DialogTitle>
          <DialogDescription>
            Update vendor information. These changes will be visible to the vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Vendor Type(s)</Label>
            <p className="text-xs text-muted-foreground">Select all roles this vendor performs</p>
            <div className="grid grid-cols-2 gap-2 mt-1 max-h-48 overflow-y-auto">
              {VENDOR_TYPE_OPTIONS.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-type-${type}`}
                    checked={selectedVendorTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      setSelectedVendorTypes(prev =>
                        checked
                          ? [...prev, type]
                          : prev.filter(t => t !== type)
                      );
                    }}
                  />
                  <label htmlFor={`edit-type-${type}`} className="text-sm font-medium leading-none cursor-pointer">
                    {formatVendorType(type)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startingPrice">Starting Price ($)</Label>
              <Input
                id="startingPrice"
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceType">Price Type</Label>
              <Select value={priceType} onValueChange={setPriceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="flat_fee">Flat Fee</SelectItem>
                  <SelectItem value="per_event">Per Event</SelectItem>
                  <SelectItem value="custom_quote">Custom Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceArea">Service Area (comma separated)</Label>
            <Input
              id="serviceArea"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="Los Angeles, Orange County, San Diego"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

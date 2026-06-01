import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UnifiedVendor } from '@/hooks/useVendorManagement';
import { format } from 'date-fns';
import { Mail, Phone, Building, Calendar, User, Globe, DollarSign, MapPin, Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { VendorAvailabilityManager } from './VendorAvailabilityManager';
import { AdminVendorDocuments } from './AdminVendorDocuments';
import { VendorPerformanceCard } from './VendorPerformanceCard';
import { VendorReviewHistory } from './VendorReviewHistory';
import { VendorAssignmentsTab } from './VendorAssignmentsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVendorServices } from '@/hooks/useVendorServices';
import { SERVICE_TYPES, RATE_TYPES } from '@/config/serviceTypes';
import { formatVendorType } from '@/utils/vendorTypeFormatter';

interface VendorDetailsModalProps {
  vendor: UnifiedVendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorDetailsModal({ vendor, open, onOpenChange }: VendorDetailsModalProps) {
  const queryClient = useQueryClient();
  const [internalNotes, setInternalNotes] = useState('');
  const [vendorRating, setVendorRating] = useState<number>(0);
  const [vendorStatus, setVendorStatus] = useState('active');
  const { data: services = [] } = useVendorServices(vendor.userId);

  // Fetch full vendor profile if this is an active vendor
  const { data: fullProfile } = useQuery({
    queryKey: ['vendor-full-profile', vendor.userId],
    enabled: !!vendor.userId && open,
    queryFn: async () => {
      if (!vendor.userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', vendor.userId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      // Set initial values from profile
      setInternalNotes(data.internal_notes || '');
      setVendorRating(data.vendor_rating || 0);
      setVendorStatus(data.vendor_status || 'active');
      
      return data;
    },
  });

  const updateAdminFieldsMutation = useMutation({
    mutationFn: async () => {
      if (!vendor.userId) throw new Error('Cannot update invite-only vendor');

      const { error } = await supabase
        .from('profiles')
        .update({
          internal_notes: internalNotes || null,
          vendor_rating: vendorRating || null,
          vendor_status: vendorStatus,
        })
        .eq('id', vendor.userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-full-profile', vendor.userId] });
      toast.success('Vendor information updated');
    },
    onError: (error: any) => {
      console.error('Vendor update error:', error);
      toast.error('Failed to update vendor. Please try again.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vendor Details</DialogTitle>
          <DialogDescription>
            Complete information about this vendor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{vendor.avatarInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{vendor.name}</h3>
              <p className="text-muted-foreground">{formatVendorType(vendor.vendorType)}</p>
            </div>
            <Badge className={vendor.status === 'active' ? 'bg-green-500' : ''}>
              {vendor.status}
            </Badge>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{vendor.email}</p>
              </div>
            </div>

            {vendor.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{vendor.phone}</p>
                </div>
              </div>
            )}

            {vendor.company && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{vendor.company}</p>
                </div>
              </div>
            )}

            {fullProfile?.website && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a href={fullProfile.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {fullProfile.website}
                  </a>
                </div>
              </div>
            )}

            {fullProfile?.instagram_handle && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Instagram</p>
                  <a href={`https://instagram.com/${fullProfile.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    @{fullProfile.instagram_handle}
                  </a>
                </div>
              </div>
            )}

            {fullProfile?.starting_price && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Starting Price ({fullProfile.price_type || 'custom_quote'})</p>
                  <p className="font-medium">${fullProfile.starting_price}</p>
                </div>
              </div>
            )}

            {fullProfile?.service_area && fullProfile.service_area.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Service Area</p>
                  <p className="font-medium">{fullProfile.service_area.join(', ')}</p>
                </div>
              </div>
            )}

            {vendor.registeredAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Registered</p>
                  <p className="font-medium">
                    {format(new Date(vendor.registeredAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {vendor.invitedAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Originally Invited</p>
                  <p className="font-medium">
                    {format(new Date(vendor.invitedAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {vendor.userId && (
            <>
              <Separator />
              
              {/* Admin-Only Fields */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Admin Controls</h3>
                  <p className="text-sm text-muted-foreground">Internal management fields (not visible to vendor)</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Vendor Rating</label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setVendorRating(star)}
                          className="transition-colors"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= vendorRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                      {vendorRating > 0 && (
                        <button
                          type="button"
                          onClick={() => setVendorRating(0)}
                          className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Vendor Status</label>
                    <Select value={vendorStatus} onValueChange={setVendorStatus}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="do_not_use">Do Not Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Internal Notes</label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Private notes about this vendor (only visible to admins)"
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={() => updateAdminFieldsMutation.mutate()}
                    disabled={updateAdminFieldsMutation.isPending}
                    className="w-full"
                  >
                    {updateAdminFieldsMutation.isPending ? 'Saving...' : 'Save Admin Changes'}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Tabbed sections */}
              <Tabs defaultValue="performance" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
                  <TabsTrigger value="rates">Rates</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="mt-4 space-y-4">
                  <VendorPerformanceCard vendorId={vendor.userId!} />
                  <VendorReviewHistory vendorId={vendor.userId!} />
                </TabsContent>
                <TabsContent value="assignments" className="mt-4">
                  <VendorAssignmentsTab vendorId={vendor.userId!} />
                </TabsContent>

                <TabsContent value="availability" className="mt-4">
                  <VendorAvailabilityManager vendorId={vendor.userId} />
                </TabsContent>

                <TabsContent value="rates" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vendor Services & Rates</h3>
                    {services.length === 0 ? (
                      <p className="text-muted-foreground">This vendor hasn't added any services yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {services.map((service: any) => (
                          <div key={service.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">
                                {SERVICE_TYPES.find(t => t.value === service.service_type)?.label}
                              </span>
                              <Badge variant={service.is_active ? 'default' : 'secondary'}>
                                {service.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Rate: ${service.base_rate} - {RATE_TYPES.find(t => t.value === service.rate_type)?.label}</p>
                              {service.min_hours && <p>Min Hours: {service.min_hours}</p>}
                              {service.overtime_rate && <p>Overtime: ${service.overtime_rate}/hr</p>}
                              {service.notes && <p className="mt-2">{service.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <AdminVendorDocuments vendorId={vendor.userId} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

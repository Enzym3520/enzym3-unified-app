import React from 'react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VendorSelectorProps {
  form: UseFormReturn<FormData>;
  vendorType: string;
  eventDate?: Date | string;
}

interface Vendor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  vendor_status: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

interface AvailabilityBlock {
  vendor_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_flexible: boolean;
}

const VendorSelector = ({ form, vendorType, eventDate }: VendorSelectorProps) => {
  const { data: vendorsData, isLoading } = useQuery({
    queryKey: ['vendors', vendorType, eventDate],
    queryFn: async () => {
      // Get all active vendors of this type, excluding inactive and do_not_use
      const { data: allVendors, error: vendorsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, email, phone, vendor_status, average_rating, total_reviews')
        .eq('vendor_type', vendorType)
        .eq('is_active', true)
        .in('role', ['vendor', 'dj'])
        .neq('vendor_status', 'do_not_use')
        .neq('vendor_status', 'inactive')
        .order('average_rating', { ascending: false, nullsFirst: false })
        .order('last_name', { ascending: true, nullsFirst: false })
        .order('first_name', { ascending: true, nullsFirst: false })
        .limit(200);
      
      if (vendorsError) throw vendorsError;
      if (!allVendors || !eventDate) {
        return { 
          available: allVendors as Vendor[], 
          flexible: [] as { vendor: Vendor; reason: string }[] 
        };
      }

      // Convert eventDate to date string (YYYY-MM-DD)
      const eventDateStr = eventDate instanceof Date 
        ? format(eventDate, 'yyyy-MM-dd')
        : typeof eventDate === 'string' 
          ? format(parseLocalDate(eventDate), 'yyyy-MM-dd')
          : null;

      if (!eventDateStr) {
        return { 
          available: allVendors as Vendor[], 
          flexible: [] as { vendor: Vendor; reason: string }[] 
        };
      }

      // Get availability blocks that overlap with the event date
      const { data: blocks, error: blocksError } = await supabase
        .from('vendor_availability_blocks')
        .select('vendor_id, start_date, end_date, reason, is_flexible')
        .lte('start_date', eventDateStr)
        .gte('end_date', eventDateStr)
        .limit(500);

      if (blocksError) throw blocksError;

      const blockedVendors = new Map<string, AvailabilityBlock>();
      const flexibleVendors = new Map<string, AvailabilityBlock>();

      blocks?.forEach(block => {
        if (block.is_flexible) {
          flexibleVendors.set(block.vendor_id, block);
        } else {
          blockedVendors.set(block.vendor_id, block);
        }
      });

      // Filter out completely unavailable vendors, keep flexible ones with warning
      const availableVendors = allVendors.filter(v => !blockedVendors.has(v.id));
      const flexibleVendorsList = availableVendors
        .filter(v => flexibleVendors.has(v.id))
        .map(v => ({
          vendor: v as Vendor,
          reason: flexibleVendors.get(v.id)!.reason,
        }));

      return { 
        available: availableVendors as Vendor[], 
        flexible: flexibleVendorsList 
      };
    },
    enabled: !!vendorType,
  });

  const vendors = vendorsData?.available || [];
  const flexibleVendors = vendorsData?.flexible || [];

  const getVendorDisplayName = (vendor: Vendor) => {
    const name = [vendor.first_name, vendor.last_name].filter(Boolean).join(' ') || 'Unknown';
    return vendor.company_name ? `${name} (${vendor.company_name})` : name;
  };

  if (!vendorType) return null;

  return (
    <FormField
      control={form.control}
      name="assignedVendorId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Assign Vendor</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value}
            disabled={isLoading || !vendors || vendors.length === 0}
          >
            <FormControl>
              <SelectTrigger>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading vendors...
                  </span>
                ) : (
                  <SelectValue placeholder="Select a vendor" />
                )}
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-background z-50">
              {vendors && vendors.length > 0 ? (
                vendors.map((vendor) => {
                  const flexibleInfo = flexibleVendors.find(f => f.vendor.id === vendor.id);
                  return (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <span>{getVendorDisplayName(vendor)}</span>
                        {vendor.average_rating && vendor.average_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{vendor.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                        {flexibleInfo && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-[200px]">
                                  Limited availability: {flexibleInfo.reason.replace(/_/g, ' ')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No vendors available for this date
                </div>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default VendorSelector;

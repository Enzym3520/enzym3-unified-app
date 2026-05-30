import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, DollarSign } from 'lucide-react';
import { isVenuePartner } from '@/config/venuePartners';

interface BookingTypeFieldsProps {
  form: UseFormReturn<any>;
}

const BookingTypeFields = ({ form }: BookingTypeFieldsProps) => {
  const venue = form.watch('venue');

  // Auto-detect booking source based on venue
  useEffect(() => {
    if (venue) {
      const isPartner = isVenuePartner(venue);
      const currentSource = form.getValues('bookingSource');
      
      // Only auto-set if not already manually set or if venue changed
      if (!currentSource || currentSource === '') {
        form.setValue('bookingSource', isPartner ? 'venue_partner' : 'independent');
      }
    }
  }, [venue, form]);

  return (
    <FormField
      control={form.control}
      name="bookingSource"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Booking Type
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select booking type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="venue_partner">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Venue Partner (venue handles payment)
                </span>
              </SelectItem>
              <SelectItem value="independent">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Independent Gig (client pays directly)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default BookingTypeFields;

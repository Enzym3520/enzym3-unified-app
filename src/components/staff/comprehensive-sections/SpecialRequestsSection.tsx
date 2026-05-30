import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface SpecialRequestsSectionProps {
  form: UseFormReturn<FormData>;
}

const SpecialRequestsSection = ({ form }: SpecialRequestsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Special Requests & Additional Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="specialRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Requests</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special requests or unique requirements for your event"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accessibilityNeeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accessibility Needs</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any accessibility requirements or accommodations needed"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="culturalConsiderations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cultural Considerations</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any cultural traditions, customs, or religious considerations"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Timeline</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Outline the event timeline and key moments"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="additionalVendors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Vendors</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any other vendors involved in the event"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact</FormLabel>
              <FormControl>
                <Input
                  placeholder="Emergency contact name and phone number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="parkingInformation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parking Information</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Parking details and instructions for guests"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="loadInInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Load-in Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Vendor load-in procedures and venue access details"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="venueContact"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Venue Contact Information</FormLabel>
            <FormControl>
              <Input
                placeholder="Venue coordinator name and contact details"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default SpecialRequestsSection;
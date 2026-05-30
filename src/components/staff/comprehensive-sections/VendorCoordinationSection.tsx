import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TimeInput12Hour } from '@/components/ui/time-input-12hour';

interface VendorCoordinationSectionProps {
  form: UseFormReturn<FormData>;
}

const VendorCoordinationSection = ({ form }: VendorCoordinationSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Vendor Coordination</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="photographerStartTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Photographer Start Time"
              tooltip="When the photographer should begin coverage"
            />
          )}
        />

        <FormField
          control={form.control}
          name="floristArrivalTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Florist Arrival Time"
              tooltip="When the florist should arrive for setup"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="cakeProvidedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cake Provided By</FormLabel>
              <FormControl>
                <Input
                  placeholder="Vendor name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cakeCutNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cut #</FormLabel>
              <FormControl>
                <Input
                  placeholder="Cut number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cakeDeliveryTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Delivery Time"
              tooltip="When the cake should be delivered"
            />
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="cakeTableLocation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location of Cake Table</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter cake table location"
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

export default VendorCoordinationSection;
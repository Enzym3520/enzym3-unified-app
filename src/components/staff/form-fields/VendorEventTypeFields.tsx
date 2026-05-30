
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import VendorSelector from './VendorSelector';

interface VendorEventTypeFieldsProps {
  form: UseFormReturn<FormData>;
}

const VendorEventTypeFields = ({ form }: VendorEventTypeFieldsProps) => {
  const eventType = form.watch('eventType');
  const vendorType = form.watch('vendorType');
  const eventDate = form.watch('weddingDate');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="vendorType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type of Vendor(s) *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="dj">DJ</SelectItem>
                  <SelectItem value="floral">Floral</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="videography">Videography</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type of Event *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="birthday">Birthday Party</SelectItem>
                  <SelectItem value="quince">Quince</SelectItem>
                  <SelectItem value="banquet">Banquet</SelectItem>
                  <SelectItem value="graduation">Graduation Party</SelectItem>
                  <SelectItem value="sweet16">Sweet 16</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {vendorType && (
          <div className="animate-fade-in">
            <VendorSelector form={form} vendorType={vendorType} eventDate={eventDate} />
          </div>
        )}
      </div>

      {eventType === 'other' && (
        <div className="animate-fade-in">
          <FormField
            control={form.control}
            name="customEventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please specify event type *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter custom event type" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default VendorEventTypeFields;

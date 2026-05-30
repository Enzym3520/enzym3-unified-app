
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { FormData } from '@/types/eventForm';

interface GuestCountFieldProps {
  form: UseFormReturn<FormData>;
}

const GuestCountField = ({ form }: GuestCountFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="numberOfGuests"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="font-poppins font-medium">Number of Guests</FormLabel>
            <FieldTooltip content="Approximate number of attendees expected" />
          </div>
          <FormControl>
            <EnhancedInput
              type="number"
              {...field}
              value={field.value === undefined ? '' : field.value}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value === '' ? undefined : Number(value));
              }}
              className="font-poppins focus:ring-2 focus:ring-enzym3-blue"
              placeholder="Enter guest count"
              min="1"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default GuestCountField;

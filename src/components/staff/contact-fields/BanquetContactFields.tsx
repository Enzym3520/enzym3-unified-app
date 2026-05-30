import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { FormData } from '@/types/eventForm';
import SmartInputField from '@/components/staff/form-fields/SmartInputField';

interface BanquetContactFieldsProps {
  form: UseFormReturn<FormData>;
}

const BanquetContactFields = ({ form }: BanquetContactFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="font-poppins font-medium">Contact Name *</FormLabel>
                <FieldTooltip content="Primary contact person for the event" />
              </div>
              <FormControl>
                <EnhancedInput
                  {...field}
                  className="font-poppins focus:ring-2 focus:ring-enzym3-blue"
                  placeholder="Enter contact person's full name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="font-poppins font-medium"><FormLabel className="font-poppins font-medium">Contact Phone Number</FormLabel></FormLabel>
                <FieldTooltip content="Primary contact phone number" />
              </div>
              <FormControl>
                <PhoneInput
                  {...field}
                  className="font-poppins focus:ring-2 focus:ring-enzym3-blue"
                  placeholder="(555) 123-4567"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <SmartInputField
        form={form}
        name="contactEmail"
        label="Contact Email *"
        placeholder="contact@example.com"
        tooltip="Primary email address for the contact person"
        type="email"
        validation={(value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
      />
    </>
  );
};

export default BanquetContactFields;
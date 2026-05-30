import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { FormData } from '@/types/eventForm';
import SmartInputField from '@/components/staff/form-fields/SmartInputField';

interface QuinceContactFieldsProps {
  form: UseFormReturn<FormData>;
}

const QuinceContactFields = ({ form }: QuinceContactFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="quinceaneraName"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center">
              <FormLabel className="font-poppins font-medium">Quinceañera's Name *</FormLabel>
              <FieldTooltip content="Full name of the quinceañera" />
            </div>
            <FormControl>
              <EnhancedInput
                {...field}
                className="font-poppins focus:ring-2 focus:ring-enzym3-blue"
                placeholder="Enter quinceañera's full name"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="parentName"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="font-poppins font-medium">Parent/Guardian Name *</FormLabel>
                <FieldTooltip content="Name of parent or guardian" />
              </div>
              <FormControl>
                <EnhancedInput
                  {...field}
                  className="font-poppins focus:ring-2 focus:ring-enzym3-blue"
                  placeholder="Enter parent's full name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentPhone"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="font-poppins font-medium"><FormLabel className="font-poppins font-medium">Parent Phone Number</FormLabel></FormLabel>
                <FieldTooltip content="Primary contact number for parent/guardian" />
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
        name="parentEmail"
        label="Parent Email *"
        placeholder="parent@example.com"
        tooltip="Primary email address for parent/guardian"
        type="email"
        validation={(value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
      />
    </>
  );
};

export default QuinceContactFields;
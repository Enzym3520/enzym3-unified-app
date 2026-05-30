
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { FormData } from '@/types/eventForm';

interface ContractFieldProps {
  form: UseFormReturn<FormData>;
}

const ContractField = ({ form }: ContractFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="contract"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="font-poppins font-medium">Contract (Optional)</FormLabel>
            <FieldTooltip content="Any contract details or reference numbers" />
          </div>
          <FormControl>
            <EnhancedInput
              {...field}
              className="font-poppins focus:ring-2 focus:ring-enzym3-blue"
              placeholder="Contract details or reference number"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ContractField;

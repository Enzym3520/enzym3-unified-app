import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PhoneInput } from '@/components/ui/phone-input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { FormData } from '@/types/eventForm';
import SmartInputField from '@/components/staff/form-fields/SmartInputField';

interface WeddingContactFieldsProps {
  form: UseFormReturn<FormData>;
}

const WeddingContactFields = ({ form }: WeddingContactFieldsProps) => {
  // Common name suggestions
  const brideNameSuggestions = [
    'Emily Johnson',
    'Sarah Williams',
    'Jessica Brown',
    'Ashley Davis',
    'Amanda Miller',
    'Jennifer Wilson'
  ];

  const groomNameSuggestions = [
    'Michael Smith',
    'David Johnson',
    'Christopher Brown',
    'Matthew Davis',
    'Daniel Wilson',
    'Andrew Miller'
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SmartInputField
          form={form}
          name="brideName"
          label="Bride's Full Name *"
          placeholder="e.g. Lisa Wilson"
          tooltip="First and last name of the bride"
          suggestions={brideNameSuggestions}
        />

        <SmartInputField
          form={form}
          name="groomName"
          label="Groom's Full Name *"
          placeholder="e.g. James Krinkel"
          tooltip="First and last name of the groom"
          suggestions={groomNameSuggestions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="bridePhone"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="font-poppins font-medium"><FormLabel className="font-poppins font-medium">Phone Number - Bride</FormLabel></FormLabel>
                <FieldTooltip content="Primary contact number for the bride" />
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

        <FormField
          control={form.control}
          name="groomPhone"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="font-poppins font-medium"><FormLabel className="font-poppins font-medium">Phone Number - Groom</FormLabel></FormLabel>
                <FieldTooltip content="Primary contact number for the groom" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SmartInputField
          form={form}
          name="brideEmail"
          label="Email - Bride"
          placeholder="bride@example.com"
          tooltip="Primary email address for the bride"
          type="email"
          validation={(value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
        />

        <SmartInputField
          form={form}
          name="groomEmail"
          label="Email - Groom"
          placeholder="groom@example.com"
          tooltip="Primary email address for the groom"
          type="email"
          validation={(value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
        />
      </div>

      <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
        <strong>Note:</strong> At least one email address (bride or groom) is required.
      </div>
    </>
  );
};

export default WeddingContactFields;
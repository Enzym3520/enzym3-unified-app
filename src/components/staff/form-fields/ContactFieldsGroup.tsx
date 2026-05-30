import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { FormData } from '@/types/eventForm';
import SmartInputField from './SmartInputField';
import WeddingContactFields from '@/components/staff/contact-fields/WeddingContactFields';
import QuinceContactFields from '@/components/staff/contact-fields/QuinceContactFields';
import BirthdayContactFields from '@/components/staff/contact-fields/BirthdayContactFields';
import BanquetContactFields from '@/components/staff/contact-fields/BanquetContactFields';
import GraduationContactFields from '@/components/staff/contact-fields/GraduationContactFields';

interface ContactDetailsSectionProps {
  form: UseFormReturn<FormData>;
}

const ContactDetailsSection = ({ form }: ContactDetailsSectionProps) => {
  const eventType = form.watch('eventType');

  const renderEventTypeFields = () => {
    switch (eventType) {
      case 'wedding':
        return <WeddingContactFields form={form} />;
      case 'quince':
        return <QuinceContactFields form={form} />;
      case 'birthday':
      case 'sweet16':
        return <BirthdayContactFields form={form} />;
      case 'graduation':
        return <GraduationContactFields form={form} />;
      case 'banquet':
        return <BanquetContactFields form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-t pt-6">
        <h3 className="text-lg font-playfair font-semibold text-gray-800 mb-4">Contact Information</h3>
      </div>

      {renderEventTypeFields()}

      {eventType && (
        <SmartInputField
          form={form}
          name="email"
          label="Additional Email (Optional)"
          placeholder="additional@email.com"
          tooltip="Any additional email address for event coordination"
          type="email"
          validation={(value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
        />
      )}

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center">
              <FormLabel className="font-poppins font-medium">Notes</FormLabel>
              <FieldTooltip content="Any additional information, special requirements, or important details" />
            </div>
            <FormControl>
              <Textarea
                {...field}
                className="font-poppins focus:ring-2 focus:ring-enzym3-blue min-h-[100px] transition-all duration-200 hover:border-enzym3-blue/50"
                placeholder="Additional notes, special requirements, dietary restrictions, accessibility needs, etc..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ContactDetailsSection;
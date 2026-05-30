import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import SmartInputField from '@/components/staff/form-fields/SmartInputField';
import VenueField from '@/components/staff/form-fields/VenueField';
import MultiVendorSelector from '@/components/staff/form-fields/MultiVendorSelector';
import { Separator } from '@/components/ui/separator';

interface CoordinatorVendorFieldsProps {
  form: UseFormReturn<FormData>;
}

const CoordinatorVendorFields = ({ form }: CoordinatorVendorFieldsProps) => {
  return (
    <div className="space-y-6">
      {/* Event Planner Field */}
      <SmartInputField
        form={form}
        name="from"
        label="From (Event Planner) *"
        placeholder="Enter event planner name"
        tooltip="The event planner managing this event"
        suggestionType="coordinator"
      />

      <VenueField form={form} />

      <Separator className="my-4" />

      {/* Multi-Vendor Selector */}
      <MultiVendorSelector form={form} />
    </div>
  );
};

export default CoordinatorVendorFields;

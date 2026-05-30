
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import CoordinatorVendorFields from './CoordinatorVendorFields';
import VendorEventTypeFields from './VendorEventTypeFields';
import EventDateField from './EventDateField';
import GuestCountField from './GuestCountField';
import ContractPackageFields from './ContractPackageFields';

interface EventDetailsSectionProps {
  form: UseFormReturn<FormData>;
}

const EventDetailsSection = ({ form }: EventDetailsSectionProps) => {
  return (
    <div className="space-y-6">
      <CoordinatorVendorFields form={form} />
      <VendorEventTypeFields form={form} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EventDateField form={form} />
        <GuestCountField form={form} />
      </div>

      <ContractPackageFields form={form} />
    </div>
  );
};

export default EventDetailsSection;

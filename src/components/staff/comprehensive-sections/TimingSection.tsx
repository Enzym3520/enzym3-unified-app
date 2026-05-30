import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { TimeInput12Hour } from '@/components/ui/time-input-12hour';

interface TimingSectionProps {
  form: UseFormReturn<FormData>;
}

const TimingSection = ({ form }: TimingSectionProps) => {

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Event Timing & Schedule</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="eventStartTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Event Start Time"
              tooltip="The scheduled start time for the event"
            />
          )}
        />

        <FormField
          control={form.control}
          name="eventEndTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Event End Time"
              tooltip="The scheduled end time for the event"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="setupTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Setup Time"
              tooltip="When vendors should arrive for setup"
            />
          )}
        />

        <FormField
          control={form.control}
          name="breakdownTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Breakdown Time"
              tooltip="When vendors should begin breakdown"
            />
          )}
        />
      </div>
    </div>
  );
};

export default TimingSection;
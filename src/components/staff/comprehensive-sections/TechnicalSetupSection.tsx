import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface TechnicalSetupSectionProps {
  form: UseFormReturn<FormData>;
}

const TechnicalSetupSection = ({ form }: TechnicalSetupSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Technical & Setup Requirements</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="lightingRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lighting Requirements</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe lighting preferences and requirements"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="soundRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sound System Requirements</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe sound system needs and preferences"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="equipmentNeeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Equipment Needs</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any additional equipment requirements"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="powerRequirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Power Requirements</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe power needs and electrical requirements"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="venueRestrictions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Venue Restrictions & Guidelines</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List any venue restrictions, noise limits, or setup guidelines"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default TechnicalSetupSection;
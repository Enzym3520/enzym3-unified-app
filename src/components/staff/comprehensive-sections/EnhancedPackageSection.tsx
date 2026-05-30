import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePackageTypes } from '@/hooks/useAppConfig';

interface EnhancedPackageSectionProps {
  form: UseFormReturn<FormData>;
}

const EnhancedPackageSection = ({ form }: EnhancedPackageSectionProps) => {
  const { options: packageOptions } = usePackageTypes();
  const bookingSource = form.watch('bookingSource');
  const isVenuePartner = bookingSource !== 'independent';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Package & Client Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isVenuePartner && (
          <FormField
            control={form.control}
            name="packageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select package type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {packageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="clientSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How did you hear about us?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="referral">Referral from friend/family</SelectItem>
                  <SelectItem value="venue">Venue recommendation</SelectItem>
                  <SelectItem value="vendor">Other vendor recommendation</SelectItem>
                  <SelectItem value="google">Google search</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="website">Our website</SelectItem>
                  <SelectItem value="wedding-show">Wedding show/expo</SelectItem>
                  <SelectItem value="repeat-client">Repeat client</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="contract"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contract Details</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter contract number or reference"
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

export default EnhancedPackageSection;
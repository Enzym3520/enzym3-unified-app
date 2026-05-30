import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CateringSectionProps {
  form: UseFormReturn<FormData>;
}

const CateringSection = ({ form }: CateringSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Catering & Bar Service</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="cateringStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catering Style</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select catering style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="buffet">Buffet Service</SelectItem>
                  <SelectItem value="plated">Plated Service</SelectItem>
                  <SelectItem value="family">Family Style</SelectItem>
                  <SelectItem value="cocktail">Cocktail Reception</SelectItem>
                  <SelectItem value="stations">Food Stations</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mealService"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meal Service</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="brunch">Brunch</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="appetizers">Appetizers Only</SelectItem>
                  <SelectItem value="dessert">Dessert Only</SelectItem>
                  <SelectItem value="none">No Meal Service</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="barService"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bar Service</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bar service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="full">Full Bar</SelectItem>
                  <SelectItem value="beer-wine">Beer & Wine Only</SelectItem>
                  <SelectItem value="signature">Signature Cocktails</SelectItem>
                  <SelectItem value="cash">Cash Bar</SelectItem>
                  <SelectItem value="none">No Bar Service</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedAttendance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Attendance</FormLabel>
              <FormControl>
                <input
                  type="number"
                  min="1"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Expected number of attendees"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="specialDietaryRequests"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Dietary Requests</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List any dietary restrictions, allergies, or special meal requests"
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

export default CateringSection;
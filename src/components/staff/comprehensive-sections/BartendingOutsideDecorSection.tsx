import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { TimeInput12Hour } from '@/components/ui/time-input-12hour';

interface BartendingOutsideDecorSectionProps {
  form: UseFormReturn<FormData>;
}

const BartendingOutsideDecorSection = ({ form }: BartendingOutsideDecorSectionProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">Bartending & Outside Decor</h3>
      
      {/* Bartending Service Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Bartending Service</h4>
        
        <FormField
          control={form.control}
          name="barNoneContract"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Have you signed your contract with Bar None Bartending LLC?</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="bartendingForHowMany"
            render={({ field }) => (
              <FormItem>
                <FormLabel>For How Many?</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Number of guests"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bartendingStartTime"
            render={({ field }) => (
              <TimeInput12Hour
                value={field.value}
                onChange={field.onChange}
                label="Start Time"
                tooltip="When bartending service should begin"
              />
            )}
          />

          <FormField
            control={form.control}
            name="bartendingHoursNeeded"
            render={({ field }) => (
              <FormItem>
                <FormLabel># of Hours Needed</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Hours"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
            name="numberOfBartenders"
            render={({ field }) => (
              <FormItem>
                <FormLabel># of Bartenders</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Number of bartenders"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numberOfBars"
            render={({ field }) => (
              <FormItem>
                <FormLabel># of Bars</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Number of bars"
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
          name="locationOfBars"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location of Bar(s)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter bar locations"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bartendingNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bartending Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional bartending notes"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Outside Decor Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Outside Decor</h4>
        
        <div className="p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800 mb-4">
            <strong>Note:</strong> White or Beige Fabric will be provided on the gazebo as well as various row markers if you choose.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="outsideDecorFabric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fabric Choice</FormLabel>
                <FormControl>
                  <Input
                    placeholder="White or Beige"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rowMarkers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Row Markers</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Describe row markers"
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
          name="floristArchFlowers"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Will florist be bringing in any Arch flowers, row markers, roses for the aisle?</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default BartendingOutsideDecorSection;
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface CeremonyDetailsSectionProps {
  form: UseFormReturn<FormData>;
}

const CeremonyDetailsSection = ({ form }: CeremonyDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Ceremony Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="numberOfBridesmaids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Bridesmaids (including Maid of Honor)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter number"
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
          name="numberOfGroomsmen"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Groomsmen (including Best Man)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter number"
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
          name="numberOfFlowerGirls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Flower Girls</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter number"
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
          name="numberOfRingBearers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Ring Bearers</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter number"
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
        name="whoCarryingRings"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Who will be carrying the Rings?</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter name(s)"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="unityCeremonyType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unity Ceremony Type</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Unity Candle, Sand Ceremony"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="guestBook"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Guest Book?</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="guestBookTable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size of Table</FormLabel>
              <FormControl>
                <Input
                  placeholder="Table size"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sbCardBox"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>SB Card Box?</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="guestBookAttendant"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Guest Book Attendant</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter attendant name"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="officiant"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Officiant</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter officiant name"
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

export default CeremonyDetailsSection;
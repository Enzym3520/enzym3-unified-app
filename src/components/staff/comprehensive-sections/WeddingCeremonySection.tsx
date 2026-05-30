import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { TimeInput12Hour } from '@/components/ui/time-input-12hour';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface WeddingCeremonySectionProps {
  form: UseFormReturn<FormData>;
}

const WeddingCeremonySection = ({ form }: WeddingCeremonySectionProps) => {

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Wedding Ceremony & Reception Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="ceremonyVenue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ceremony Venue</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ceremony venue" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Ceremony Site">Ceremony Site</SelectItem>
                  <SelectItem value="Inside">Inside</SelectItem>
                  <SelectItem value="Pond">Pond</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ceremonyTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Ceremony Time"
              tooltip="The scheduled time for the wedding ceremony"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="receptionVenue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reception Venue</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reception venue" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Patio">Patio</SelectItem>
                  <SelectItem value="Inside">Inside</SelectItem>
                  <SelectItem value="Pond">Pond</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receptionTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Reception Time"
              tooltip="The scheduled time for the wedding reception"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="rehearsalDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rehearsal Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={`w-full pl-3 text-left font-normal ${
                        !field.value && "text-muted-foreground"
                      }`}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick rehearsal date</span>
                      )}
                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rehearsalTime"
          render={({ field }) => (
            <TimeInput12Hour
              value={field.value}
              onChange={field.onChange}
              label="Rehearsal Time"
              tooltip="The scheduled time for the wedding rehearsal"
            />
          )}
        />
      </div>
    </div>
  );
};

export default WeddingCeremonySection;

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { FormData } from '@/types/eventForm';

interface EventDateFieldProps {
  form: UseFormReturn<FormData>;
}

const EventDateField = ({ form }: EventDateFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="weddingDate"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <div className="flex items-center">
            <FormLabel className="font-poppins font-medium">Event Date</FormLabel>
            <FieldTooltip content="Select the date when the event will take place" />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "font-poppins pl-3 text-left font-normal focus:ring-2 focus:ring-enzym3-blue transition-all duration-200 hover:border-enzym3-blue/50",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
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
  );
};

export default EventDateField;

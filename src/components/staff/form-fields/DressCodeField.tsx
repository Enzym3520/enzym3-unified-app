import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shirt } from 'lucide-react';

const DRESS_CODE_OPTIONS = [
  { value: 'formal', label: 'Formal' },
  { value: 'semi-formal', label: 'Semi-Formal' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'business-casual', label: 'Business Casual' },
  { value: 'casual', label: 'Casual' },
  { value: 'themed', label: 'Themed (Custom)' },
];

interface DressCodeFieldProps {
  form: UseFormReturn<FormData>;
}

const DressCodeField = ({ form }: DressCodeFieldProps) => {
  const dressCode = form.watch('dressCode');

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name="dressCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Shirt className="w-4 h-4 text-primary" />
              Dress Code
            </FormLabel>
            <FormControl>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select dress code" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  {DRESS_CODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {dressCode === 'themed' && (
        <FormField
          control={form.control}
          name="dressCodeCustom"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">
                Theme Description
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Great Gatsby, Western, etc."
                  {...field}
                  className="h-10 border-border/60 focus:border-primary/40"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default DressCodeField;

import React from 'react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { TimeInput12Hour } from '@/components/ui/time-input-12hour';
import WizardNavigation from '@/components/staff/wizard/WizardNavigation';
import ContractPackageFields from '@/components/staff/form-fields/ContractPackageFields';
import { useFormWizard } from '@/contexts/FormWizardContext';
import DressCodeField from '@/components/staff/form-fields/DressCodeField';

const Step2EventDetails = () => {
  const { form } = useFormWizard();

  const validateStep = async () => {
    const result = await form.trigger(['weddingDate', 'numberOfGuests']);
    return result;
  };

  return (
    <Card className="shadow-xl border-0 bg-card backdrop-blur-md rounded-2xl md:rounded-3xl overflow-hidden animate-fade-in mx-auto max-w-4xl">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/20 px-4 md:px-6 py-4 md:py-6">
        <CardTitle className="text-xl md:text-2xl font-playfair text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Event Details
        </CardTitle>
        <p className="text-center text-muted-foreground text-sm mt-2">
          Provide the essential details about your event
        </p>
      </CardHeader>
      <CardContent className="p-4 md:p-8">
        <Form {...form}>
          <div className="space-y-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="weddingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date *</FormLabel>
                      <FormControl>
                        <EnhancedInput 
                          type="date" 
                          value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : field.value || ''}
                          onChange={(e) => {
                            const dateValue = e.target.value;
                            field.onChange(dateValue ? parseLocalDate(dateValue) : undefined);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Guests *</FormLabel>
                      <FormControl>
                        <EnhancedInput
                          type="number"
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : Number(value));
                          }}
                          className="font-poppins focus:ring-2 focus:ring-enzym3-blue"
                          placeholder="Enter number of guests"
                          min="1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                <DressCodeField form={form} />
              </div>
            </div>
            <div className="animate-fade-in border-t border-border/20 pt-6" style={{ animationDelay: '0.2s' }}>
              <ContractPackageFields form={form} />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <WizardNavigation onNext={validateStep} />
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Step2EventDetails;
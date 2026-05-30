import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import CoordinatorVendorFields from '@/components/staff/form-fields/CoordinatorVendorFields';
import VendorEventTypeFields from '@/components/staff/form-fields/VendorEventTypeFields';
import BookingTypeFields from '@/components/staff/form-fields/BookingTypeFields';
import WizardNavigation from '@/components/staff/wizard/WizardNavigation';
import { useFormWizard } from '@/contexts/FormWizardContext';

const Step1CoordinatorVendor = () => {
  const { form } = useFormWizard();

  const validateStep = async () => {
    const eventType = form.getValues('eventType');
    const vendorType = form.getValues('vendorType');
    const fieldsToValidate = ['from', 'vendorType', 'eventType', 'venue'];
    
    if (eventType === 'other') {
      fieldsToValidate.push('customEventType');
    }
    
    if (vendorType === 'dj') {
      fieldsToValidate.push('assignedDjId');
    }
    
    const result = await form.trigger(fieldsToValidate as any);
    return result;
  };

  return (
    <Card className="shadow-xl border-0 bg-card backdrop-blur-md rounded-2xl md:rounded-3xl overflow-hidden animate-fade-in mx-auto max-w-4xl">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/20 px-4 md:px-6 py-4 md:py-6">
        <CardTitle className="text-xl md:text-2xl font-playfair text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Event Planner & Vendor Information
        </CardTitle>
        <p className="text-center text-muted-foreground text-sm md:text-base mt-2">
          Tell us about the event planner and vendors involved
        </p>
      </CardHeader>
      <CardContent className="p-4 md:p-8">
        <Form {...form}>
          <div className="space-y-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CoordinatorVendorFields form={form} />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <VendorEventTypeFields form={form} />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <BookingTypeFields form={form} />
            </div>
            {/* Hidden Wedding ID Field */}
            <input type="hidden" {...form.register('wedding_id')} />
            
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <WizardNavigation onNext={validateStep} />
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Step1CoordinatorVendor;
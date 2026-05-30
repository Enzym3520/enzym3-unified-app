import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import WizardNavigation from '@/components/staff/wizard/WizardNavigation';
import { useFormWizard } from '@/contexts/FormWizardContext';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import { useFormProgress } from '@/hooks/useFormProgress';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SuccessScreen from './SuccessScreen';
import CoordinatorVendorSection from './CoordinatorVendorSection';
import EventDetailsSection from './EventDetailsSection';
import ContactDetailsSection from './ContactDetailsSection';
import FileUploadSection from './FileUploadSection';

const Step4ReviewSubmit = () => {
  const { form, uploadedFiles, setUploadedFiles, setCurrentStep } = useFormWizard();
  const { isSubmitting, submitForm } = useFormSubmission();
  const formProgress = useFormProgress(form);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formData = form.getValues();

  const handleSubmit = async () => {
    // Always get fresh values at submit time
    const currentData = form.getValues();
    const success = await submitForm(currentData, uploadedFiles[0] || null, formProgress);
    if (success) {
      setSubmitted(true);
      form.reset();
      setUploadedFiles([]);
    }
    return success;
  };

  const handleStartAnother = () => {
    setSubmitted(false);
    setCurrentStep(1);
    navigate('/event-notification/step-1');
  };

  if (submitted) {
    return <SuccessScreen onStartAnother={handleStartAnother} />;
  }

  // Show validation errors as toast when user tries to submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = form.formState.errors;
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const errorMessages = errorKeys.map(k => (errors as any)[k]?.message || k).join(', ');
      toast({
        title: "Validation Issues",
        description: `Please fix: ${errorMessages}`,
        variant: "destructive",
      });
    }
    await handleSubmit();
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-white/95 backdrop-blur-md rounded-3xl overflow-hidden animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/20">
        <CardTitle className="text-2xl font-playfair text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Review & Submit
        </CardTitle>
        <p className="text-center text-muted-foreground text-sm mt-2">
          Please review all the information before submitting
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-8">
            <CoordinatorVendorSection formData={formData} />
            
            <Separator className="border-border/30" />
            
            <EventDetailsSection formData={formData} />
            
            <Separator className="border-border/30" />
            
            <ContactDetailsSection formData={formData} />

            {uploadedFiles.length > 0 && uploadedFiles[0] && (
              <>
                <Separator className="border-border/30" />
                <FileUploadSection uploadedFile={uploadedFiles[0]} />
              </>
            )}

            <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <WizardNavigation 
                isLastStep={true}
                isSubmitting={isSubmitting}
                onNext={handleSubmit}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Step4ReviewSubmit;
import React, { useEffect } from 'react';
import { useFormWizard } from '@/contexts/FormWizardContext';

const FormAnalytics = () => {
  const { form, currentStep, prePopData } = useFormWizard();

  useEffect(() => {
    // Track form step navigation
    const analytics = {
      step: currentStep,
      timestamp: new Date().toISOString(),
      prePopulated: !!prePopData,
      prePopSource: prePopData?.context?.source || null,
      fieldsCount: Object.keys(form.getValues()).filter(key => {
        const value = form.getValues(key as any);
        return value !== '' && value !== null && value !== undefined;
      }).length
    };

    // In a real app, you'd send this to your analytics service
    if (import.meta.env.DEV) console.log('Form Analytics:', analytics);
  }, [currentStep, form, prePopData]);

  return null; // This component doesn't render anything
};

export default FormAnalytics;
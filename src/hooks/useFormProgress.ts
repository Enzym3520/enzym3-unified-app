
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';

export const useFormProgress = (form: UseFormReturn<FormData>) => {
  const [formProgress, setFormProgress] = useState(0);

  const watchedValues = form.watch();

  useEffect(() => {
    const requiredFields = [
      'from', 'vendors', 'vendorType', 'eventType', 'weddingDate', 
      'numberOfGuests', 'brideName', 'groomName', 'bridePhone', 
      'groomPhone', 'brideEmail', 'groomEmail'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const value = watchedValues[field as keyof FormData];
      if (field === 'numberOfGuests') {
        return typeof value === 'number' && value > 0;
      }
      return value !== undefined && value !== null && value !== '' && value !== 0;
    });
    
    const progress = (completedFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [watchedValues]);

  return formProgress;
};

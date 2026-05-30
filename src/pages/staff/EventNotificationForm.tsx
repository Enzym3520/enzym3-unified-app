
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MultiStepFormWizard from '@/components/MultiStepFormWizard';

const EventNotificationForm = () => {
  const { stepParam } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // If no step parameter, redirect to step 1
    if (!stepParam) {
      navigate('/event-notification/step-1', { replace: true });
    }
  }, [stepParam, navigate]);

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary mb-4">Event Notification</h1>
        <MultiStepFormWizard />
      </div>
    </div>
  );
};

export default EventNotificationForm;

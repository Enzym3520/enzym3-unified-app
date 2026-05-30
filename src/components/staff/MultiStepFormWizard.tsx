import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormWizardProvider, useFormWizard } from '@/contexts/FormWizardContext';
import WizardProgressIndicator from '@/components/staff/wizard/WizardProgressIndicator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, X, RotateCcw } from 'lucide-react';
import { defaultValues } from '@/types/eventForm';

import FormAnalytics from '@/components/staff/form-fields/FormAnalytics';
import Step1CoordinatorVendor from '@/components/staff/steps/Step1CoordinatorVendor';
import Step2EventDetails from '@/components/staff/steps/Step2EventDetails';
import Step3ContactDetails from '@/components/staff/steps/Step3ContactDetails';
import Step4ReviewSubmit from '@/components/staff/steps/Step4ReviewSubmit';

const stepTitles = ['Coordinator & Vendor', 'Event Details', 'Contact Info', 'Review & Submit'];

const formatTimeAgo = (timestamp: number): string => {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return 'over a day ago';
};

const WizardContent = () => {
  const { stepParam } = useParams();
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, totalSteps, hasDraft, clearDraft, draftTimestamp, draftStep, form, setUploadedFiles } = useFormWizard();
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Show draft banner on first mount if draft exists
  useEffect(() => {
    if (hasDraft && !bannerDismissed) {
      setShowDraftBanner(true);
    }
  }, [hasDraft, bannerDismissed]);

  useEffect(() => {
    if (stepParam) {
      const stepNumber = parseInt(stepParam.replace('step-', ''));
      if (stepNumber >= 1 && stepNumber <= totalSteps && stepNumber !== currentStep) {
        setCurrentStep(stepNumber);
      }
    } else {
      navigate('/staff/event-notification/step-1', { replace: true });
    }
  }, [stepParam, currentStep, setCurrentStep, totalSteps, navigate]);

  const handleResumeDraft = () => {
    const resumeStep = draftStep || 1;
    setCurrentStep(resumeStep);
    navigate(`/staff/event-notification/step-${resumeStep}`, { replace: true });
    setShowDraftBanner(false);
    setBannerDismissed(true);
  };

  const handleStartFresh = () => {
    clearDraft();
    form.reset({
      ...defaultValues,
      wedding_id: crypto.randomUUID(),
    });
    setUploadedFiles([]);
    setCurrentStep(1);
    navigate('/staff/event-notification/step-1', { replace: true });
    setShowDraftBanner(false);
    setBannerDismissed(true);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1CoordinatorVendor />;
      case 2:
        return <Step2EventDetails />;
      case 3:
        return <Step3ContactDetails />;
      case 4:
        return <Step4ReviewSubmit />;
      default:
        return <Step1CoordinatorVendor />;
    }
  };

  return (
    <div className="space-y-6">
      <FormAnalytics />

      {showDraftBanner && (
        <Alert className="border-primary/30 bg-primary/5">
          <FileText className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-semibold">You have a saved draft</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-muted-foreground text-sm mb-3">
              Last saved {draftTimestamp ? formatTimeAgo(draftTimestamp) : 'recently'} (Step {draftStep || 1} of {totalSteps}).
              {' '}Uploaded files will need to be re-attached.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleResumeDraft} className="rounded-lg">
                Resume Draft
              </Button>
              <Button size="sm" variant="outline" onClick={handleStartFresh} className="rounded-lg">
                <RotateCcw className="w-3 h-3 mr-1" />
                Start Fresh
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowDraftBanner(false); setBannerDismissed(true); }}
                className="ml-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <WizardProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitles={stepTitles}
      />
      {renderStep()}
    </div>
  );
};

const MultiStepFormWizard = () => {
  const { stepParam } = useParams();
  const initialStep = stepParam ? parseInt(stepParam.replace('step-', '')) : 1;

  return (
    <FormWizardProvider initialStep={initialStep}>
      <WizardContent />
    </FormWizardProvider>
  );
};

export default MultiStepFormWizard;

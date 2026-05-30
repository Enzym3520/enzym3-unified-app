import React, { createContext, useContext, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormData, formSchema, defaultValues } from '@/types/eventForm';
import { useFormPrePopulation } from '@/hooks/useFormPrePopulation';

interface FormWizardContextType {
  form: ReturnType<typeof useForm<FormData>>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  totalSteps: number;
  prePopData: any;
  showPrePopBanner: boolean;
  dismissPrePopBanner: () => void;
  hasDraft: boolean;
  clearDraft: () => void;
  draftTimestamp: number | null;
  draftStep: number | null;
}

const FormWizardContext = createContext<FormWizardContextType | undefined>(undefined);

export const useFormWizard = () => {
  const context = useContext(FormWizardContext);
  if (!context) {
    throw new Error('useFormWizard must be used within a FormWizardProvider');
  }
  return context;
};

interface FormWizardProviderProps {
  children: React.ReactNode;
  initialStep?: number;
}

export const FormWizardProvider = ({ children, initialStep = 1 }: FormWizardProviderProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showPrePopBanner, setShowPrePopBanner] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const [draftStep, setDraftStep] = useState<number | null>(null);
  const totalSteps = 4;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      wedding_id: crypto.randomUUID(),
    },
    mode: 'onChange',
  });

  const { data: prePopData } = useFormPrePopulation();

  // Auto-populate form when pre-population data is available
  useEffect(() => {
    if (prePopData?.fieldMappings) {
      Object.entries(prePopData.fieldMappings).forEach(([key, value]) => {
        if (value && value !== '' && form.getValues(key as any) === '') {
          form.setValue(key as any, value);
        }
      });
    }
  }, [prePopData, form]);

  // Auto-fill coordinator name from last successful submission
  useEffect(() => {
    const currentFrom = form.getValues('from');
    if (!currentFrom) {
      const lastCoordinator = localStorage.getItem('lastCoordinatorName');
      if (lastCoordinator) {
        form.setValue('from', lastCoordinator, { shouldDirty: false });
      }
    }
  }, [form]);

  // Load draft from localStorage with expiration check
  useEffect(() => {
    const DRAFT_EXPIRY_HOURS = 24;
    const DRAFT_KEY = 'eventFormDraft';

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draftData = JSON.parse(raw);
        
        // Check if draft has timestamp (new format)
        if (draftData.timestamp) {
          const ageHours = (Date.now() - draftData.timestamp) / (1000 * 60 * 60);
          
          if (ageHours > DRAFT_EXPIRY_HOURS) {
            localStorage.removeItem(DRAFT_KEY);
            setHasDraft(false);
            if (import.meta.env.DEV) console.log('Draft expired and removed');
            return;
          }
          
          setHasDraft(true);
          setDraftTimestamp(draftData.timestamp);
          setDraftStep(draftData.step || 1);
          
          // Load the draft data with date coercion
          const dateFields = ['weddingDate', 'rehearsalDate', 'todaysDate', 'eventDate'];
          Object.entries(draftData.data).forEach(([key, value]) => {
            if (value !== undefined) {
              const coerced = dateFields.includes(key) && typeof value === 'string' ? new Date(value) : value;
              form.setValue(key as any, coerced as any, { shouldDirty: false });
            }
          });
        } else {
          // Legacy format without timestamp - migrate it
          setHasDraft(true);
          setDraftTimestamp(Date.now());
          setDraftStep(1);
          const dateFields = ['weddingDate', 'rehearsalDate', 'todaysDate', 'eventDate'];
          Object.entries(draftData).forEach(([key, value]) => {
            if (value !== undefined) {
              const coerced = dateFields.includes(key) && typeof value === 'string' ? new Date(value) : value;
              form.setValue(key as any, coerced as any, { shouldDirty: false });
            }
          });
          
          // Update to new format with timestamp
          const newDraft = {
            data: draftData,
            timestamp: Date.now(),
            step: 1
          };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(newDraft));
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load draft:', error);
      localStorage.removeItem('eventFormDraft');
      setHasDraft(false);
    }
  }, [form]);

  // Auto-save draft on changes with timestamp
  useEffect(() => {
    const DRAFT_KEY = 'eventFormDraft';
    
    const subscription = form.watch(() => {
      const values = form.getValues();
      const draft = {
        data: values,
        timestamp: Date.now(),
        step: currentStep
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [form.formState.isDirty]);

  const dismissPrePopBanner = () => setShowPrePopBanner(false);

  const clearDraft = () => {
    localStorage.removeItem('eventFormDraft');
    setHasDraft(false);
    setDraftTimestamp(null);
    setDraftStep(null);
    if (import.meta.env.DEV) console.log('Draft cleared manually');
  };

  return (
    <FormWizardContext.Provider
      value={{
        form,
        currentStep,
        setCurrentStep,
        uploadedFiles,
        setUploadedFiles,
        totalSteps,
        prePopData,
        showPrePopBanner: showPrePopBanner && !!prePopData,
        dismissPrePopBanner,
        hasDraft,
        clearDraft,
        draftTimestamp,
        draftStep,
      }}
    >
      {children}
    </FormWizardContext.Provider>
  );
};
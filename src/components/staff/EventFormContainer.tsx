
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { FormData, formSchema, defaultValues } from '@/types/eventForm';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import { useFormProgress } from '@/hooks/useFormProgress';
import { useFormRateLimit } from '@/hooks/useFormRateLimit';
import FormHeader from '@/components/form-fields/FormHeader';
import EventDetailsSection from '@/components/form-fields/EventFieldsGroup';
import ContactDetailsSection from '@/components/form-fields/ContactFieldsGroup';
import EnhancedFileUpload from '@/components/form-fields/EnhancedFileUpload';
import EnhancedSubmitButton from '@/components/form-fields/EnhancedSubmitButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const EventFormContainer = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { isSubmitting, submitForm } = useFormSubmission();
  const { isLimited, remainingAttempts, resetTime, checkRateLimit, recordSubmission } = useFormRateLimit();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const formProgress = useFormProgress(form);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
      toast({
        title: "Files uploaded",
        description: `${files.length} file${files.length > 1 ? 's' : ''} added successfully`,
      });
    }
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "File removed",
      description: "File has been removed successfully",
    });
  };

  const onSubmit = async (data: FormData) => {
    // Check rate limit before submission
    if (!checkRateLimit()) {
      toast({
        title: "Too many submissions",
        description: `Please wait until ${resetTime?.toLocaleTimeString()} before submitting again.`,
        variant: "destructive",
      });
      return;
    }

    const success = await submitForm(data, uploadedFiles[0] || null, formProgress);

    if (success) {
      recordSubmission();
      form.reset();
      setUploadedFiles([]);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-card backdrop-blur-sm">
      <FormHeader formProgress={formProgress} />
      <CardContent>
        {isLimited && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached the submission limit. Please try again after {resetTime?.toLocaleTimeString()}.
            </AlertDescription>
          </Alert>
        )}

        {!isLimited && remainingAttempts <= 2 && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {remainingAttempts} submission{remainingAttempts !== 1 ? 's' : ''} remaining in this hour.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <EventDetailsSection form={form} />
            <ContactDetailsSection form={form} />
            <EnhancedFileUpload
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
            />
            <EnhancedSubmitButton
              isSubmitting={isSubmitting || isLimited}
              formProgress={formProgress}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EventFormContainer;

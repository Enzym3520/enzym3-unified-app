import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import ContactDetailsSection from '@/components/staff/form-fields/ContactFieldsGroup';
import EnhancedFileUpload from '@/components/staff/form-fields/EnhancedFileUpload';
import WizardNavigation from '@/components/staff/wizard/WizardNavigation';
import { useFormWizard } from '@/contexts/FormWizardContext';
import { useToast } from '@/hooks/use-toast';

const Step3ContactDetails = () => {
  const { form, uploadedFiles, setUploadedFiles } = useFormWizard();
  const { toast } = useToast();
  const eventType = form.watch('eventType');

  const getHeaderContent = () => {
    switch (eventType) {
      case 'wedding':
        return {
          title: 'Contact Information',
          description: 'Please provide contact details for both bride and groom'
        };
      case 'quince':
        return {
          title: 'Contact Information',
          description: 'Please provide contact details for the quinceañera and parent/guardian'
        };
      case 'birthday':
      case 'sweet16':
        return {
          title: 'Contact Information',
          description: 'Please provide contact details for the honoree and organizer'
        };
      case 'banquet':
      case 'graduation':
        return {
          title: 'Contact Information',
          description: 'Please provide primary contact details for the event'
        };
      default:
        return {
          title: 'Contact Information',
          description: 'Please provide contact details for the event'
        };
    }
  };

  const validateStep = async () => {
    switch (eventType) {
      case 'wedding':
        const basicFieldsValid = await form.trigger(['brideName', 'groomName', 'bridePhone', 'groomPhone']);
        const brideEmail = form.getValues('brideEmail');
        const groomEmail = form.getValues('groomEmail');
        
        if (basicFieldsValid && (!brideEmail && !groomEmail)) {
          form.setError('brideEmail', { message: 'At least one email is required' });
          return false;
        }
        
        return basicFieldsValid;
      case 'quince':
        return await form.trigger(['quinceaneraName', 'parentName', 'parentPhone', 'parentEmail']);
      case 'birthday':
      case 'sweet16':
        return await form.trigger(['honoreeName', 'parentName', 'parentPhone', 'parentEmail']);
      case 'banquet':
      case 'graduation':
        return await form.trigger(['contactName', 'contactPhone', 'contactEmail']);
      default:
        return true;
    }
  };

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

  const headerContent = getHeaderContent();

  return (
    <Card className="shadow-xl border-0 bg-card backdrop-blur-md rounded-2xl md:rounded-3xl overflow-hidden animate-fade-in mx-auto max-w-4xl">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/20 px-4 md:px-6 py-4 md:py-6">
        <CardTitle className="text-xl md:text-2xl font-playfair text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          {headerContent.title}
        </CardTitle>
        <p className="text-center text-muted-foreground text-sm mt-2">
          {headerContent.description}
        </p>
      </CardHeader>
      <CardContent className="p-4 md:p-8">
        <Form {...form}>
          <div className="space-y-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <ContactDetailsSection form={form} />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <EnhancedFileUpload 
                uploadedFiles={uploadedFiles} 
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
              />
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

export default Step3ContactDetails;
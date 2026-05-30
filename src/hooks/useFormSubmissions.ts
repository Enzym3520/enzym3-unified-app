import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { FormSubmission } from '@/types/contact';

interface FormSubmissionDB {
  id: string;
  wedding_id: string;
  form_template_id: string;
  form_data: Json;
  contact_email: string;
  contact_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  pdf_generated_at?: string;
  email_sent_at?: string;
  webhook_url?: string;
  webhook_sent_at?: string;
  metadata: Json;
}

export const useFormSubmissions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWeddingId = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_wedding_id');
      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error('Failed to generate wedding ID');
    }
  };

  const submitForm = async (
    formTemplateId: string,
    formData: Record<string, any>,
    webhookUrl?: string
  ): Promise<FormSubmission> => {
    try {
      setLoading(true);
      setError(null);

      // Generate wedding ID
      const weddingId = await generateWeddingId();

      // Extract contact information from form data
      const contactEmail = formData.primary_contact_email || formData.contact_email || '';
      const contactName = formData.primary_contact_name || formData.contact_name || '';

      if (!contactEmail || !contactName) {
        throw new Error('Contact email and name are required');
      }

      const submissionData = {
        wedding_id: weddingId,
        form_template_id: formTemplateId,
        form_data: formData as Json,
        contact_email: contactEmail,
        contact_name: contactName,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString(),
        webhook_url: webhookUrl,
        metadata: {
          submitted_from: window.location.origin,
          user_agent: navigator.userAgent,
        } as Json
      };

      const { data, error } = await supabase
        .from('form_submissions')
        .insert([submissionData])
        .select()
        .single();

      if (error) throw error;

      // Convert DB data to our interface
      const formattedData: FormSubmission = {
        ...data,
        form_data: data.form_data as Record<string, any>,
        status: data.status as FormSubmission['status'],
        metadata: data.metadata as Record<string, any>
      };

      // Trigger email and PDF generation
      await processSubmission(formattedData.id);

      return formattedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit form';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const processSubmission = async (submissionId: string) => {
    try {
      // Call edge function to process submission (generate PDF and send email)
      const { error } = await supabase.functions.invoke('process-form-submission', {
        body: { submissionId }
      });

      if (error) {
        if (import.meta.env.DEV) console.error('Error processing submission:', error);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error calling process submission function:', err);
    }
  };

  const getSubmissions = async (filters?: {
    wedding_id?: string;
    contact_email?: string;
    status?: string;
  }) => {
    try {
      let query = supabase.from('form_submissions').select('*');

      if (filters?.wedding_id) {
        query = query.eq('wedding_id', filters.wedding_id);
      }
      if (filters?.contact_email) {
        query = query.eq('contact_email', filters.contact_email);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(500);

      if (error) throw error;
      
      // Convert DB data to our interface
      const formattedData: FormSubmission[] = (data || []).map((item: FormSubmissionDB) => ({
        ...item,
        form_data: item.form_data as Record<string, any>,
        status: item.status as FormSubmission['status'],
        metadata: item.metadata as Record<string, any>
      }));
      
      return formattedData;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch submissions');
    }
  };

  return {
    submitForm,
    getSubmissions,
    generateWeddingId,
    loading,
    error
  };
};
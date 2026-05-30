import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormSubmission } from '@/types/contact';

export const useContactFormSubmissions = (contactEmail?: string) => {
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFormSubmissions = async (email?: string) => {
    if (!email) return;
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (email) {
        query = query.eq('contact_email', email);
      }

      const { data, error: fetchError } = await query.limit(500);

      if (fetchError) throw fetchError;

      const transformedData: FormSubmission[] = (data || []).map(submission => ({
        id: submission.id,
        wedding_id: submission.wedding_id,
        form_template_id: submission.form_template_id,
        form_data: submission.form_data as Record<string, any>,
        contact_email: submission.contact_email,
        contact_name: submission.contact_name,
        status: submission.status as FormSubmission['status'],
        created_at: submission.created_at,
        updated_at: submission.updated_at,
        submitted_at: submission.submitted_at || undefined,
        pdf_generated_at: submission.pdf_generated_at || undefined,
        email_sent_at: submission.email_sent_at || undefined,
        webhook_url: submission.webhook_url || undefined,
        webhook_sent_at: submission.webhook_sent_at || undefined,
        metadata: submission.metadata as Record<string, any>
      }));

      setFormSubmissions(transformedData);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching form submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch form submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contactEmail) {
      fetchFormSubmissions(contactEmail);
    }
  }, [contactEmail]);

  return {
    formSubmissions,
    loading,
    error,
    refetch: () => fetchFormSubmissions(contactEmail)
  };
};
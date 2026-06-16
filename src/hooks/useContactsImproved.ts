import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contact, FormSubmission, UploadedDetailsForm } from '@/types/contact';
import { EventNotification } from '@/types/notification';
import { CreateReminderData } from '@/types/reminder';
import { generateAutomaticReminders } from '@/utils/reminderEngine';
import { transformNotificationsToContacts } from '@/utils/contactHelpers';
import { contactManager } from '@/utils/contactManager';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/utils/performance';

export const useContactsImproved = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Fetch event notifications with React Query
  const { data: notificationsData = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['contacts-event-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch form submissions with React Query
  const { data: formSubmissionsData = [], isLoading: formSubmissionsLoading } = useQuery({
    queryKey: ['form-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch uploaded details forms with React Query
  const { data: uploadedFormsData = [], isLoading: uploadedFormsLoading } = useQuery({
    queryKey: ['uploaded-details-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uploaded_details_forms')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Transform and memoize contacts
  const contacts = useMemo(() => {
    if (!notificationsData.length && !formSubmissionsData.length) {
      return [];
    }

    // Transform notifications
    const transformedNotifications: EventNotification[] = notificationsData.map(notification => ({
      id: notification.id,
      couple_name: notification.couple_name,
      contact_email: notification.contact_email,
      contact_phone: notification.contact_phone,
      event_date: notification.event_date,
      event_type: notification.event_type,
      venue: notification.venue,
      coordinator_name: notification.coordinator_name,
      dj_name: notification.dj_name,
      package_type: notification.package_type,
      status: (notification.status === 'submitted' || notification.status === 'in_progress' || notification.status === 'completed') 
        ? notification.status 
        : 'submitted',
      submitted_by: notification.submitted_by,
      notes: notification.notes,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
      file_uploaded: notification.file_uploaded,
      form_progress: notification.form_progress,
      edit_count: notification.edit_count,
      resend_count: notification.resend_count,
      printed_at: notification.printed_at,
      edited_at: notification.edited_at,
      last_resent_at: notification.last_resent_at,
      additional_metadata: typeof notification.additional_metadata === 'object' && notification.additional_metadata !== null 
        ? notification.additional_metadata as Record<string, any>
        : {},
      ip_address: notification.ip_address,
      user_agent: notification.user_agent,
      webhook_url: notification.webhook_url,
      webhook_status_code: notification.webhook_status_code,
      webhook_response: notification.webhook_response
    }));

    // Transform form submissions
    const transformedFormSubmissions: FormSubmission[] = formSubmissionsData.map(submission => ({
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

    // Transform uploaded details forms
    const transformedUploadedForms: UploadedDetailsForm[] = uploadedFormsData.map(form => ({
      id: form.id,
      wedding_id: form.wedding_id || null,
      file_path: form.file_path,
      file_name: form.file_name,
      file_type: form.file_type,
      uploaded_by: form.uploaded_by,
      notes: form.notes || undefined,
      uploaded_at: form.uploaded_at,
      created_at: form.created_at
    }));

    const transformedContacts = transformNotificationsToContacts(
      transformedNotifications, 
      transformedFormSubmissions, 
      transformedUploadedForms
    );

    if (import.meta.env.DEV) console.log(`✅ Contacts transformed: ${transformedContacts.length} contacts`);
    return transformedContacts;
  }, [notificationsData, formSubmissionsData, uploadedFormsData]);

  // Memoized contact manager instance that updates only when contacts change
  const contactManagerInstance = useMemo(() => {
    contactManager.updateContacts(contacts);
    return contactManager;
  }, [contacts]);

  const generateRemindersForContact = async (contact: Contact, requireApproval = true) => {
    try {
      const reminders = generateAutomaticReminders(contact);
      
      if (reminders.length === 0) {
        toast({
          title: 'No Reminders Generated',
          description: 'No automatic reminders were generated for this contact.',
        });
        return [];
      }

      // Set status based on approval requirement
      const remindersWithStatus = reminders.map(reminder => ({
        ...reminder,
        status: requireApproval ? 'pending_approval' : 'approved'
      }));

      // Save reminders to database
      const { data, error } = await supabase
        .from('reminders')
        .insert(remindersWithStatus)
        .select();

      if (error) throw error;

      toast({
        title: 'Reminders Generated',
        description: `Generated ${reminders.length} automatic reminders for ${contact.name}.`,
      });

      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error generating reminders:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate reminders. Please try again.',
        variant: 'destructive'
      });
      return [];
    }
  };

  // Debounced refetch function
  const debouncedInvalidate = useMemo(
    () => debounce(() => {
      const now = Date.now();
      // Only refetch if at least 500ms passed since last update
      if (now - lastUpdateRef.current > 500) {
        if (import.meta.env.DEV) console.log('🔄 Invalidating queries due to real-time update');
        queryClient.invalidateQueries({ queryKey: ['contacts-event-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        queryClient.invalidateQueries({ queryKey: ['uploaded-details-forms'] });
        setLastRefresh(new Date());
        lastUpdateRef.current = now;
      }
    }, 500),
    [queryClient]
  );

  // Real-time subscription with optimistic updates.
  // Unique channel name per mount to avoid collisions if this hook is ever used
  // by more than one component (the shared static name was a latent footgun).
  useEffect(() => {
    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`contacts-realtime-${suffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_notification_history'
        },
        (payload) => {
          if (import.meta.env.DEV) console.log('🔄 Real-time event detected:', payload.eventType);
          debouncedInvalidate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'form_submissions'
        },
        (payload) => {
          if (import.meta.env.DEV) console.log('🔄 Real-time form submission update:', payload.eventType);
          debouncedInvalidate();
        }
      )
      .subscribe((status, err) => {
        if (import.meta.env.DEV && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
          console.warn('Contacts realtime channel error:', status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debouncedInvalidate]);

  // Set last refresh on initial load
  useEffect(() => {
    if (contacts.length > 0 && !lastRefresh) {
      setLastRefresh(new Date());
    }
  }, [contacts, lastRefresh]);

  const loading = notificationsLoading || formSubmissionsLoading || uploadedFormsLoading;
  const error = null; // React Query handles errors internally

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contacts-event-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['uploaded-details-forms'] });
    setLastRefresh(new Date());
  }, [queryClient]);

  return {
    contacts,
    loading,
    error,
    lastRefresh,
    cacheKey: `${contacts.length}-${lastRefresh?.getTime() || 0}`,
    refetch,
    generateRemindersForContact,
    contactManager: contactManagerInstance
  };
};
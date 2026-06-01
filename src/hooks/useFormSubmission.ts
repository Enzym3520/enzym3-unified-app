
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FormData } from '@/types/eventForm';
import { API_CONFIG, sanitizeFormData } from '@/config/api';
import { supabase } from '@/integrations/supabase/client';
import { validateFormByEventType } from '@/utils/formValidation';
import { buildEventPayload } from '@/utils/payloadBuilder';
import { buildNotificationData } from '@/utils/notificationDataBuilder';

/** Extract the best contact email from form data with explicit field priority */
function extractContactEmail(data: Record<string, unknown>): string {
  const candidates = ['contactEmail', 'brideEmail', 'groomEmail', 'parentEmail', 'email'];
  for (const key of candidates) {
    const val = data[key];
    if (typeof val === 'string' && val.includes('@')) {
      return val;
    }
  }
  return 'unknown@example.com';
}

export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitForm = async (data: FormData, uploadedFile: File | null, formProgress: number) => {
    setIsSubmitting(true);
    
    try {
      // Proceed without webhook URL validation (handled by Edge Function)

      // Sanitize form data
      const sanitizedData = sanitizeFormData(data);
      
      // Dynamic validation check based on event type
      const validation = validateFormByEventType(sanitizedData);
      
      if (!validation.isValid) {
        if (API_CONFIG.ENABLE_DEBUG_LOGGING) {
          console.error("Missing required fields:", validation.missingFields);
        }
        toast({
          title: "Validation Error",
          description: `Missing required fields: ${validation.missingFields.join(', ')}`,
          variant: "destructive",
        });
        return false;
      }

      // Create payload structure using sanitized data
      const payload = buildEventPayload(sanitizedData, uploadedFile, formProgress);

      if (API_CONFIG.ENABLE_DEBUG_LOGGING) {
        console.log("Built payload:", JSON.stringify(payload, null, 2));
      }

      // Extract contact email for notification
      const contactEmail = extractContactEmail(sanitizedData as Record<string, unknown>);

      // Build compact notification record and save first
      const notificationData = buildNotificationData(sanitizedData, uploadedFile, formProgress, payload) as any;
      
      // Override submitted_by with authenticated user's name from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
          const submitterName = profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.first_name || profile.email || data.from;
          
          notificationData.submitted_by = submitterName;
        }
      }
      
      notificationData.contact_email = contactEmail;
      notificationData.additional_metadata = {
        ...(notificationData.additional_metadata || {}),
        // wedding_id is now stamped server-side (equal to row id) by the RPC
        processing_invoked: false
      };

      const { data: createdId, error: createError } = await supabase
        .rpc('create_event_notification', { p_data: notificationData });

      if (createError || !createdId) {
        throw new Error(`Failed to save notification via RPC: ${createError?.message || 'Unknown error'}`);
      }

      const notificationId = createdId as string;

      if (API_CONFIG.ENABLE_DEBUG_LOGGING) {
        console.log('Saved notification:', { id: notificationId, wedding_id_equals_id: true });
      }

      // Create vendor assignments from the form's MultiVendorSelector
      const assignedVendors = (data as any).assignedVendors as Array<{ vendorId?: string; vendorName?: string; vendorType?: string }> | undefined;
      let assignedVendorNames: string[] = [];
      if (Array.isArray(assignedVendors) && assignedVendors.length > 0 && user) {
        // Deduplicate by vendorId in case the user added the same vendor twice
        const seen = new Set<string>();
        const validVendors = assignedVendors.filter(v => {
          if (!v?.vendorId || seen.has(v.vendorId)) return false;
          seen.add(v.vendorId);
          return true;
        });
        const rows = validVendors.map(v => ({
          event_id: notificationId,
          event_notification_id: notificationId,
          dj_user_id: v.vendorId!,
          assigned_by: user.id,
          status: 'assigned',
        }));
        if (rows.length > 0) {
          const { error: assignError } = await supabase
            .from('event_dj_assignments')
            .insert(rows);
          if (assignError) {
            console.error('Failed to create vendor assignments:', assignError);
            toast({
              title: "Vendor assignment failed",
              description: `The event was saved, but assigning vendors failed: ${assignError.message}. Please assign them manually from the event notification.`,
              variant: "destructive",
            });
          } else {
            assignedVendorNames = validVendors.map(v => v.vendorName).filter(Boolean) as string[];
            // Sync dj_name on the notification record so the assigned vendors show up in lists
            if (assignedVendorNames.length > 0) {
              await supabase
                .from('event_notification_history')
                .update({ dj_name: assignedVendorNames.join(', ') })
                .eq('id', notificationId);
            }
          }
        }
      }

      // Invoke Edge Function to process notification (email, optional webhook)
      const { data: processResult, error: processError } = await supabase.functions.invoke('process-form-submission', {
        body: { notificationId }
      });

      if (API_CONFIG.ENABLE_DEBUG_LOGGING) {
        console.log('Invoked process-form-submission:', { processResult, processError });
      }

      // Fire-and-forget: invite client by email
      const clientName = (sanitizedData as any).brideName
        || (sanitizedData as any).groomName
        || (sanitizedData as any).contactName
        || (sanitizedData as any).parentName
        || 'Valued Client';
      const clientEmail = contactEmail;
      if (clientEmail && clientEmail !== 'unknown@example.com') {
        supabase.functions.invoke('send-client-invite', {
          body: {
            wedding_id: notificationId,
            client_email: clientEmail,
            client_name: clientName,
          }
        }).catch((err) => console.error('send-client-invite failed (non-fatal):', err));
      }

      // Persist coordinator name for future form autofill
      if (data.from) {
        localStorage.setItem('lastCoordinatorName', data.from);
      }

      const toastDescription = clientEmail && clientEmail !== 'unknown@example.com'
        ? `Event created and invite sent to ${clientEmail}`
        : 'Event created successfully.';
      toast({
        title: "✅ Event Notification Sent!",
        description: toastDescription,
      });
      
      return true;
      
    } catch (error) {
      if (API_CONFIG.ENABLE_DEBUG_LOGGING) {
        console.error('Error submitting form:', error);
      }
      
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitForm
  };
};

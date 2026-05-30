import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EventNotification } from '@/types/notification';


export const useNotificationActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateNotificationStatus = async (id: string, status: EventNotification['status']) => {
    try {
      const { data, error: updateError } = await supabase
        .from('event_notification_history')
        .update({ status })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error('Notification not found or was already deleted.');
      }

      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error updating notification status:', err);
      throw err;
    }
  };

  const resendNotification = async (id: string, reason?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-form-submission', {
        body: {
          notificationId: id,
          reason,
        },
      });

      if (error) {
        const anyErr: any = error;
        let friendlyMessage = error.message || 'Failed to resend notification.';
        let partialData: any = null;

        try {
          const body = anyErr?.context?.body ?? anyErr?.context?.response?.text ?? anyErr?.context?.response?.body;
          if (body) {
            const parsed = typeof body === 'string' ? JSON.parse(body) : body;
            friendlyMessage = parsed?.error || parsed?.message || friendlyMessage;
            partialData = parsed?.data ?? null;
          }
        } catch (_) {
          // ignore JSON parse issues
        }

        const enriched = new Error(friendlyMessage);
        (enriched as any).data = partialData;
        throw enriched;
      }

      return (data as any)?.data ?? data;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Error resending notification via edge function:', err);
      
      // Check for rate limiting
      if (err?.message?.includes('429') || err?.message?.includes('Too many')) {
        const rateLimitError = new Error('Too many resend requests. Please try again in an hour.');
        (rateLimitError as any).isRateLimit = true;
        throw rateLimitError;
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const editAndResendNotification = async (
    id: string,
    updatedData: Partial<EventNotification>,
    reason?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('resend-notification', {
        body: {
          id,
          updatedData,
          reason,
          mode: 'edit_and_resend'
        }
      });

      if (error) {
        const anyErr: any = error;
        let friendlyMessage = error.message || 'Failed to edit & resend notification.';
        let partialData: any = null;
        try {
          const body = anyErr?.context?.body ?? anyErr?.context?.response?.text ?? anyErr?.context?.response?.body;
          if (body) {
            const parsed = typeof body === 'string' ? JSON.parse(body) : body;
            friendlyMessage = parsed?.error || parsed?.message || friendlyMessage;
            partialData = parsed?.data ?? null;
          }
        } catch (_) {}
        const enriched = new Error(friendlyMessage);
        (enriched as any).data = partialData;
        throw enriched;
      }

      return (data as any)?.data ?? data;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Error editing and resending notification via edge function:', err);
      
      // Check for rate limiting
      if (err?.message?.includes('429') || err?.message?.includes('Too many')) {
        const rateLimitError = new Error('Too many resend requests. Please try again in an hour.');
        (rateLimitError as any).isRateLimit = true;
        throw rateLimitError;
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPrinted = async (id: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from('event_notification_history')
        .update({ printed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error('Notification not found or was already deleted.');
      }

      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error marking as printed:', err);
      throw err;
    }
  };

  const updateWebhookUrl = async (id: string, webhookUrl: string) => {
    try {
      // Basic URL validation to prevent obvious mistakes
      let isValid = false;
      try {
        const u = new URL(webhookUrl);
        isValid = u.protocol === 'http:' || u.protocol === 'https:';
      } catch {}
      if (!isValid) {
        throw new Error('Please provide a valid http(s) webhook URL.');
      }

      const { data, error: updateError } = await supabase
        .from('event_notification_history')
        .update({ webhook_url: webhookUrl })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error('Notification not found or was already deleted.');
      }

      return data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error updating webhook URL:', err);
      throw err;
    }
  };

  const deleteNotification = async (id: string) => {
    setIsLoading(true);
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        throw new Error(`Invalid notification ID format: ${id}`);
      }

      const { error: deleteError } = await supabase
        .from('event_notification_history')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Error deleting notification:', err);
      throw new Error(err?.message || 'Failed to delete notification');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateNotificationStatus,
    resendNotification,
    editAndResendNotification,
    markAsPrinted,
    updateWebhookUrl,
    deleteNotification,
    isLoading
  };
};
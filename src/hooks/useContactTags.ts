import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useContactTags = () => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const updateContactTags = async (contactId: string, tags: string[]) => {
    try {
      setUpdating(true);
      
      // Find the event_notification_history record for this contact
      const { data: existingRecord, error: fetchError } = await supabase
        .from('event_notification_history')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existingRecord) {
        throw new Error('Contact not found');
      }

      // Update the additional_metadata with new tags
      const existingMetadata = (existingRecord.additional_metadata as Record<string, any>) || {};
      const updatedMetadata = {
        ...existingMetadata,
        tags: tags
      };

      const { error: updateError } = await supabase
        .from('event_notification_history')
        .update({
          additional_metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating contact tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact tags',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateContactTags,
    updating
  };
};
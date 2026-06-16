import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CoupleData {
  id: string;
  couple_name: string;
  source: 'wedding' | 'event_notification' | 'form_submission';
  event_date?: string;
  venue?: string;
  package_type?: string;
  contact_email?: string;
  contact_phone?: string;
  guest_count?: number;
  additional_data?: Record<string, any>;
}

export const useCoupleData = () => {
  const [couples, setCouples] = useState<CoupleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCouples = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from weddings table
      const { data: weddingData, error: weddingError } = await supabase
        .from('weddings')
        .select('id, couple_names, wedding_date, venue, package_type')
        .order('created_at', { ascending: false })
        .limit(500);

      if (weddingError) throw weddingError;

      // Fetch from event_notification_history
      const { data: eventData, error: eventError } = await supabase
        .from('event_notification_history')
        .select('id, couple_name, event_date, venue, package_type, contact_email, contact_phone, guest_count, additional_metadata')
        .order('created_at', { ascending: false })
        .limit(500);

      if (eventError) throw eventError;

      // Fetch from form_submissions with form data containing bride/groom names
      const { data: submissionData, error: submissionError } = await supabase
        .from('form_submissions')
        .select('id, contact_name, form_data, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (submissionError) throw submissionError;

      // Combine and normalize data
      const allCouples: CoupleData[] = [];

      // Add wedding data
      weddingData?.forEach(wedding => {
        allCouples.push({
          id: wedding.id,
          couple_name: wedding.couple_names,
          source: 'wedding',
          event_date: wedding.wedding_date,
          venue: wedding.venue,
          package_type: wedding.package_type
        });
      });

      // Add event notification data with enhanced guest count extraction
      eventData?.forEach(event => {
        // Enhanced guest count extraction from multiple sources
        let guestCount = event.guest_count;
        if (!guestCount && event.additional_metadata) {
          const metadata = event.additional_metadata as Record<string, any>;
          guestCount = metadata.numberOfGuests ||
                      metadata.guestCount ||
                      metadata.form_data?.numberOfGuests || 
                      metadata.form_data?.guestCount || 
                      metadata.form_data?.guest_count ||
                      metadata.form_data?.expected_guests ||
                      metadata.form_data?.number_of_guests ||
                      metadata.form_data?.['Number of Guests'] ||
                      metadata.form_data?.['number of guests'];
        }


        allCouples.push({
          id: event.id,
          couple_name: event.couple_name,
          source: 'event_notification',
          event_date: event.event_date,
          venue: event.venue,
          package_type: event.package_type,
          contact_email: event.contact_email,
          contact_phone: event.contact_phone,
          guest_count: guestCount,
          additional_data: (typeof event.additional_metadata === 'object' && event.additional_metadata !== null) 
            ? event.additional_metadata as Record<string, any> 
            : {}
        });
      });

      // Add form submission data
      submissionData?.forEach(submission => {
        const formData = typeof submission.form_data === 'string' 
          ? JSON.parse(submission.form_data) 
          : submission.form_data;
        
        // Try to extract couple name from form data
        let coupleName = submission.contact_name;
        if (formData.bride_name && formData.groom_name) {
          coupleName = `${formData.bride_name} & ${formData.groom_name}`;
        } else if (formData.primary_contact_name) {
          coupleName = formData.primary_contact_name;
        }

        if (coupleName) {
          allCouples.push({
            id: submission.id,
            couple_name: coupleName,
            source: 'form_submission',
            additional_data: formData
          });
        }
      });

      // Remove duplicates based on couple name (case-insensitive)
      const uniqueCouples = allCouples.reduce((acc, current) => {
        const normalizedName = (current.couple_name || '').toLowerCase().trim();
        const existing = acc.find(couple => 
          (couple.couple_name || '').toLowerCase().trim() === normalizedName
        );
        
        if (!existing) {
          acc.push(current);
        } else if (current.source === 'wedding' && existing.source !== 'wedding') {
          // Prefer wedding data over other sources
          const index = acc.indexOf(existing);
          acc[index] = current;
        }
        
        return acc;
      }, [] as CoupleData[]);

      setCouples(uniqueCouples);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch couple data';
      setError(errorMessage);
      toast({
        title: "Error Loading Couples",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseCoupleName = (coupleName: string) => {
    // Enhanced parsing with better pattern recognition
    const patterns = [
      // Enhanced patterns for better recognition
      /^(.+?)\s*&\s*(.+)$/,          // "John & Jane", "John Doe & Jane Smith"
      /^(.+?)\s+and\s+(.+)$/i,       // "John and Jane"
      /^(.+?)\s*\+\s*(.+)$/,         // "John + Jane"
      /^(.+?)\s*,\s*(.+)$/,          // "John, Jane"
      /^(.+?)\s+[/\\]\s*(.+)$/,      // "John / Jane" or "John \ Jane"
      /^(.+?)\s*[-–—]\s*(.+)$/,      // "John - Jane" (various dash types)
    ];

    for (const pattern of patterns) {
      const match = coupleName.match(pattern);
      if (match) {
        const name1 = match[1].trim();
        const name2 = match[2].trim();
        
        // Skip if either name is too short (likely not a real name)
        if (name1.length < 2 || name2.length < 2) continue;
        
        return {
          bride_name: name1,
          groom_name: name2
        };
      }
    }

    // Enhanced fallback logic for single names
    const parts = coupleName.trim().split(/\s+/);
    if (parts.length >= 2) {
      // For names like "John Smith Jane Doe", try to split intelligently
      if (parts.length === 4) {
        return {
          bride_name: parts.slice(0, 2).join(' '),
          groom_name: parts.slice(2).join(' ')
        };
      } else if (parts.length >= 3) {
        const midIndex = Math.ceil(parts.length / 2);
        return {
          bride_name: parts.slice(0, midIndex).join(' '),
          groom_name: parts.slice(midIndex).join(' ')
        };
      } else {
        // Two names, assume first/last
        return {
          bride_name: parts[0],
          groom_name: parts[1]
        };
      }
    }

    // Final fallback: use the full name for bride, empty for groom
    return {
      bride_name: coupleName.trim(),
      groom_name: ''
    };
  };

  useEffect(() => {
    fetchCouples();
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    couples,
    loading,
    error,
    refetch: fetchCouples,
    parseCoupleName
  };
};
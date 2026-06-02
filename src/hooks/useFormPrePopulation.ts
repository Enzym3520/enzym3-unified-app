import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';


export interface PrePopulationContext {
  source: 'event_notification' | 'form_submission' | 'contact' | 'wedding';
  id: string;
  email?: string;
  weddingId?: string;
  contactName?: string;
}

export interface PrePopulationData {
  fieldMappings: Record<string, any>;
  suggestions: Array<{
    field: string;
    value: any;
    confidence: number;
    source: string;
  }>;
  context: PrePopulationContext;
}

export const useFormPrePopulation = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PrePopulationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  

  // Parse URL parameters to detect context
  const parseContextFromUrl = useCallback((): PrePopulationContext | null => {
    const urlParams = new URLSearchParams(window.location.search);
    
    logger.debug('Pre-population URL params', Object.fromEntries(urlParams.entries()));
    
    // Check for different context types
    if (urlParams.get('from_event')) {
      const context = {
        source: 'event_notification' as const,
        id: urlParams.get('from_event')!,
        email: urlParams.get('email') || undefined,
        contactName: urlParams.get('contact_name') || undefined
      };
      logger.debug('Detected event notification context', context);
      return context;
    }
    
    if (urlParams.get('from_submission')) {
      return {
        source: 'form_submission',
        id: urlParams.get('from_submission')!,
        email: urlParams.get('email') || undefined
      };
    }
    
    if (urlParams.get('contact_email')) {
      return {
        source: 'contact',
        id: urlParams.get('contact_email')!,
        email: urlParams.get('contact_email')!,
        contactName: urlParams.get('contact_name') || undefined
      };
    }
    
    if (urlParams.get('wedding_id')) {
      return {
        source: 'wedding',
        id: urlParams.get('wedding_id')!,
        weddingId: urlParams.get('wedding_id')!,
        email: urlParams.get('email') || undefined,
        contactName: urlParams.get('contact_name') || undefined
      };
    }
    
    return null;
  }, []);

  // Fetch data from event notification history
  const fetchEventNotificationData = async (id: string) => {
    logger.debug('Fetching notification data for ID', id);
    const { data, error } = await supabase
      .from('event_notification_history')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      if (import.meta.env.DEV) console.error('❌ Error fetching notification data:', error);
      throw error;
    }
    if (!data) throw new Error('Event notification not found');
    
    logger.debug('Fetched notification data');
    return data;
  };

  // Fetch data from form submissions
  const fetchFormSubmissionData = async (id: string) => {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Form submission not found');
    return data;
  };

  // Fetch data by contact email
  const fetchContactData = async (email: string) => {
    // Get the most recent event for this contact
    const { data: eventData, error: eventError } = await supabase
      .from('event_notification_history')
      .select('*')
      .eq('contact_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eventError) throw eventError;

    // Also check form submissions
    const { data: submissionData, error: submissionError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('contact_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (submissionError) throw submissionError;

    return { eventData, submissionData };
  };

  // Fetch wedding data
  const fetchWeddingData = async (weddingId: string) => {
    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', weddingId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Wedding not found');
    return data;
  };

  // Smart field mapping based on data source with consistent field names
  const createFieldMappings = (sourceData: any, context: PrePopulationContext): Record<string, any> => {
    logger.debug('Creating field mappings from source data');
    const mappings: Record<string, any> = {};
    
    switch (context.source) {
      case 'event_notification':
        logger.debug('Processing event notification data');
        
        // First, get nested form_data if available (highest priority)
        let nestedFormData = null;
        if (sourceData.additional_metadata?.form_data) {
          nestedFormData = typeof sourceData.additional_metadata.form_data === 'string' 
            ? JSON.parse(sourceData.additional_metadata.form_data) 
            : sourceData.additional_metadata.form_data;
          logger.debug('Found nested form_data (highest priority)');
        }
        
        // Map base event notification fields using consistent field names
        logger.debug('Mapping base notification fields');
        mappings.brideEmail = sourceData.contact_email;
        mappings.bridePhone = sourceData.contact_phone;
        mappings.weddingDate = sourceData.event_date;
        mappings.venue = sourceData.venue;
        mappings.venueCode = sourceData.venue_code || sourceData.additional_metadata?.venue_code;
        mappings.eventType = sourceData.event_type;
        mappings.packageType = sourceData.package_type;
        mappings.from = sourceData.coordinator_name;
        mappings.vendors = sourceData.dj_name || sourceData.coordinator_name;
        mappings.vendorType = sourceData.dj_name ? 'dj' : 'other';
        mappings.notes = sourceData.notes;
        mappings.numberOfGuests = sourceData.guest_count;
        mappings.contract = sourceData.contract || sourceData.additional_metadata?.contract;
        
        // Parse couple name for wedding-specific fields
        if (sourceData.couple_name) {
          logger.debug('Parsing couple name');
          const parseCoupleName = (coupleName: string) => {
            const patterns = [
              /^(.+?)\s*&\s*(.+)$/,        // "John & Jane"
              /^(.+?)\s+and\s+(.+)$/i,     // "John and Jane"
              /^(.+?)\s*\+\s*(.+)$/,       // "John + Jane"
              /^(.+?)\s*,\s*(.+)$/,        // "John, Jane"
            ];

            for (const pattern of patterns) {
              const match = coupleName.match(pattern);
              if (match) {
                return {
                  brideName: match[1].trim(),
                  groomName: match[2].trim()
                };
              }
            }

            // Fallback: use full name for bride
            return {
              brideName: coupleName.trim(),
              groomName: ''
            };
          };

          const parsedNames = parseCoupleName(sourceData.couple_name);
          if (parsedNames.brideName && parsedNames.brideName.includes(' ')) {
            mappings.brideName = parsedNames.brideName;
          }
          if (parsedNames.groomName && parsedNames.groomName.includes(' ')) {
            mappings.groomName = parsedNames.groomName;
          }
          logger.debug('Parsed names');
        }
        
        // Map additional metadata (medium priority)
        if (sourceData.additional_metadata) {
          const metadata = typeof sourceData.additional_metadata === 'string' 
            ? JSON.parse(sourceData.additional_metadata) 
            : sourceData.additional_metadata;
          logger.debug('Processing additional metadata');
          
          // Add all metadata except form_data (we handle that separately)
          const { form_data, ...otherMetadata } = metadata;
          
          // Map metadata fields to consistent form field names
          Object.entries(otherMetadata).forEach(([key, value]) => {
            // Map common field variations to consistent names
            switch (key) {
              case 'event_type':
                mappings.eventType = value;
                break;
              case 'package_type':
                mappings.packageType = value;
                break;
              case 'guest_count':
              case 'numberOfGuests':
                mappings.numberOfGuests = value;
                break;
              case 'event_date':
              case 'wedding_date':
                mappings.weddingDate = value;
                break;
              case 'contact_email':
              case 'bride_email':
                mappings.brideEmail = value;
                break;
              case 'contact_phone':
              case 'bride_phone':
                mappings.bridePhone = value;
                break;
              case 'contact_name':
              case 'bride_name':
                mappings.brideName = value;
                break;
              case 'groom_name':
                mappings.groomName = value;
                break;
              case 'coordinator_name':
                mappings.from = value;
                break;
              default:
                mappings[key] = value;
            }
          });
        }
        
        // Override with nested form_data (highest priority) - already in correct format
        if (nestedFormData) {
          logger.debug('Overriding with nested form_data (highest priority)');
          
          // Nested form_data should already have the correct field names
          // since it comes from previous form submissions
          Object.entries(nestedFormData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              mappings[key] = value;
              logger.debug(`Mapped ${key}`);
            }
          });
        }
        
        logger.debug('Final event notification mappings complete');
        break;
        
      case 'form_submission':
        // Map form submission data directly
        mappings.contact_email = sourceData.contact_email;
        mappings.contact_name = sourceData.contact_name;
        mappings.primary_contact_email = sourceData.contact_email;
        mappings.primary_contact_name = sourceData.contact_name;
        
        // Map form data
        if (sourceData.form_data) {
          const formData = typeof sourceData.form_data === 'string' 
            ? JSON.parse(sourceData.form_data) 
            : sourceData.form_data;
          Object.assign(mappings, formData);
        }
        break;
        
      case 'wedding':
        mappings.wedding_date = sourceData.wedding_date;
        mappings.event_date = sourceData.wedding_date;
        mappings.venue = sourceData.venue;
        mappings.venue_name = sourceData.venue;
        mappings.package_type = sourceData.package_type;
        mappings.setup_time = sourceData.setup_time;
        mappings.breakdown_time = sourceData.breakdown_time;
        mappings.client_source = sourceData.client_source;
        
        // Parse couple names with improved logic
        if (sourceData.couple_names) {
          mappings.contact_name = sourceData.couple_names;
          mappings.primary_contact_name = sourceData.couple_names;
          
          // Enhanced name parsing
          const parseCoupleName = (coupleName: string) => {
            const patterns = [
              /^(.+?)\s*&\s*(.+)$/,  // "John & Jane"
              /^(.+?)\s+and\s+(.+)$/i,  // "John and Jane"
              /^(.+?)\s*\+\s*(.+)$/,  // "John + Jane"
              /^(.+?)\s*,\s*(.+)$/,  // "John, Jane"
            ];

            for (const pattern of patterns) {
              const match = coupleName.match(pattern);
              if (match) {
                return {
                  bride_name: match[1].trim(),
                  groom_name: match[2].trim()
                };
              }
            }

            // Fallback: use full name for bride
            return {
              bride_name: coupleName.trim(),
              groom_name: ''
            };
          };

          const parsedNames = parseCoupleName(sourceData.couple_names);
          mappings.bride_name = parsedNames.bride_name;
          mappings.groom_name = parsedNames.groom_name;
        }
        break;
        
      case 'contact':
        // For contact-based lookups, use the most recent data
        if (sourceData.eventData) {
          Object.assign(mappings, createFieldMappings(sourceData.eventData, { 
            ...context, 
            source: 'event_notification' 
          }));
        }
        if (sourceData.submissionData) {
          Object.assign(mappings, createFieldMappings(sourceData.submissionData, { 
            ...context, 
            source: 'form_submission' 
          }));
        }
        break;
    }
    
    logger.debug('Final field mappings complete');
    return mappings;
  };

  // Generate suggestions for similar fields
  const generateSuggestions = (mappings: Record<string, any>, context: PrePopulationContext) => {
    const suggestions = [];
    
    for (const [field, value] of Object.entries(mappings)) {
      if (value) {
        suggestions.push({
          field,
          value,
          confidence: 0.9, // High confidence for direct mappings
          source: context.source
        });
      }
    }
    
    return suggestions;
  };

  // Main function to populate data based on context
  const populateFromContext = async (context?: PrePopulationContext) => {
    const targetContext = context || parseContextFromUrl();
    if (!targetContext) {
      logger.debug('No context found for pre-population');
      return null;
    }
    
    logger.debug('Starting pre-population with context', { source: targetContext.source });
    setLoading(true);
    setError(null);
    
    try {
      let sourceData;
      
      switch (targetContext.source) {
        case 'event_notification':
          sourceData = await fetchEventNotificationData(targetContext.id);
          break;
        case 'form_submission':
          sourceData = await fetchFormSubmissionData(targetContext.id);
          break;
        case 'contact':
          sourceData = await fetchContactData(targetContext.id);
          break;
        case 'wedding':
          sourceData = await fetchWeddingData(targetContext.id);
          break;
        default:
          throw new Error('Unknown context source');
      }
      
      const fieldMappings = createFieldMappings(sourceData, targetContext);
      const suggestions = generateSuggestions(fieldMappings, targetContext);
      
      const prePopData: PrePopulationData = {
        fieldMappings,
        suggestions,
        context: targetContext
      };
      
      logger.debug('Pre-population complete');
      setData(prePopData);
      
      
      return prePopData;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pre-population data';
      setError(errorMessage);
      if (import.meta.env.DEV) console.error('Pre-population error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-populate on mount if context is detected
  useEffect(() => {
    const context = parseContextFromUrl();
    if (context) {
      populateFromContext(context);
    }
  }, []);

  return {
    data,
    loading,
    error,
    populateFromContext,
    parseContextFromUrl,
    clearData: () => setData(null)
  };
};
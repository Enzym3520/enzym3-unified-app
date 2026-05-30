import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { validatePrePopulationData, findBestFieldMatch, fieldNameVariations } from '@/utils/prePopulationHelpers';
import { parseLocalDate } from '@/utils/dateHelpers';

interface CoupleData {
  id: string;
  couple_name: string;
  contact_email: string;
  contact_phone?: string;
  event_date: string;
  venue?: string;
  event_type?: string;
  package_type?: string;
  coordinator_name?: string;
  dj_name?: string;
  guest_count?: number;
  notes?: string;
  [key: string]: any;
}

interface UseCoupleDataIntegrationProps {
  form: UseFormReturn<FormData>;
  selectedCoupleData?: CoupleData | null;
  prePopulationData?: Record<string, any> | null;
}

/**
 * Hook to integrate couple selector data with form pre-population
 */
export const useCoupleDataIntegration = ({
  form,
  selectedCoupleData,
  prePopulationData
}: UseCoupleDataIntegrationProps) => {
  const [lastAppliedCoupleId, setLastAppliedCoupleId] = useState<string | null>(null);

  // Convert couple data to form field format
  const mapCoupleDataToFormFields = (coupleData: CoupleData): Record<string, any> => {
    if (import.meta.env.DEV) console.log('🔄 Mapping couple data to form fields');
    
    const mappings: Record<string, any> = {};
    
    // Basic contact information
    mappings.brideEmail = coupleData.contact_email;
    mappings.bridePhone = coupleData.contact_phone;
    
    // Event details
    mappings.weddingDate = coupleData.event_date ? parseLocalDate(coupleData.event_date) : undefined;
    mappings.venue = coupleData.venue;
    mappings.eventType = coupleData.event_type || 'wedding';
    mappings.packageType = coupleData.package_type;
    mappings.numberOfGuests = coupleData.guest_count;
    mappings.notes = coupleData.notes;
    
    // Coordinator and vendor info
    mappings.from = coupleData.coordinator_name;
    mappings.vendors = coupleData.dj_name || coupleData.coordinator_name;
    mappings.vendorType = coupleData.dj_name ? 'dj' : 'other';
    
    // Parse couple names for bride/groom fields
    if (coupleData.couple_name) {
      const parsedNames = parseCoupleName(coupleData.couple_name);
      mappings.brideName = parsedNames.brideName;
      mappings.groomName = parsedNames.groomName;
    }
    
    return validatePrePopulationData(mappings);
  };

  // Enhanced couple name parsing
  const parseCoupleName = (coupleName: string) => {
    
    
    const patterns = [
      /^(.+?)\s*&\s*(.+)$/,        // "John & Jane"
      /^(.+?)\s+and\s+(.+)$/i,     // "John and Jane"
      /^(.+?)\s*\+\s*(.+)$/,       // "John + Jane"
      /^(.+?)\s*,\s*(.+)$/,        // "John, Jane"
      /^(.+?)\s+(.+?)\s*&\s*(.+?)\s+(.+)$/,  // "John Smith & Jane Doe"
    ];

    for (const pattern of patterns) {
      const match = coupleName.match(pattern);
      if (match) {
        if (match.length === 5) {
          // Full names with last names
          return {
            brideName: `${match[1].trim()} ${match[2].trim()}`,
            groomName: `${match[3].trim()} ${match[4].trim()}`
          };
        } else {
          // Simple first names or single names
          return {
            brideName: match[1].trim(),
            groomName: match[2].trim()
          };
        }
      }
    }

    // Fallback: use full name for bride
    return {
      brideName: coupleName.trim(),
      groomName: ''
    };
  };

  // Smart field mapping that handles different field name variations
  const applySmartFieldMapping = (sourceData: Record<string, any>, targetFormData: Record<string, any>) => {
    const result = { ...targetFormData };
    
    for (const [sourceKey, sourceValue] of Object.entries(sourceData)) {
      if (sourceValue === null || sourceValue === undefined || sourceValue === '') {
        continue;
      }
      
      // Try direct mapping first
      if (sourceKey in result) {
        result[sourceKey] = sourceValue;
        continue;
      }
      
      // Try smart field matching
      const formFieldNames = Object.keys(result);
      const bestMatch = findBestFieldMatch(sourceKey, formFieldNames);
      
      if (bestMatch) {
        result[bestMatch] = sourceValue;
        
      }
    }
    
    return result;
  };

  // Apply couple data to form when couple is selected
  useEffect(() => {
    if (!selectedCoupleData || selectedCoupleData.id === lastAppliedCoupleId) {
      return;
    }

    
    
    // Get current form values
    const currentFormData = form.getValues();
    
    // Map couple data to form fields
    const coupleFieldMappings = mapCoupleDataToFormFields(selectedCoupleData);
    
    // Merge with existing pre-population data (if any)
    let finalFormData = { ...currentFormData };
    
    if (prePopulationData) {
      
      // Pre-population data has higher priority, couple data fills gaps
      finalFormData = applySmartFieldMapping(coupleFieldMappings, finalFormData);
      finalFormData = applySmartFieldMapping(prePopulationData, finalFormData);
    } else {
      // Just apply couple data
      finalFormData = applySmartFieldMapping(coupleFieldMappings, finalFormData);
    }
    
    
    
    // Apply to form
    form.reset(finalFormData);
    setLastAppliedCoupleId(selectedCoupleData.id);
    
  }, [selectedCoupleData, form, prePopulationData, lastAppliedCoupleId]);

  return {
    mapCoupleDataToFormFields,
    parseCoupleName,
    lastAppliedCoupleId
  };
};
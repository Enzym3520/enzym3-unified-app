import { EventNotification } from '@/types/notification';
import { CoupleData } from '@/hooks/useCoupleData';

/**
 * Detects if an event notification represents a wedding event
 */
export const detectWeddingFromNotification = (notification: EventNotification): boolean => {
  // Direct event type indicators
  if (notification.event_type === 'wedding') return true;

  // Check nested form_data first (highest priority)
  const formData = notification.additional_metadata?.form_data;
  if (formData) {
    // Direct event type in form data
    if (formData.eventType === 'wedding') return true;
    
    // Wedding-specific fields in form data
    if (formData.brideName || formData.groomName || 
        formData.brideEmail || formData.groomEmail ||
        formData.bridePhone || formData.groomPhone) {
      return true;
    }
  }

  // Couple name patterns indicating wedding
  const namePatterns = [
    /\s*&\s*/,           // "John & Jane"
    /\s+and\s+/i,        // "John and Jane"
    /\s*\+\s*/,          // "John + Jane"
    /\s*,\s*/,           // "John, Jane"
    /bride|groom/i,      // Contains bride/groom terms
    /mr\.?\s*&\s*mrs\.?/i // "Mr & Mrs"
  ];

  const hasWeddingNamePattern = namePatterns.some(pattern => 
    pattern.test(notification.couple_name)
  );

  // Package type indicators
  const weddingPackages = [
    'wedding', 'bridal', 'ceremony', 'reception', 
    'full day', 'premium wedding', 'deluxe wedding'
  ];
  const hasWeddingPackage = notification.package_type && 
    weddingPackages.some(pkg => 
      notification.package_type!.toLowerCase().includes(pkg)
    );

  // Additional metadata indicators (top-level)
  const additionalDataIndicators = notification.additional_metadata && (
    notification.additional_metadata.bride_name ||
    notification.additional_metadata.groom_name ||
    notification.additional_metadata.ceremony_time ||
    notification.additional_metadata.reception_venue ||
    notification.additional_metadata.wedding_date
  );

  return hasWeddingNamePattern || hasWeddingPackage || Boolean(additionalDataIndicators);
};

/**
 * Detects event type from notification - returns 'wedding' or 'non-wedding'
 */
export const detectEventTypeFromNotification = (notification: EventNotification): 'wedding' | 'non-wedding' => {
  return detectWeddingFromNotification(notification) ? 'wedding' : 'non-wedding';
};

/**
 * Enhanced wedding detection logic for couple data (reusable from EventFormsPage)
 */
export const detectWeddingFromCoupleData = (couple: CoupleData): boolean => {
  // Direct source indicators
  if (couple.source === 'wedding') return true;
  if (couple.additional_data?.event_type === 'wedding') return true;

  // Couple name patterns indicating wedding
  const namePatterns = [
    /\s*&\s*/,           // "John & Jane"
    /\s+and\s+/i,        // "John and Jane"
    /\s*\+\s*/,          // "John + Jane"
    /\s*,\s*/,           // "John, Jane"
    /bride|groom/i,      // Contains bride/groom terms
    /mr\.?\s*&\s*mrs\.?/i // "Mr & Mrs"
  ];

  const hasWeddingNamePattern = namePatterns.some(pattern => 
    pattern.test(couple.couple_name)
  );

  // Package type indicators
  const weddingPackages = [
    'wedding', 'bridal', 'ceremony', 'reception', 
    'full day', 'premium wedding', 'deluxe wedding'
  ];
  const hasWeddingPackage = couple.package_type && 
    weddingPackages.some(pkg => 
      couple.package_type!.toLowerCase().includes(pkg)
    );

  // Additional data indicators
  const additionalDataIndicators = couple.additional_data && (
    couple.additional_data.bride_name ||
    couple.additional_data.groom_name ||
    couple.additional_data.ceremony_time ||
    couple.additional_data.reception_venue ||
    couple.additional_data.wedding_date
  );

  return hasWeddingNamePattern || hasWeddingPackage || Boolean(additionalDataIndicators);
};
// Event type definitions
export type EventType = 'wedding' | 'quince' | 'birthday' | 'sweet16' | 'graduation' | 'corporate' | 'banquet' | 'other';

// Check if raw event type string is Sweet 16
export const isSweetSixteen = (eventType: string | null | undefined): boolean => {
  if (!eventType) return false;
  const normalized = eventType.toLowerCase().trim();
  return normalized.includes('sweet') && (normalized.includes('16') || normalized.includes('sixteen'));
};

// Check if raw event type string is Graduation
export const isGraduation = (eventType: string | null | undefined): boolean => {
  if (!eventType) return false;
  const normalized = eventType.toLowerCase().trim();
  return normalized.includes('graduation') || normalized.includes('grad');
};

// Map database event_type values to our EventType
export const normalizeEventType = (eventType: string | null | undefined): EventType => {
  if (!eventType) return 'wedding';
  
  const normalized = eventType.toLowerCase().trim();
  
  // Sweet 16 gets its own type now
  if (isSweetSixteen(eventType)) return 'sweet16';
  
  // Graduation
  if (isGraduation(eventType)) return 'graduation';
  
  if (normalized.includes('quince') || normalized.includes('quinceañera') || normalized.includes('quinceanera')) {
    return 'quince';
  }
  if (normalized.includes('wedding')) return 'wedding';
  if (normalized.includes('birthday')) return 'birthday';
  if (normalized.includes('corporate')) return 'corporate';
  if (normalized.includes('banquet')) return 'banquet';
  
  return 'other';
};

// Get display label for event type
export const getEventLabel = (eventType: string | null | undefined): string => {
  const type = normalizeEventType(eventType);
  
  switch (type) {
    case 'wedding': return 'Wedding';
    case 'quince': return 'Quinceañera';
    case 'sweet16': return 'Sweet 16';
    case 'graduation': return 'Graduation Party';
    case 'birthday': return 'Birthday Party';
    case 'corporate': return 'Corporate Event';
    case 'banquet': return 'Banquet';
    default: return 'Event';
  }
};

// Get client/honoree label based on event type
export const getClientLabel = (eventType: string | null | undefined): string => {
  const type = normalizeEventType(eventType);
  
  switch (type) {
    case 'wedding': return 'Couple';
    case 'quince': return 'Quinceañera';
    case 'sweet16': return 'Honoree';
    case 'graduation': return 'Graduate';
    case 'birthday': return 'Honoree';
    case 'corporate': return 'Host';
    case 'banquet': return 'Host';
    default: return 'Client';
  }
};

// Get countdown text based on event type
export const getCountdownText = (eventType: string | null | undefined, days: number): string => {
  if (days === 0) return 'Today is the day!';
  if (days < 0) return 'Event has passed';
  
  const type = normalizeEventType(eventType);
  
  switch (type) {
    case 'wedding': return 'until your wedding day';
    case 'quince': return 'until the big day';
    case 'sweet16': return 'until the celebration';
    case 'graduation': return 'until the graduation';
    case 'birthday': return 'until the celebration';
    case 'corporate': return 'until the event';
    case 'banquet': return 'until the event';
    default: return 'until your special day';
  }
};

// Check if event type has pre-determined timeline events
export const hasPresetTimeline = (eventType: string | null | undefined): boolean => {
  const type = normalizeEventType(eventType);
  return type === 'wedding' || type === 'quince';
};

// Check if event type has ceremony phase (wedding only)
export const hasCeremonyPhase = (eventType: string | null | undefined): boolean => {
  const type = normalizeEventType(eventType);
  return type === 'wedding';
};

// Get details card title
export const getDetailsCardTitle = (eventType: string | null | undefined): string => {
  const type = normalizeEventType(eventType);
  
  switch (type) {
    case 'wedding': return 'Your Wedding Details';
    case 'quince': return 'Your Quinceañera Details';
    case 'sweet16': return 'Your Sweet 16 Details';
    case 'graduation': return 'Your Graduation Details';
    case 'birthday': return 'Your Party Details';
    case 'corporate': return 'Your Event Details';
    case 'banquet': return 'Your Event Details';
    default: return 'Your Event Details';
  }
};

// Get vibe sheet subtitle
export const getVibeSheetSubtitle = (eventType: string | null | undefined): string => {
  const type = normalizeEventType(eventType);
  
  switch (type) {
    case 'wedding': return 'Tell us about your perfect wedding soundtrack';
    case 'quince': return 'Tell us about your perfect quinceañera soundtrack';
    case 'sweet16': return 'Tell us about your perfect Sweet 16 soundtrack';
    case 'graduation': return 'Tell us about your perfect graduation party soundtrack';
    case 'birthday': return 'Tell us about your perfect party soundtrack';
    default: return 'Tell us about your perfect event soundtrack';
  }
};

// Get registration form fields config based on event type
export interface RegistrationFieldConfig {
  person1Label: string;
  person1Placeholder: string;
  person2Label: string;
  person2Placeholder: string;
  person2Required: boolean;
  showPerson2: boolean;
}

export const getRegistrationFieldConfig = (eventType: string | null | undefined): RegistrationFieldConfig => {
  const type = normalizeEventType(eventType);
  
  switch (type) {
    case 'wedding':
      return {
        person1Label: 'Bride',
        person1Placeholder: 'Bride',
        person2Label: 'Groom',
        person2Placeholder: 'Groom',
        person2Required: false,
        showPerson2: true,
      };
    case 'quince':
      return {
        person1Label: 'Quinceañera',
        person1Placeholder: 'Quinceañera Name',
        person2Label: 'Parent/Guardian',
        person2Placeholder: 'Parent/Guardian Name',
        person2Required: true,
        showPerson2: true,
      };
    case 'sweet16':
      return {
        person1Label: 'Honoree',
        person1Placeholder: 'Honoree Name',
        person2Label: 'Parent/Guardian',
        person2Placeholder: 'Parent/Guardian Name',
        person2Required: false,
        showPerson2: true,
      };
    case 'graduation':
      return {
        person1Label: 'Graduate',
        person1Placeholder: 'Graduate Name',
        person2Label: 'School/Organization',
        person2Placeholder: 'School or Organization',
        person2Required: false,
        showPerson2: true,
      };
    case 'birthday':
      return {
        person1Label: 'Honoree',
        person1Placeholder: 'Honoree Name',
        person2Label: 'Host',
        person2Placeholder: 'Host Name',
        person2Required: false,
        showPerson2: true,
      };
    case 'corporate':
      return {
        person1Label: 'Contact',
        person1Placeholder: 'Contact Name',
        person2Label: 'Company/Organization',
        person2Placeholder: 'Company Name',
        person2Required: false,
        showPerson2: true,
      };
    default:
      return {
        person1Label: 'Contact',
        person1Placeholder: 'Contact Name',
        person2Label: 'Secondary Contact',
        person2Placeholder: 'Secondary Contact',
        person2Required: false,
        showPerson2: false,
      };
  }
};

// Get tabs configuration based on event type
export interface TabConfig {
  id: string;
  label: string;
  visible: boolean;
}

export const getVibeSheetTabs = (eventType: string | null | undefined): TabConfig[] => {
  const type = normalizeEventType(eventType);
  
  if (type === 'wedding') {
    return [
      { id: 'ceremony', label: 'Ceremony', visible: true },
      { id: 'reception', label: 'Reception', visible: true },
      { id: 'preferences', label: 'Music Style', visible: true },
      { id: 'dances', label: 'Dances', visible: true },
      { id: 'songs', label: 'Song Requests', visible: true },
      { id: 'intro', label: 'Grand Intro', visible: true },
      { id: 'playlists', label: 'Playlists', visible: true },
      { id: 'toasts', label: 'Toasts', visible: true },
    ];
  }
  
  if (type === 'quince') {
    return [
      { id: 'reception', label: 'Reception', visible: true },
      { id: 'preferences', label: 'Music Style', visible: true },
      { id: 'dances', label: 'Dances', visible: true },
      { id: 'songs', label: 'Song Requests', visible: true },
      { id: 'intro', label: 'Court Intro', visible: true },
      { id: 'playlists', label: 'Playlists', visible: true },
      { id: 'toasts', label: 'Toasts', visible: true },
    ];
  }
  
  // Sweet 16, Birthday, Graduation, and other event types - simplified party-style tabs
  return [
    { id: 'agenda', label: 'Event Agenda', visible: true },
    { id: 'preferences', label: 'Music Style', visible: true },
    { id: 'announcements', label: 'Announcements', visible: true },
    { id: 'songs', label: 'Song Requests', visible: true },
    { id: 'playlists', label: 'Playlists', visible: true },
  ];
};

// Get display name for portal: contact name for non-wedding events, couple_name for weddings
export const getPortalDisplayName = (
  eventType: string | null | undefined,
  coupleName: string,
  primaryContactName?: string | null
): string => {
  const type = normalizeEventType(eventType);
  if (type === 'wedding') return coupleName;
  return primaryContactName || coupleName;
};

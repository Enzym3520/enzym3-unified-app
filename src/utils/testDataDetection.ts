/**
 * Utilities for detecting and managing test data submissions
 */

export interface TestDataIndicators {
  isTest: boolean;
  reasons: string[];
}

/**
 * Test patterns to detect test submissions
 */
const TEST_PATTERNS = {
  names: [
    'test', 'example', 'demo', 'sample', 'dummy',
    'john doe', 'jane doe', 'john & jane', 'john smith',
    'test user', 'admin user'
  ],
  emails: [
    'test@', 'example@', 'demo@', '@test.', '@example.',
    'admin@example', 'test@test', 'user@example'
  ],
  venues: [
    'test venue', 'example venue', 'demo venue', 'sample venue'
  ]
};

/**
 * Detect if a form submission appears to be test data
 */
export function detectTestData(formData: {
  couple_name?: string;
  contact_email?: string;
  submitted_by?: string;
  coordinator_name?: string;
  venue?: string;
  notes?: string;
}): TestDataIndicators {
  const reasons: string[] = [];
  
  // Normalize strings for comparison
  const normalize = (str?: string) => str?.toLowerCase().trim() || '';
  
  const coupleName = normalize(formData.couple_name);
  const contactEmail = normalize(formData.contact_email);
  const submittedBy = normalize(formData.submitted_by);
  const coordinatorName = normalize(formData.coordinator_name);
  const venue = normalize(formData.venue);
  const notes = normalize(formData.notes);
  
  // Check couple name patterns
  TEST_PATTERNS.names.forEach(pattern => {
    if (coupleName.includes(pattern)) {
      reasons.push(`Couple name contains test pattern: "${pattern}"`);
    }
  });
  
  // Check email patterns
  TEST_PATTERNS.emails.forEach(pattern => {
    if (contactEmail.includes(pattern)) {
      reasons.push(`Email contains test pattern: "${pattern}"`);
    }
  });
  
  // Check submitted by patterns
  TEST_PATTERNS.names.forEach(pattern => {
    if (submittedBy.includes(pattern)) {
      reasons.push(`Submitted by contains test pattern: "${pattern}"`);
    }
  });
  
  // Check coordinator name patterns
  TEST_PATTERNS.names.forEach(pattern => {
    if (coordinatorName.includes(pattern)) {
      reasons.push(`Coordinator name contains test pattern: "${pattern}"`);
    }
  });
  
  // Check venue patterns
  TEST_PATTERNS.venues.forEach(pattern => {
    if (venue.includes(pattern)) {
      reasons.push(`Venue contains test pattern: "${pattern}"`);
    }
  });
  
  // Check for obvious test indicators in notes
  if (notes.includes('test') || notes.includes('demo') || notes.includes('example')) {
    reasons.push('Notes contain test indicators');
  }
  
  // Check for sequential/placeholder data
  if (coupleName === 'john & jane' || coupleName === 'bride & groom') {
    reasons.push('Generic placeholder names detected');
  }
  
  // Check for development/localhost emails
  if (contactEmail.includes('localhost') || contactEmail.includes('127.0.0.1')) {
    reasons.push('Development environment email detected');
  }
  
  return {
    isTest: reasons.length > 0,
    reasons
  };
}

/**
 * Add test detection metadata to form submission
 */
export function addTestDetectionMetadata(
  formData: any,
  existingMetadata: Record<string, any> = {}
): Record<string, any> {
  const testDetection = detectTestData(formData);
  
  return {
    ...existingMetadata,
    testDetection: {
      isTest: testDetection.isTest,
      reasons: testDetection.reasons,
      detectedAt: new Date().toISOString()
    }
  };
}
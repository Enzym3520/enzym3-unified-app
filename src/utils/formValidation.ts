import { FormData } from '@/types/eventForm';
import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

// Security: Maximum field lengths to prevent DoS
export const MAX_LENGTHS = {
  name: 100,
  email: 255,
  phone: 20,
  venue: 200,
  notes: 5000,
  shortText: 500,
  mediumText: 1000,
} as const;

export const validateFieldLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Enhanced email validation with domain checking
 */
export const validateEmail = (email: string): { valid: boolean; reason?: string } => {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { valid: false, reason: 'Email is empty' };
  }

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    logger.validation('email', 'Invalid format', email);
    return { valid: false, reason: 'Invalid email format' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /onclick/i,
    /<|>/,
    /\.\./,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(trimmed))) {
    logger.validation('email', 'Suspicious pattern detected', email);
    return { valid: false, reason: 'Email contains invalid characters' };
  }

  return { valid: true };
};

/**
 * Enhanced phone validation
 */
export const validatePhone = (phone: string): { valid: boolean; reason?: string } => {
  const trimmed = phone.trim();
  
  if (!trimmed) {
    return { valid: false, reason: 'Phone is empty' };
  }

  // Allow digits, spaces, dashes, parentheses, plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (!phoneRegex.test(trimmed)) {
    logger.validation('phone', 'Invalid characters', phone);
    return { valid: false, reason: 'Phone contains invalid characters' };
  }

  // Check reasonable length (international format)
  if (trimmed.length < 7 || trimmed.length > 20) {
    logger.validation('phone', 'Invalid length', phone);
    return { valid: false, reason: 'Phone number length is invalid' };
  }

  return { valid: true };
};

/**
 * Validate date is reasonable (not too far in past/future)
 */
export const validateEventDate = (date: Date): { valid: boolean; reason?: string } => {
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const maxDate = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());

  if (date < minDate) {
    logger.validation('eventDate', 'Date too far in past', date.toISOString());
    return { valid: false, reason: 'Event date cannot be more than 1 year in the past' };
  }

  if (date > maxDate) {
    logger.validation('eventDate', 'Date too far in future', date.toISOString());
    return { valid: false, reason: 'Event date cannot be more than 3 years in the future' };
  }

  return { valid: true };
};

/**
 * Validate string doesn't contain dangerous patterns
 */
export const validateSafeString = (value: string, fieldName: string): { valid: boolean; reason?: string } => {
  // Check for script injection attempts
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      logger.validation(fieldName, 'Dangerous pattern detected', value);
      return { valid: false, reason: 'Input contains invalid characters' };
    }
  }

  return { valid: true };
};

export const validateFormByEventType = (data: FormData): ValidationResult => {
  let requiredFields: string[] = [];
  const validationErrors: string[] = [];
  
  switch (data.eventType) {
    case 'wedding':
      requiredFields = ['brideName', 'groomName', 'bridePhone', 'groomPhone'];
      break;
    case 'quince':
      requiredFields = ['quinceaneraName', 'parentName', 'parentPhone', 'parentEmail'];
      break;
    case 'birthday':
    case 'sweet16':
      requiredFields = ['honoreeName', 'parentName', 'parentPhone', 'parentEmail'];
      break;
    case 'banquet':
    case 'graduation':
      requiredFields = ['contactName', 'contactPhone', 'contactEmail'];
      break;
    default:
      requiredFields = [];
  }
  
  const missingFields = requiredFields.filter(field => !data[field as keyof FormData]);
  
  // Special validation for wedding emails - at least one is required
  if (data.eventType === 'wedding') {
    if (!data.brideEmail && !data.groomEmail) {
      missingFields.push('At least one email (bride or groom) is required');
    }
  }
  
  // Validate field lengths for security
  const stringFieldsToValidate = [
    { key: 'brideName' as const, maxLength: MAX_LENGTHS.name },
    { key: 'groomName' as const, maxLength: MAX_LENGTHS.name },
    { key: 'contactName' as const, maxLength: MAX_LENGTHS.name },
    { key: 'from' as const, maxLength: MAX_LENGTHS.name },
    { key: 'venue' as const, maxLength: MAX_LENGTHS.venue },
    { key: 'notes' as const, maxLength: MAX_LENGTHS.notes },
    { key: 'brideEmail' as const, maxLength: MAX_LENGTHS.email },
    { key: 'groomEmail' as const, maxLength: MAX_LENGTHS.email },
    { key: 'parentEmail' as const, maxLength: MAX_LENGTHS.email },
    { key: 'contactEmail' as const, maxLength: MAX_LENGTHS.email },
    { key: 'bridePhone' as const, maxLength: MAX_LENGTHS.phone },
    { key: 'groomPhone' as const, maxLength: MAX_LENGTHS.phone },
    { key: 'parentPhone' as const, maxLength: MAX_LENGTHS.phone },
    { key: 'contactPhone' as const, maxLength: MAX_LENGTHS.phone },
  ];
  
  stringFieldsToValidate.forEach(({ key, maxLength }) => {
    const value = data[key];
    if (typeof value === 'string' && value.length > 0) {
      if (!validateFieldLength(value, maxLength)) {
        validationErrors.push(`${key} exceeds maximum length of ${maxLength} characters`);
      }
    }
  });
  
  return {
    isValid: missingFields.length === 0 && validationErrors.length === 0,
    missingFields: [...missingFields, ...validationErrors]
  };
};
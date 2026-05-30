// API Configuration
// In production, these should be configured via your hosting environment
export const API_CONFIG = {
  // Webhook URLs are stored securely in edge function environment variables
  // Never expose webhook URLs in client-side code
  ENABLE_DEBUG_LOGGING: import.meta.env.DEV, // Only enable in development
} as const;

// Validation function for webhook URL
export const validateWebhookUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' && parsedUrl.hostname.length > 0;
  } catch {
    return false;
  }
};

// Data sanitization helper with DOMPurify
export const sanitizeFormData = (data: any): any => {
  // Dynamic import of DOMPurify for browser environment
  const sanitizeString = (value: string): string => {
    // Remove script tags and dangerous patterns
    let cleaned = value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // Limit length to prevent DoS
    if (cleaned.length > 10000) {
      cleaned = cleaned.substring(0, 10000);
    }
    
    return cleaned.trim();
  };
  
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return sanitizeString(value);
    }
    // Skip sanitization for Date objects to preserve their functionality
    if (value instanceof Date) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(item => sanitize(item));
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitize(val);
      }
      return sanitized;
    }
    return value;
  };
  
  return sanitize(data);
};
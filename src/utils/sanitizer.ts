import DOMPurify from 'dompurify';

/**
 * HTML Sanitization Utility
 * Uses DOMPurify to prevent XSS attacks in user-generated content
 */

export const sanitizer = {
  /**
   * Sanitize HTML content for safe rendering
   * @param dirty - Potentially unsafe HTML string
   * @param options - DOMPurify configuration options
   * @returns Sanitized HTML string
   */
  sanitizeHtml: (dirty: string, options?: any): string => {
    return String(DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
      ALLOW_DATA_ATTR: false,
      ...options,
    }));
  },

  /**
   * Strip all HTML tags and return plain text
   * @param dirty - HTML string
   * @returns Plain text only
   */
  stripHtml: (dirty: string): string => {
    return String(DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }));
  },

  /**
   * Escape HTML entities for safe display in text contexts
   * @param str - String to escape
   * @returns HTML-escaped string
   */
  escapeHtml: (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Sanitize URL to prevent javascript: and data: URIs
   * @param url - URL string to sanitize
   * @returns Safe URL or empty string if unsafe
   */
  sanitizeUrl: (url: string): string => {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || 
        trimmed.startsWith('data:') || 
        trimmed.startsWith('vbscript:')) {
      return '';
    }
    return url;
  },

  /**
   * Validate and sanitize email address
   * @param email - Email string
   * @returns Sanitized email or empty string if invalid
   */
  sanitizeEmail: (email: string): string => {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? trimmed : '';
  },
};

/**
 * Shared validation and sanitization utilities for Edge Functions
 * Production-safe: redacts PII from logs, validates inputs
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation (basic - allows various formats)
const PHONE_REGEX = /^[\d\s\-\+\(\)\.]{7,20}$/;

// Name validation (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[\p{L}\s\-'\\.]{1,100}$/u;

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Redact email for logging (shows first 2 chars + domain)
 */
export function redactEmail(email: string | undefined | null): string {
  if (!email) return '[no-email]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[invalid-email]';
  const localPart = parts[0];
  const domain = parts[1];
  const redactedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '***' 
    : '***';
  return `${redactedLocal}@${domain}`;
}

/**
 * Redact name for logging (shows first initial + length)
 */
export function redactName(name: string | undefined | null): string {
  if (!name) return '[no-name]';
  if (name.length <= 1) return '[name]';
  return `${name.charAt(0)}***[${name.length} chars]`;
}

/**
 * Redact phone for logging (shows last 4 digits)
 */
export function redactPhone(phone: string | undefined | null): string {
  if (!phone) return '[no-phone]';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '[phone]';
  return `***${digits.slice(-4)}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string | undefined | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim()) && email.length <= 254;
}

/**
 * Validate phone format
 */
export function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone || typeof phone !== 'string') return true; // Phone is often optional
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validate name format
 */
export function isValidName(name: string | undefined | null): boolean {
  if (!name || typeof name !== 'string') return false;
  return NAME_REGEX.test(name.trim()) && name.length <= 100;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string | undefined | null): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  return UUID_REGEX.test(uuid);
}

/**
 * Sanitize string input (trim, limit length, remove control chars)
 */
export function sanitizeString(input: string | undefined | null, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, maxLength);
}

/**
 * Create a safe log object that redacts PII
 */
export function createSafeLogPayload(data: Record<string, any>): Record<string, any> {
  const safeData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      safeData[key] = null;
      continue;
    }

    const lowerKey = key.toLowerCase();
    
    // Redact email fields
    if (lowerKey.includes('email')) {
      safeData[key] = redactEmail(String(value));
      continue;
    }
    
    // Redact phone fields
    if (lowerKey.includes('phone') || lowerKey.includes('tel')) {
      safeData[key] = redactPhone(String(value));
      continue;
    }
    
    // Redact name fields (but keep ID fields)
    if ((lowerKey.includes('name') && !lowerKey.includes('id')) && 
        typeof value === 'string' && 
        !lowerKey.includes('package') &&
        !lowerKey.includes('company') &&
        !lowerKey.includes('event') &&
        !lowerKey.includes('file')) {
      safeData[key] = redactName(String(value));
      continue;
    }
    
    // Keep other values as-is (but handle nested objects)
    if (typeof value === 'object' && !Array.isArray(value)) {
      safeData[key] = createSafeLogPayload(value);
    } else {
      safeData[key] = value;
    }
  }
  
  return safeData;
}

/**
 * Production-safe logger that redacts PII
 */
export const safeLogger = {
  info: (message: string, data?: Record<string, any>) => {
    if (data) {
      console.log(`[INFO] ${message}`, JSON.stringify(createSafeLogPayload(data)));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  
  warn: (message: string, data?: Record<string, any>) => {
    if (data) {
      console.warn(`[WARN] ${message}`, JSON.stringify(createSafeLogPayload(data)));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
  
  error: (message: string, error?: any, data?: Record<string, any>) => {
    const errorMsg = error?.message || String(error);
    if (data) {
      console.error(`[ERROR] ${message}: ${errorMsg}`, JSON.stringify(createSafeLogPayload(data)));
    } else {
      console.error(`[ERROR] ${message}: ${errorMsg}`);
    }
  },
  
  debug: (message: string, data?: Record<string, any>) => {
    // Only log in development - check for DEBUG env var
    if (Deno.env.get('DEBUG') === 'true') {
      if (data) {
        console.log(`[DEBUG] ${message}`, JSON.stringify(createSafeLogPayload(data)));
      } else {
        console.log(`[DEBUG] ${message}`);
      }
    }
  }
};

/**
 * Verify webhook signature using HMAC-SHA256
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return false;
    
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return mismatch === 0;
  } catch {
    return false;
  }
}

/**
 * Get admin emails from environment variable
 * IMPORTANT: Set ADMIN_EMAILS env var in Supabase Edge Function secrets
 */
export function getAuthorizedAdminEmails(): string[] {
  const envEmails = Deno.env.get('ADMIN_EMAILS');
  if (envEmails) {
    return envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  }
  // No hardcoded fallback - admin emails must be configured via environment variable
  safeLogger.warn("ADMIN_EMAILS environment variable not set - no admin emails configured");
  return [];
}

import { supabase } from "@/integrations/supabase/client";

/**
 * @deprecated This client-side rate limiter is deprecated and should not be used.
 * Rate limiting is now handled server-side in edge functions and cannot be bypassed.
 * This file is kept for backwards compatibility only.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: string;
  limit?: number;
  error?: string;
}

/**
 * Check if the current request is within rate limits
 * @param endpoint - The endpoint being accessed (e.g., 'form-submission', 'notification')
 * @returns Promise<RateLimitResult>
 */
export const checkRateLimit = async (endpoint: string = 'default'): Promise<RateLimitResult> => {
  try {
    // Get client IP (this will be set by edge function, but we'll use a fallback)
    const ipAddress = await getClientIP();

    const { data, error } = await supabase.functions.invoke('check-rate-limit', {
      body: { ipAddress, endpoint }
    });

    if (error) {
      if (import.meta.env.DEV) console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limit check fails
      return { allowed: true, error: 'Rate limit service unavailable' };
    }

    return data as RateLimitResult;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Rate limit check exception:', error);
    // Fail open - allow request on exception
    return { allowed: true, error: 'Rate limit check failed' };
  }
};

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string> {
  try {
    // Try to get IP from a public IP service
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    // Fallback to a hash of user agent + timestamp (not ideal but better than nothing)
    const userAgent = navigator.userAgent;
    const hash = await hashString(userAgent);
    return `client-${hash.substring(0, 8)}`;
  }
}

/**
 * Simple string hashing function
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

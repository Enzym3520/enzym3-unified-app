// Production-safe logging utility with security event tracking
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },

  debug: (context: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${context}`, data || '');
    }
  },

  /**
   * Log security-related events (always logged, even in production)
   * These logs help detect and investigate security incidents
   */
  security: (event: string, details?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      ...details,
    };

    // Only log security events in development until external monitoring is connected
    if (import.meta.env.DEV) {
      console.warn('[SECURITY]', logEntry);
    }

    // In production, this could be sent to a security monitoring service
    if (import.meta.env.PROD) {
      // Future: Send to security monitoring service
      // Example: sendToSecurityMonitor(logEntry);
    }
  },

  /**
   * Log authentication-related events
   */
  auth: (action: string, details?: Record<string, any>) => {
    logger.security(`AUTH_${action.toUpperCase()}`, details);
  },

  /**
   * Log rate limiting events
   */
  rateLimit: (action: 'EXCEEDED' | 'WARNING' | 'RESET', details?: Record<string, any>) => {
    logger.security(`RATE_LIMIT_${action}`, details);
  },

  /**
   * Log input validation failures (potential attack attempts)
   */
  validation: (field: string, reason: string, value?: string) => {
    logger.security('VALIDATION_FAILURE', {
      field,
      reason,
      // Never log full value in production - just first few chars
      valuePreview: import.meta.env.DEV ? value : value?.substring(0, 10) + '...',
    });
  },
};
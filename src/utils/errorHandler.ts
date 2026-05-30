// Production error handling utility
import { PRODUCTION_CONFIG } from '@/config/production';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if ('captureStackTrace' in Error) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export const handleError = (error: Error | AppError, context?: string) => {
  const errorMessage = error instanceof AppError 
    ? error.message 
    : PRODUCTION_CONFIG.ERROR_HANDLING.FALLBACK_ERROR_MESSAGE;

  // Log error details in development only
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]:`, error);
  }

  // In production, send to error tracking service
  if (import.meta.env.PROD && PRODUCTION_CONFIG.ERROR_HANDLING.LOG_ERRORS_TO_SERVICE) {
    // This would integrate with services like Sentry, LogRocket, etc.
    logErrorToService(error, context);
  }

  return errorMessage;
};

const logErrorToService = (error: Error, context?: string) => {
  // Implementation would depend on your error tracking service
  // Example: Sentry.captureException(error, { tags: { context } });
  if (import.meta.env.DEV) {
    console.log('Would log to error service:', { error, context });
  }
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  };
};
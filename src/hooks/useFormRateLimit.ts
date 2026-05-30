import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface RateLimitState {
  isLimited: boolean;
  remainingAttempts: number;
  resetTime: Date | null;
}

const RATE_LIMIT_KEY = 'form_submission_tracker';
const MAX_ATTEMPTS = 5; // Maximum submissions per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window

interface SubmissionTracker {
  attempts: number[];
  resetAt: number;
}

/**
 * Client-side rate limiting for form submissions
 * Prevents spam and abuse while providing user feedback
 */
export const useFormRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    remainingAttempts: MAX_ATTEMPTS,
    resetTime: null,
  });

  const getTracker = (): SubmissionTracker => {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      if (!stored) {
        const newTracker: SubmissionTracker = {
          attempts: [],
          resetAt: Date.now() + WINDOW_MS,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newTracker));
        return newTracker;
      }

      const tracker: SubmissionTracker = JSON.parse(stored);
      
      // Reset if window expired
      if (Date.now() > tracker.resetAt) {
        const newTracker: SubmissionTracker = {
          attempts: [],
          resetAt: Date.now() + WINDOW_MS,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newTracker));
        return newTracker;
      }

      return tracker;
    } catch (error) {
      logger.error('Rate limit tracker error:', error);
      return {
        attempts: [],
        resetAt: Date.now() + WINDOW_MS,
      };
    }
  };

  const checkRateLimit = (): boolean => {
    const tracker = getTracker();
    const now = Date.now();

    // Filter out attempts outside current window
    tracker.attempts = tracker.attempts.filter(
      timestamp => now - timestamp < WINDOW_MS
    );

    const remainingAttempts = MAX_ATTEMPTS - tracker.attempts.length;
    const isLimited = remainingAttempts <= 0;

    setRateLimitState({
      isLimited,
      remainingAttempts: Math.max(0, remainingAttempts),
      resetTime: new Date(tracker.resetAt),
    });

    if (isLimited) {
      logger.warn('Form submission rate limit exceeded', {
        attempts: tracker.attempts.length,
        resetAt: new Date(tracker.resetAt).toISOString(),
      });
    }

    return !isLimited;
  };

  const recordSubmission = (): void => {
    try {
      const tracker = getTracker();
      tracker.attempts.push(Date.now());
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(tracker));
      
      logger.debug('Form submission recorded', {
        totalAttempts: tracker.attempts.length,
        remaining: MAX_ATTEMPTS - tracker.attempts.length,
      });

      checkRateLimit();
    } catch (error) {
      logger.error('Failed to record submission:', error);
    }
  };

  const resetRateLimit = (): void => {
    try {
      localStorage.removeItem(RATE_LIMIT_KEY);
      setRateLimitState({
        isLimited: false,
        remainingAttempts: MAX_ATTEMPTS,
        resetTime: null,
      });
      logger.debug('Rate limit manually reset');
    } catch (error) {
      logger.error('Failed to reset rate limit:', error);
    }
  };

  // Check rate limit on mount
  useEffect(() => {
    checkRateLimit();
  }, []);

  return {
    ...rateLimitState,
    checkRateLimit,
    recordSubmission,
    resetRateLimit,
  };
};

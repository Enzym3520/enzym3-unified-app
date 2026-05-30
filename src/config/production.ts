// Production configuration
export const PRODUCTION_CONFIG = {
  // Remove all debug logs in production
  ENABLE_LOGGING: false,
  
  // API endpoints for production
  // NOTE: Zapier is now the PRIMARY automation tool (Nov 2025)
  // The N8N_WEBHOOK_URL environment variable should point to your Zapier webhook
  // See ZAPIER_CONFIGURATION_GUIDE.md for setup instructions
  API_ENDPOINTS: {
    get WEBHOOK_URL() {
      const url = import.meta.env.VITE_WEBHOOK_URL;
      if (!url) {
        throw new Error(
          'VITE_WEBHOOK_URL environment variable is required for production. ' +
          'Please set this variable to your n8n/Zapier webhook endpoint.'
        );
      }
      return url;
    },
  },
  
  // Performance optimizations
  PERFORMANCE: {
    ENABLE_ANALYTICS: true,
    LAZY_LOAD_COMPONENTS: true,
    CACHE_STATIC_ASSETS: true,
  },
  
  // Security settings
  SECURITY: {
    SANITIZE_INPUTS: true,
    VALIDATE_HEADERS: true,
    RATE_LIMITING: true,
  },
  
  // Error handling
  ERROR_HANDLING: {
    SHOW_STACK_TRACES: false,
    LOG_ERRORS_TO_SERVICE: true,
    FALLBACK_ERROR_MESSAGE: 'An unexpected error occurred. Please try again.',
  }
} as const;
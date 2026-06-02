// Centralized production URLs for registration links
// These ensure consistent links across all components and edge functions

export const ADMIN_VENDOR_PORTAL_URL = 'https://plan.enzym3entertainment.vip';
export const ADMIN_VENDOR_PORTAL_FALLBACK_URL = 'https://plan.enzym3entertainment.vip';
export const COUPLE_PORTAL_URL = 'https://plan.enzym3entertainment.vip';
export const VENDOR_APP_URL = 'https://plan.enzym3entertainment.vip';

// Registration paths
export const VENDOR_REGISTER_PATH = '/vendor-register';
export const CLIENT_REGISTER_PATH = '/register';

// Legacy path for backwards compatibility
export const COUPLE_REGISTER_PATH = '/couple/register';

// Helper functions to generate registration links
export const getVendorRegistrationLink = (code: string): string => 
  `${ADMIN_VENDOR_PORTAL_URL}${VENDOR_REGISTER_PATH}?code=${code}`;

export const getVendorRegistrationFallbackLink = (code: string): string => 
  `${ADMIN_VENDOR_PORTAL_FALLBACK_URL}${VENDOR_REGISTER_PATH}?code=${code}`;

export const getClientRegistrationLink = (code: string): string => 
  `${COUPLE_PORTAL_URL}${CLIENT_REGISTER_PATH}?code=${code}`;

// Legacy function name for backwards compatibility
export const getCoupleRegistrationLink = getClientRegistrationLink;

// Venue partner detection and pricing utilities

// Overtime rate defaults by booking source
export const VENUE_PARTNER_OVERTIME_RATE = 100;
export const INDEPENDENT_OVERTIME_RATE = 150;

/**
 * Get the default overtime rate based on booking source
 */
export function getDefaultOvertimeRate(bookingSource: string | null | undefined): number {
  return bookingSource === 'venue_partner' ? VENUE_PARTNER_OVERTIME_RATE : INDEPENDENT_OVERTIME_RATE;
}

// List of venue partners - these don't require contract/payment through the portal
const VENUE_PARTNERS = [
  'saguaro buttes',
  'saguarobuttes',
  'saguaro-buttes',
  'reflections at the buttes',
  'reflectionsatthebuttes',
];

/**
 * Check if a venue is a partner venue (no contract/payment required)
 */
export function isVenuePartner(venue: string | null | undefined): boolean {
  if (!venue) return false;
  const normalizedVenue = venue.toLowerCase().replace(/[^a-z0-9]/g, '');
  return VENUE_PARTNERS.some(partner => 
    normalizedVenue.includes(partner.replace(/[^a-z0-9]/g, ''))
  );
}

export type PricingType = 'hourly' | 'flat_rate';

/**
 * Calculate pricing for DJ services
 * - hourly: total = hours × hourlyRate
 * - flat_rate: total = flatTotal (hours/rate are informational only)
 */
export function calculatePricing(
  hours: number,
  hourlyRate: number,
  pricingType: PricingType = 'hourly',
  flatTotal?: number | null,
) {
  const total = pricingType === 'flat_rate' && flatTotal != null && flatTotal > 0
    ? flatTotal
    : hours * hourlyRate;

  const deposit = Math.round(total * 0.5);
  const balance = total - deposit;
  
  return {
    hours,
    hourlyRate,
    total,
    deposit,
    balance,
    pricingType,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

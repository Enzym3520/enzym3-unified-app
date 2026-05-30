/**
 * Vendor type display name mapping
 * Database stores values as lowercase, display names preserve acronyms
 */
const VENDOR_TYPE_DISPLAY_MAP: Record<string, string> = {
  dj: 'DJ',
  mc: 'MC',
  av: 'AV',
  photo_booth: 'Photo Booth',
  lighting: 'Lighting',
  photography: 'Photography',
  videography: 'Videography',
  floral: 'Floral',
  catering: 'Catering',
  venue: 'Venue',
  transportation: 'Transportation',
  bartending: 'Bartending',
  coordinator: 'Coordinator',
  officiant: 'Officiant',
  band: 'Band',
  florist: 'Florist',
  caterer: 'Caterer',
  decorator: 'Decorator',
  other: 'Other',
};

// Known acronyms that should always be uppercase
const ACRONYMS = ['DJ', 'MC', 'AV', 'VIP', 'TV'];

/**
 * Format a vendor type value for display
 * Preserves acronyms like DJ, MC, AV in all-caps
 * 
 * @param vendorType - The raw vendor type value from database (lowercase)
 * @returns Properly formatted display string
 */
export const formatVendorType = (vendorType: string | null | undefined): string => {
  if (!vendorType) return 'N/A';
  
  const normalized = vendorType.toLowerCase().trim();
  
  // Check if we have a specific mapping
  if (VENDOR_TYPE_DISPLAY_MAP[normalized]) {
    return VENDOR_TYPE_DISPLAY_MAP[normalized];
  }
  
  // Fallback: capitalize first letter of each word, but preserve known acronyms
  return normalized
    .split(/[_\s]+/)
    .map(word => {
      const upper = word.toUpperCase();
      if (ACRONYMS.includes(upper)) {
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

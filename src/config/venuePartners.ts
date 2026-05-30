// List of venue partners - bookings from these venues are handled by the venue
// (no contract/payment from Enzym3 directly)
export const VENUE_PARTNERS = [
  'Saguaro Buttes',
  'Reflections at the Buttes',
  'Saguaro Buttes Weddings',
  // Add more venue partners here as needed
];

// Check if a venue is a partner venue (case-insensitive partial match)
export const isVenuePartner = (venueName: string): boolean => {
  if (!venueName) return false;
  const normalizedVenue = venueName.toLowerCase().trim();
  return VENUE_PARTNERS.some(partner => 
    normalizedVenue.includes(partner.toLowerCase()) ||
    partner.toLowerCase().includes(normalizedVenue)
  );
};


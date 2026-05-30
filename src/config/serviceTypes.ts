export const SERVICE_TYPES = [
  { value: 'dj', label: 'DJ Services' },
  { value: 'mc', label: 'MC/Host' },
  { value: 'ceremony_sound', label: 'Ceremony Sound' },
  { value: 'uplighting', label: 'Uplighting' },
  { value: 'photo_booth', label: 'Photo Booth' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'live_musician', label: 'Live Musician' },
  { value: 'videography', label: 'Videography' },
  { value: 'photography', label: 'Photography' },
  { value: 'lighting', label: 'Lighting Design' },
  { value: 'av_equipment', label: 'AV Equipment Rental' },
] as const;

export const RATE_TYPES = [
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'flat_fee', label: 'Flat Fee' },
  { value: 'per_event', label: 'Per Event' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid', color: 'destructive' },
  { value: 'paid_to_vendor', label: 'Paid to Vendor', color: 'default' },
  { value: 'collected_from_client', label: 'Collected from Client', color: 'default' },
  { value: 'fully_paid', label: 'Fully Paid', color: 'success' },
] as const;

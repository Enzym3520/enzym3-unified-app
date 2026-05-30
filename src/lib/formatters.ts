import { capitalizeWords } from "@/lib/utils";

// Central display formatters for database values

/** Parse a date-only string (YYYY-MM-DD) as local midnight instead of UTC. */
export function parseLocalDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  return new Date(dateStr);
}

export function formatPackageType(pkg: string | null): string {
  if (!pkg) return '';
  const map: Record<string, string> = {
    'gold': 'Gold',
    'silver': 'Silver',
    'bronze': 'Bronze',
    'platinum': 'Platinum',
    'diamond': 'Diamond',
    'standard': 'Standard',
    'premium': 'Premium',
    'ceremony-only': 'Ceremony Only',
    'ceremony-w-patio': 'Ceremony w/ Patio',
  };
  return map[pkg.toLowerCase()] || capitalizeWords(pkg);
}

export function formatMeetingType(type: string | null): string {
  if (!type) return '';
  const map: Record<string, string> = {
    'dj_details': 'DJ Details Meeting',
    'consultation': 'Quick Consultation',
    'follow_up': 'Follow-Up Call',
    'venue_tour': 'Venue Tour',
    'final_walkthrough': 'Final Walkthrough',
    'planning': 'Planning Session',
  };
  return map[type] || capitalizeWords(type.replace(/_/g, ' '));
}

export function formatMeetingFormat(fmt: string | null): string {
  if (!fmt) return '';
  const map: Record<string, string> = {
    'in_person': 'In-Person',
    'online': 'Online',
  };
  return map[fmt] || capitalizeWords(fmt.replace(/_/g, ' '));
}

export function formatBookingSource(source: string | null): string {
  if (!source) return '';
  const map: Record<string, string> = {
    'venue_partner': 'Venue Partner',
    'independent': 'Independent',
    'referral': 'Referral',
  };
  return map[source] || capitalizeWords(source.replace(/_/g, ' '));
}

export function formatStatus(status: string | null): string {
  if (!status) return '';
  const map: Record<string, string> = {
    'submitted': 'Submitted',
    'registered': 'Registered',
    'confirmed': 'Confirmed',
    'pending': 'Pending',
    'cancelled': 'Cancelled',
    'scheduled': 'Scheduled',
    'completed': 'Completed',
  };
  return map[status] || capitalizeWords(status.replace(/_/g, ' '));
}

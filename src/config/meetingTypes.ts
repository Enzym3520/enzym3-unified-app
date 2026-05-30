export const MEETING_TYPES = [
  { value: 'consultation', label: 'Initial Consultation' },
  { value: 'dj_details', label: 'Vendor Details Review' },
  { value: 'follow_up', label: 'Follow-up Call' },
  { value: 'venue_tour', label: 'Venue Tour' },
  { value: 'final_walkthrough', label: 'Final Walkthrough' },
  { value: 'planning', label: 'Planning Session' },
] as const;

const labelMap: Record<string, string> = Object.fromEntries(
  MEETING_TYPES.map(({ value, label }) => [value, label])
);

export function getMeetingTypeLabel(type: string): string {
  return labelMap[type] || type;
}

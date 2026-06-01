/**
 * Auto-capitalizes each word as the user types.
 * "john doe" → "John Doe"
 */
export function smartCapitalize(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats a phone string as (555) 123-4567 while typing.
 * Strips non-digits, then applies formatting.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export const EVENT_TYPE_OPTIONS = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "quinceanera", label: "Quinceañera" },
  { value: "sweet_16", label: "Sweet 16" },
  { value: "graduation", label: "Graduation" },
  { value: "banquet", label: "Banquet" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
] as const;

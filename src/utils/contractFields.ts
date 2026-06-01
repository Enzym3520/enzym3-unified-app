/** Smart field placeholders for contract templates */

export const CONTRACT_PLACEHOLDERS = [
  { key: "{{couple_name}}", label: "Couple / Client Name" },
  { key: "{{event_date}}", label: "Event Date" },
  { key: "{{event_type}}", label: "Event Type" },
  { key: "{{venue}}", label: "Venue" },
  { key: "{{guest_count}}", label: "Guest Count" },
  { key: "{{total_price}}", label: "Total Price" },
  { key: "{{hours_booked}}", label: "Hours Booked" },
  { key: "{{package_type}}", label: "Package Type" },
  { key: "{{vendor_name}}", label: "Vendor Name" },
  { key: "{{vendor_company}}", label: "Vendor Company" },
  { key: "{{today_date}}", label: "Today's Date" },
] as const;

export interface EventFieldData {
  couple_name?: string;
  event_date?: string;
  event_type?: string;
  venue?: string | null;
  guest_count?: number | null;
  total_price?: number | null;
  hours_booked?: number | null;
  package_type?: string | null;
}

export interface VendorFieldData {
  vendor_name?: string;
  vendor_company?: string;
}

export function renderContractBody(
  html: string,
  event?: EventFieldData | null,
  vendor?: VendorFieldData | null
): string {
  let result = html;
  result = result.replace(/\{\{couple_name\}\}/g, event?.couple_name ?? "_______________");
  result = result.replace(/\{\{event_date\}\}/g, event?.event_date ?? "_______________");
  result = result.replace(/\{\{event_type\}\}/g, event?.event_type ?? "_______________");
  result = result.replace(/\{\{venue\}\}/g, event?.venue ?? "_______________");
  result = result.replace(/\{\{guest_count\}\}/g, String(event?.guest_count ?? "___"));
  result = result.replace(/\{\{total_price\}\}/g, event?.total_price ? `$${event.total_price.toLocaleString()}` : "$___");
  result = result.replace(/\{\{hours_booked\}\}/g, String(event?.hours_booked ?? "___"));
  result = result.replace(/\{\{package_type\}\}/g, event?.package_type ?? "_______________");
  result = result.replace(/\{\{vendor_name\}\}/g, vendor?.vendor_name ?? "_______________");
  result = result.replace(/\{\{vendor_company\}\}/g, vendor?.vendor_company ?? "_______________");
  result = result.replace(/\{\{today_date\}\}/g, new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  return result;
}

/**
 * Rewrite a raw notification route to the vendor portal equivalent.
 * Raw routes from getNotificationRoute use bare /path patterns (no portal prefix).
 */
export function toVendorNotificationRoute(route: string | null): string | null {
  if (!route) return null;
  if (route.startsWith("/vendor/")) return route;
  if (route === "/") return "/vendor/dashboard";
  // Root with query params like /?event=xxx → /vendor/dashboard?event=xxx
  if (route.startsWith("/?")) return `/vendor/dashboard${route.slice(1)}`;
  return route.replace(/^\//, "/vendor/");
}

/**
 * Compute the deep-link route for a notification based on its type + metadata.
 * Returns null if no specific route applies (caller should fall back to /notifications).
 */
export function getNotificationRoute(
  type: string,
  metadata: Record<string, any> | null | undefined,
  weddingId?: string | null,
): string | null {
  const m = metadata || {};
  const eventId = m.assignment_id || m.event_id || weddingId;

  switch (type) {
    case "vendor_assignment":
    case "new_assignment":
    case "vendor_confirmed":
    case "vendor_declined":
    case "vendor_completed":
    case "assignment_cancelled":
    case "event_updated":
      return eventId ? `/?event=${eventId}` : "/";

    case "message": {
      const thread = m.thread_id || m.wedding_id || weddingId;
      return thread ? `/messages?thread=${thread}` : "/messages";
    }

    case "meeting_scheduled":
    case "meeting_updated":
    case "meeting_cancelled":
      return m.meeting_id ? `/meetings?id=${m.meeting_id}` : "/meetings";

    case "contract_signed":
    case "contract_sent":
    case "contract_viewed":
      return m.contract_id ? `/contracts?id=${m.contract_id}` : "/contracts";

    case "vendor_files_uploaded":
    case "file_uploaded":
    case "music_sheet_created":
    case "music_sheet_updated": {
      const wid = m.wedding_id || weddingId;
      return wid ? `/documents?event=${wid}` : "/documents";
    }

    case "reminder":
      return m.event_date ? `/calendar?date=${m.event_date}` : "/calendar";

    case "booking_request":
      return "/booking-requests";

    default:
      return "/notifications";
  }
}

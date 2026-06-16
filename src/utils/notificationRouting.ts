/**
 * Single source of truth for notification deep-linking across all three portals.
 *
 * Previously this logic was split across two functions that disagreed with each
 * other and had to be updated in parallel:
 *   - buildNotificationHref  (staff, in notificationTypeMap.tsx)
 *   - getNotificationRoute + toVendorNotificationRoute (vendor + client)
 * The client portal never got its own rewriter, so client notification toasts
 * routed to bare paths (/messages) that don't exist under the client's /app/*
 * namespace. Adding a new notification type meant editing 2-3 places or it would
 * silently break in one portal.
 *
 * Now: add a type to NOTIFICATION_CATALOG once, and every portal derives its own
 * correct route from the shared logical category.
 */

export type Portal = "staff" | "vendor" | "client";

export interface NotificationLike {
  type: string;
  wedding_id?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Logical destination category for a notification — portal-agnostic. Each portal
 * maps the category to its own concrete route below.
 */
type Category =
  | "assignment" // event/assignment-scoped vendor work
  | "message"
  | "meeting"
  | "contract"
  | "files"
  | "music"
  | "reminder"
  | "upgrades"
  | "bookingRequest"
  | "reviewRequest"
  | "reviewAdmin" // admin-facing "review submitted"
  | "inquiry"; // admin-facing contact inquiry

interface CatalogEntry {
  category: Category;
  /** Staff contacts-modal tab (when the notification is event-scoped). */
  staffTab?: string;
  /** Staff: route to the standalone /staff/event/:id page instead of the modal. */
  staffEventRoute?: boolean;
}

/**
 * The one place to register a notification type. Keep entries here; portals
 * derive routes automatically. Tabs mirror the TabsTrigger values in
 * ContactDetailsModal (overview, messages, assignments, events, forms, music,
 * upgrades, details).
 */
export const NOTIFICATION_CATALOG: Record<string, CatalogEntry> = {
  // Vendor assignment lifecycle (event-scoped)
  vendor_assignment: { category: "assignment", staffEventRoute: true },
  new_assignment: { category: "assignment", staffEventRoute: true },
  assignment_cancelled: { category: "assignment", staffEventRoute: true },
  event_updated: { category: "assignment", staffEventRoute: true },
  vendor_confirmed: { category: "assignment", staffTab: "assignments" },
  vendor_declined: { category: "assignment", staffTab: "assignments" },
  vendor_completed: { category: "assignment", staffTab: "assignments" },

  // Messaging
  message: { category: "message", staffTab: "messages" },
  client_message: { category: "message", staffTab: "messages" },

  // Meetings
  meeting_scheduled: { category: "meeting", staffTab: "overview" },
  meeting_updated: { category: "meeting", staffTab: "overview" },
  meeting_cancelled: { category: "meeting", staffTab: "overview" },
  meeting_booked: { category: "meeting", staffTab: "overview" },

  // Contracts
  contract_signed: { category: "contract", staffTab: "forms" },
  contract_sent: { category: "contract", staffTab: "forms" },
  contract_viewed: { category: "contract", staffTab: "forms" },

  // Files / documents
  file_uploaded: { category: "files", staffTab: "forms" },
  vendor_files_uploaded: { category: "files", staffTab: "assignments" },

  // Music / vibe sheet
  music_sheet_created: { category: "music", staffTab: "music" },
  music_sheet_updated: { category: "music", staffTab: "music" },
  vibe_sheet_updated: { category: "music", staffTab: "music" },

  // Calendar reminders
  reminder: { category: "reminder" },

  // Upgrades / payments
  upgrade_order: { category: "upgrades", staffTab: "upgrades" },
  payment_received: { category: "upgrades", staffTab: "upgrades" },

  // Booking + reviews + inquiries
  booking_request: { category: "bookingRequest" },
  review_request: { category: "reviewRequest" },
  review_submitted: { category: "reviewAdmin" },
  contact_inquiry: { category: "inquiry" },
};

/** Resolve the wedding/event id from a notification's columns + metadata. */
function resolveWeddingId(n: NotificationLike): string | undefined {
  const m = n.metadata || {};
  return m.wedding_id || n.wedding_id || m.enh_id || m.event_id || undefined;
}

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${path}?${qs}` : path;
}

// Vibe Planner's target_tab vocabulary doesn't match this app's modal tabs.
// Normalize incoming tab names to the ContactDetailsModal TabsTrigger values.
const STAFF_TAB_ALIAS: Record<string, string> = {
  payments: "upgrades",
  payment: "upgrades",
  contract: "forms",
  contracts: "forms",
  files: "forms",
  file: "forms",
  documents: "forms",
  "vibe-sheet": "music",
  vibesheet: "music",
  vibe_sheet: "music",
  music_sheet: "music",
  "music-sheet": "music",
  meetings: "overview",
  meeting: "overview",
};

function resolveStaff(n: NotificationLike, entry: CatalogEntry | undefined): string {
  const m = n.metadata || {};
  const weddingId = resolveWeddingId(n);

  // Admin-facing categories have dedicated dashboards regardless of scope.
  if (entry?.category === "reviewAdmin") return "/staff/admin-dashboard?tab=reviews";
  if (entry?.category === "inquiry") return "/staff/admin-dashboard";

  if (weddingId) {
    if (entry?.staffEventRoute) return `/staff/event/${weddingId}`;
    const rawTab = m.target_tab || entry?.staffTab;
    const tab = rawTab ? STAFF_TAB_ALIAS[rawTab] || rawTab : undefined;
    return withQuery("/staff/contacts", { wedding_id: weddingId, tab });
  }

  // No event scope and no static destination — land on the notifications page
  // rather than silently doing nothing.
  return "/staff/notifications";
}

function resolveVendor(n: NotificationLike, entry: CatalogEntry | undefined): string {
  const m = n.metadata || {};
  const weddingId = resolveWeddingId(n);

  switch (entry?.category) {
    case "assignment": {
      const eventId = m.assignment_id || m.event_id || weddingId;
      return withQuery("/vendor/dashboard", { event: eventId });
    }
    case "message": {
      const thread = m.thread_id || m.wedding_id || weddingId;
      return withQuery("/vendor/messages", { thread });
    }
    case "meeting":
      return withQuery("/vendor/meetings", { id: m.meeting_id });
    case "contract":
      return withQuery("/vendor/contracts", { id: m.contract_id });
    case "files":
    case "music":
      return withQuery("/vendor/documents", { event: m.wedding_id || weddingId });
    case "reminder":
      return withQuery("/vendor/calendar", { date: m.event_date });
    case "bookingRequest":
      return "/vendor/booking-requests";
    default:
      // upgrades, reviewRequest, reviewAdmin, inquiry, unknown — no vendor surface
      return "/vendor/notifications";
  }
}

function resolveClient(n: NotificationLike, entry: CatalogEntry | undefined): string {
  const m = n.metadata || {};
  const weddingId = resolveWeddingId(n);

  switch (entry?.category) {
    case "message":
      return withQuery("/app/messages", { thread: m.thread_id || weddingId });
    case "meeting":
      return "/app/meeting";
    case "contract":
      return "/app/contract";
    case "files":
      return "/app/uploads";
    case "music":
      return "/app/vibe-sheet";
    case "reminder":
      return "/app/schedule";
    case "upgrades":
      return "/app/upgrades";
    case "reviewRequest":
      return "/app/review";
    default:
      // assignment, bookingRequest, reviewAdmin, inquiry, unknown — not client-facing
      return "/app/dashboard";
  }
}

/**
 * Compute the in-app deep-link for a notification, scoped to the given portal.
 * Always returns a concrete route (never null) so a click never dead-ends.
 */
export function resolveNotificationRoute(n: NotificationLike, portal: Portal): string {
  const entry = NOTIFICATION_CATALOG[n.type];
  switch (portal) {
    case "staff":
      return resolveStaff(n, entry);
    case "vendor":
      return resolveVendor(n, entry);
    case "client":
      return resolveClient(n, entry);
  }
}

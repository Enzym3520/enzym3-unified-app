import {
  Package,
  Music,
  MessageSquare,
  Video,
  DollarSign,
  FileSignature,
  Paperclip,
  CalendarPlus,
  CalendarX,
  Star,
  Mail,
  Sparkles,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export interface NotificationTypeConfig {
  Icon: LucideIcon;
  /** Default tab when metadata.target_tab is not provided */
  defaultTab?: string;
  /** Static route if the notification is not scoped to a wedding/event */
  staticRoute?: string;
  /**
   * When true, scope-to-event notifications route to the standalone event
   * detail page (/event/:id) instead of opening the Contacts modal. Used for
   * vendor-facing notifications where Contacts isn't accessible/useful.
   */
  eventRoute?: boolean;
}

// NOTE: defaultTab values MUST match TabsTrigger values in ContactDetailsModal.
// Available tabs: overview, messages, assignments, events, forms, music, upgrades, details.
export const NOTIFICATION_TYPE_MAP: Record<string, NotificationTypeConfig> = {
  upgrade_order: { Icon: Sparkles, defaultTab: 'upgrades' },
  music_sheet_created: { Icon: Music, defaultTab: 'music' },
  music_sheet_updated: { Icon: Music, defaultTab: 'music' },
  message: { Icon: MessageSquare, defaultTab: 'messages' },
  meeting_scheduled: { Icon: Video, defaultTab: 'overview' },

  // New (Vibe Planner + shared) — remapped to existing modal tabs
  payment_received: { Icon: DollarSign, defaultTab: 'upgrades' },
  contract_signed: { Icon: FileSignature, defaultTab: 'forms' },
  file_uploaded: { Icon: Paperclip, defaultTab: 'forms' },
  vibe_sheet_updated: { Icon: Music, defaultTab: 'music' },
  client_message: { Icon: MessageSquare, defaultTab: 'messages' },
  meeting_booked: { Icon: CalendarPlus, defaultTab: 'overview' },
  meeting_cancelled: { Icon: CalendarX, defaultTab: 'overview' },
  review_submitted: { Icon: Star, staticRoute: '/staff/admin-dashboard?tab=reviews' },
  contact_inquiry: { Icon: Mail, staticRoute: '/staff/admin-dashboard' },

  // Vendor-facing assignment notifications — route to the event detail page
  new_assignment: { Icon: CalendarPlus, eventRoute: true },
  vendor_assignment: { Icon: CalendarPlus, eventRoute: true },
  assignment_cancelled: { Icon: CalendarX, eventRoute: true },

  // Admin-facing vendor status notifications — open the contact's Vendors tab
  vendor_confirmed: { Icon: CheckCircle, defaultTab: 'assignments' },
  vendor_declined: { Icon: XCircle, defaultTab: 'assignments' },
  vendor_completed: { Icon: CheckCircle, defaultTab: 'assignments' },
  vendor_files_uploaded: { Icon: Paperclip, defaultTab: 'assignments' },
};


export const getNotificationConfig = (type: string): NotificationTypeConfig => {
  return NOTIFICATION_TYPE_MAP[type] || { Icon: Package };
};

/**
 * Build the destination URL for a notification. Prefers metadata.wedding_id
 * + metadata.target_tab, falls back to the type's default tab or static route.
 */
export const buildNotificationHref = (notification: {
  type: string;
  wedding_id?: string | null;
  metadata?: Record<string, any> | null;
}): string | null => {
  const cfg = getNotificationConfig(notification.type);
  const meta = notification.metadata || {};
  // Vibe Planner sometimes stores the wedding reference as enh_id or event_id
  // in metadata, with the top-level column left null. Honor all of them.
  const weddingId =
    meta.wedding_id || notification.wedding_id || meta.enh_id || meta.event_id;
  // Vibe Planner's target_tab vocabulary doesn't match this app's modal tabs.
  // Normalize to existing TabsTrigger values; fall back to type's defaultTab.
  const TAB_ALIAS: Record<string, string> = {
    payments: 'upgrades',
    payment: 'upgrades',
    contract: 'forms',
    contracts: 'forms',
    files: 'forms',
    file: 'forms',
    documents: 'forms',
    'vibe-sheet': 'music',
    vibesheet: 'music',
    vibe_sheet: 'music',
    music_sheet: 'music',
    'music-sheet': 'music',
    meetings: 'overview',
    meeting: 'overview',
  };
  const rawTab = meta.target_tab || cfg.defaultTab;
  const tab = rawTab ? (TAB_ALIAS[rawTab] || rawTab) : undefined;

  if (weddingId) {
    if (cfg.eventRoute) {
      return `/staff/event/${weddingId}`;
    }
    const qs = tab ? `&tab=${encodeURIComponent(tab)}` : '';
    return `/staff/contacts?wedding_id=${weddingId}${qs}`;
  }
  if (cfg.staticRoute) return cfg.staticRoute;

  // Fallback: a notification with no event scope and no static route should still
  // take the user somewhere on click. Land them on the notifications page rather
  // than silently doing nothing (the old behavior for unmapped/metadata-less types).
  return '/staff/notifications';
};

export const isFromVibePlanner = (notification: {
  metadata?: Record<string, any> | null;
}): boolean => notification.metadata?.source_app === 'vibe_planner';

import type { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  assignments: {
    all: (userId?: string) => ["assignments", userId] as const,
    root: () => ["assignments"] as const,
  },
  dashboardCounts: () => ["dashboard-counts"] as const,
  achievements: {
    all: (vendorId?: string) => ["vendor-achievements", vendorId] as const,
    root: () => ["vendor-achievements"] as const,
  },
  services: {
    all: (userId?: string) => ["vendor-services", userId] as const,
    root: () => ["vendor-services"] as const,
  },
  packages: {
    all: (userId?: string) => ["vendor-packages", userId] as const,
    root: () => ["vendor-packages"] as const,
  },
  addOns: {
    all: (userId?: string) => ["vendor-addons", userId] as const,
    root: () => ["vendor-addons"] as const,
  },
  vendorPage: {
    all: (userId?: string) => ["vendor-page", userId] as const,
    root: () => ["vendor-page"] as const,
  },
  vendorStats: {
    all: (vendorId?: string) => ["vendor-stats", vendorId] as const,
    withProfile: (vendorId?: string) => ["vendor-stats-with-profile", vendorId] as const,
  },
  calendar: {
    events: (vendorId?: string, month?: string, viewType?: string) =>
      ["vendor-calendar-events", vendorId, month, viewType] as const,
    stats: (vendorId?: string, month?: string) =>
      ["vendor-calendar-stats", vendorId, month] as const,
  },
  gig: {
    assignment: (assignmentId?: string) => ["gig-assignment", assignmentId] as const,
  },
  eventVendors: (eventId?: string) => ["event-vendors", eventId] as const,
  eventTimeline: (eventId?: string) => ["event-timeline", eventId] as const,
} as const;

/**
 * Invalidates all assignment-related caches — use after any assignment mutation.
 */
export function invalidateAssignmentCaches(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: queryKeys.assignments.root() });
  qc.invalidateQueries({ queryKey: queryKeys.dashboardCounts() });
}

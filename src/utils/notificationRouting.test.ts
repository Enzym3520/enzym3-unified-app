import { describe, it, expect } from "vitest";
import { resolveNotificationRoute } from "./notificationRouting";

const n = (type: string, wedding_id: string | null = null, metadata: Record<string, any> | null = null) => ({
  type,
  wedding_id,
  metadata,
});

describe("resolveNotificationRoute — staff (matches legacy buildNotificationHref)", () => {
  it("event-scoped message → contacts modal on the messages tab", () => {
    expect(resolveNotificationRoute(n("message", "w1"), "staff")).toBe(
      "/staff/contacts?wedding_id=w1&tab=messages",
    );
  });

  it("assignment notifications → standalone event detail page", () => {
    expect(resolveNotificationRoute(n("new_assignment", "w2"), "staff")).toBe("/staff/event/w2");
  });

  it("normalizes Vibe Planner target_tab via the alias map", () => {
    expect(resolveNotificationRoute(n("payment_received", "w3", { target_tab: "payments" }), "staff")).toBe(
      "/staff/contacts?wedding_id=w3&tab=upgrades",
    );
  });

  it("admin categories route to the admin dashboard regardless of scope", () => {
    expect(resolveNotificationRoute(n("review_submitted"), "staff")).toBe("/staff/admin-dashboard?tab=reviews");
    expect(resolveNotificationRoute(n("contact_inquiry"), "staff")).toBe("/staff/admin-dashboard");
  });

  it("falls back to the notifications page for unscoped/unmapped types", () => {
    expect(resolveNotificationRoute(n("message"), "staff")).toBe("/staff/notifications");
    expect(resolveNotificationRoute(n("brand_new_type"), "staff")).toBe("/staff/notifications");
  });
});

describe("resolveNotificationRoute — vendor (matches legacy getNotificationRoute + toVendor)", () => {
  it("assignment → vendor dashboard with event id", () => {
    expect(resolveNotificationRoute(n("vendor_assignment", "e1"), "vendor")).toBe("/vendor/dashboard?event=e1");
    expect(resolveNotificationRoute(n("vendor_assignment"), "vendor")).toBe("/vendor/dashboard");
  });

  it("message → vendor messages with thread", () => {
    expect(resolveNotificationRoute(n("message", null, { thread_id: "t1" }), "vendor")).toBe(
      "/vendor/messages?thread=t1",
    );
  });

  it("meeting / contract / files / reminder map to their vendor pages", () => {
    expect(resolveNotificationRoute(n("meeting_scheduled", null, { meeting_id: "m1" }), "vendor")).toBe(
      "/vendor/meetings?id=m1",
    );
    expect(resolveNotificationRoute(n("contract_signed", null, { contract_id: "c1" }), "vendor")).toBe(
      "/vendor/contracts?id=c1",
    );
    expect(resolveNotificationRoute(n("file_uploaded", "w9"), "vendor")).toBe("/vendor/documents?event=w9");
    expect(resolveNotificationRoute(n("reminder", null, { event_date: "2026-06-20" }), "vendor")).toBe(
      "/vendor/calendar?date=2026-06-20",
    );
  });

  it("booking requests and non-vendor categories fall back sensibly", () => {
    expect(resolveNotificationRoute(n("booking_request"), "vendor")).toBe("/vendor/booking-requests");
    expect(resolveNotificationRoute(n("upgrade_order"), "vendor")).toBe("/vendor/notifications");
    expect(resolveNotificationRoute(n("review_submitted"), "vendor")).toBe("/vendor/notifications");
  });
});

describe("resolveNotificationRoute — client (regression: must use /app/* namespace)", () => {
  it("never returns a bare path that 404s under the client portal", () => {
    const cases = ["message", "contract_signed", "meeting_scheduled", "file_uploaded", "music_sheet_updated", "upgrade_order", "reminder", "review_request"];
    for (const t of cases) {
      const route = resolveNotificationRoute(n(t, "w1"), "client");
      expect(route.startsWith("/app/")).toBe(true);
    }
  });

  it("maps client categories to the right /app pages", () => {
    expect(resolveNotificationRoute(n("message", "w1"), "client")).toBe("/app/messages?thread=w1");
    expect(resolveNotificationRoute(n("contract_signed"), "client")).toBe("/app/contract");
    expect(resolveNotificationRoute(n("meeting_scheduled"), "client")).toBe("/app/meeting");
    expect(resolveNotificationRoute(n("file_uploaded"), "client")).toBe("/app/uploads");
    expect(resolveNotificationRoute(n("music_sheet_updated"), "client")).toBe("/app/vibe-sheet");
    expect(resolveNotificationRoute(n("upgrade_order"), "client")).toBe("/app/upgrades");
    expect(resolveNotificationRoute(n("review_request"), "client")).toBe("/app/review");
  });

  it("falls back to the client dashboard for non-client categories", () => {
    expect(resolveNotificationRoute(n("vendor_assignment"), "client")).toBe("/app/dashboard");
    expect(resolveNotificationRoute(n("totally_unknown"), "client")).toBe("/app/dashboard");
  });
});

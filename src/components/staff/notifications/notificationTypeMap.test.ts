import { describe, it, expect } from 'vitest';
import { buildNotificationHref } from './notificationTypeMap';

describe('buildNotificationHref', () => {
  it('routes an event-scoped notification to the contacts modal with its tab', () => {
    expect(
      buildNotificationHref({ type: 'message', wedding_id: 'w1', metadata: null }),
    ).toBe('/staff/contacts?wedding_id=w1&tab=messages');
  });

  it('routes vendor-facing assignment notifications to the event detail page', () => {
    expect(
      buildNotificationHref({ type: 'new_assignment', wedding_id: 'w2', metadata: null }),
    ).toBe('/staff/event/w2');
  });

  it('honors a static route for non-event notifications', () => {
    expect(
      buildNotificationHref({ type: 'contact_inquiry', wedding_id: null, metadata: null }),
    ).toBe('/staff/admin-dashboard');
  });

  // Regression: previously returned null for unmapped types / missing wedding scope,
  // which made the notification click silently do nothing.
  it('falls back to the notifications page for an unmapped type', () => {
    expect(
      buildNotificationHref({ type: 'some_brand_new_type', wedding_id: null, metadata: null }),
    ).toBe('/staff/notifications');
  });

  it('falls back to the notifications page when a mapped type has no wedding scope', () => {
    expect(
      buildNotificationHref({ type: 'message', wedding_id: null, metadata: null }),
    ).toBe('/staff/notifications');
  });
});

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Supabase API — network first, short cache
registerRoute(
  /^https:\/\/ytembomoyhuwdtrzlwbi\.supabase\.co\/.*/i,
  new NetworkFirst({
    cacheName: 'supabase-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
  }),
  'GET'
);

// Show notification when a push arrives
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  const title: string = data.title ?? 'Enzym3 Entertainment';
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: '/apple-touch-icon.png',
    badge: '/favicon.ico',
    tag: data.tag ?? 'default',
    data: { url: data.url ?? '/' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Route to the correct portal page when the user taps the notification
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl: string = (event.notification.data?.url as string) ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open, focus it and navigate
        for (const client of clientList) {
          if ('navigate' in client && 'focus' in client) {
            (client as WindowClient).focus();
            (client as WindowClient).navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new tab
        return self.clients.openWindow(targetUrl);
      })
  );
});

/**
 * Service Worker with Push Notification Support
 *
 * Handles:
 * - Asset caching (via Workbox)
 * - Push notifications
 * - Notification click actions
 */

/// <reference types="vite/client" />
/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Precache and route assets
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Handle push notification events
 */
self.addEventListener('push', (event: PushEvent) => {
	if (!event.data) {
		return;
	}

	try {
		const data = event.data.json();
		const title = data.title || 'Trakit';
		const options: NotificationOptions = {
			body: data.body || '',
			icon: data.icon || '/icon-192.png',
			badge: data.badge || '/icon-192.png',
			tag: data.tag || 'trakit-notification',
			data: data.data || {},
			requireInteraction: false
		};

		event.waitUntil(self.registration.showNotification(title, options));
	} catch (error) {
		console.error('Failed to show notification:', error);
	}
});

/**
 * Handle notification click events
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
	event.notification.close();

	// Open or focus the Trakit app
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			// Check if app is already open
			for (const client of clientList) {
				if (client.url.includes(self.location.origin) && 'focus' in client) {
					return client.focus();
				}
			}

			// Open new window if not open
			if (self.clients.openWindow) {
				return self.clients.openWindow('/');
			}
		})
	);
});

/**
 * Handle service worker activation
 */
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

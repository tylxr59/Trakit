import { browser } from '$app/environment';

export async function handleError({ error, event }) {
	// You can log the error here or send it to an error tracking service
	console.error('Client error:', error, event);
}

// Register service worker
if (browser && 'serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('/sw.js')
		.then((registration) => {
			console.log('Service Worker registered with scope:', registration.scope);

			// Listen for updates
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
							// New service worker activated, could show update notification
							console.log('New service worker activated');
						}
					});
				}
			});
		})
		.catch((error) => {
			console.error('Service Worker registration failed:', error);
		});
}

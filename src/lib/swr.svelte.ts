import { invalidateAll } from '$app/navigation';
import { browser } from '$app/environment';

/**
 * Lightweight SWR (Stale-While-Revalidate) implementation
 * Automatically refetches data when:
 * - Window regains focus (switching tabs/windows)
 * - Network reconnects (switching between devices/networks)
 */

interface SwrOptions {
	/** Minimum time (ms) since last refresh before allowing another refresh. Default: 3000ms */
	debounceMs?: number;
	/** Enable focus-based refetch. Default: true */
	refetchOnFocus?: boolean;
	/** Enable network reconnect refetch. Default: true */
	refetchOnReconnect?: boolean;
}

export function useAutoRefetch(options: SwrOptions = {}) {
	const {
		debounceMs = 3000,
		refetchOnFocus = true,
		refetchOnReconnect = true
	} = options;

	if (!browser) return;

	let lastRefreshTime = Date.now();

	const shouldRefetch = (): boolean => {
		const timeSinceLastRefresh = Date.now() - lastRefreshTime;
		return timeSinceLastRefresh > debounceMs;
	};

	const performRefetch = async () => {
		if (!shouldRefetch()) {
			return;
		}

		lastRefreshTime = Date.now();
		await invalidateAll();
	};

	// Handle visibility change (tab/window focus)
	const handleVisibilityChange = () => {
		if (document.visibilityState === 'visible') {
			performRefetch();
		}
	};

	// Handle network reconnect
	const handleOnline = () => {
		performRefetch();
	};

	// Set up listeners
	if (refetchOnFocus) {
		document.addEventListener('visibilitychange', handleVisibilityChange);
	}

	if (refetchOnReconnect) {
		window.addEventListener('online', handleOnline);
	}

	// Cleanup function
	return () => {
		if (refetchOnFocus) {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}
		if (refetchOnReconnect) {
			window.removeEventListener('online', handleOnline);
		}
	};
}

/**
 * Input validation utilities
 */

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
	if (!email || typeof email !== 'string') {
		return false;
	}

	// Basic email regex - RFC 5322 compliant
	const emailRegex =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate and sanitize habit name
 */
export function validateHabitName(name: string): {
	valid: boolean;
	sanitized?: string;
	error?: string;
} {
	if (!name || typeof name !== 'string') {
		return { valid: false, error: 'Habit name is required' };
	}

	const trimmed = name.trim();

	if (trimmed.length === 0) {
		return { valid: false, error: 'Habit name cannot be empty' };
	}

	if (trimmed.length > 100) {
		return { valid: false, error: 'Habit name must be 100 characters or less' };
	}

	return { valid: true, sanitized: trimmed };
}

/**
 * Validate hex color format
 */
export function isValidColor(color: string): boolean {
	if (!color || typeof color !== 'string') {
		return false;
	}

	// Must be exactly 7 characters (#RRGGBB)
	const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
	return hexColorRegex.test(color);
}

/**
 * Validate frequency value
 */
export function isValidFrequency(frequency: string): boolean {
	if (!frequency || typeof frequency !== 'string') {
		return false;
	}

	return frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly';
}

/**
 * Validate habit stamp value
 */
export function isValidStampValue(value: unknown): boolean {
	if (typeof value !== 'number') {
		return false;
	}

	// Value should be 0 (delete) or 1 (complete)
	return value === 0 || value === 1;
}

/**
 * Validate date string (ISO format YYYY-MM-DD)
 */
export function isValidDateString(date: string): boolean {
	if (!date || typeof date !== 'string') {
		return false;
	}

	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(date)) {
		return false;
	}

	// Check if it's a valid date
	const parsed = new Date(date);
	return !isNaN(parsed.getTime());
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Used for comparing secrets like verification codes
 */
export function constantTimeCompare(a: string, b: string): boolean {
	if (typeof a !== 'string' || typeof b !== 'string') {
		return false;
	}

	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return result === 0;
}

/**
 * Sanitize string input to prevent basic injection attacks
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
	if (!input || typeof input !== 'string') {
		return '';
	}

	return input.trim().substring(0, maxLength);
}

/**
 * Validate password requirements
 */
export function validatePassword(password: string): string | null {
	if (!password || typeof password !== 'string') {
		return 'Password is required';
	}

	if (password.length < 8) {
		return 'Password must be at least 8 characters';
	}

	if (password.length > 128) {
		return 'Password is too long (max 128 characters)';
	}

	return null;
}

/**
 * Validate week start preference
 */
export function isValidWeekStart(weekStart: string): boolean {
	if (!weekStart || typeof weekStart !== 'string') {
		return false;
	}

	const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	return validDays.includes(weekStart.toLowerCase());
}

/**
 * Validate time format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
	if (!time || typeof time !== 'string') {
		return false;
	}

	const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
	return timeRegex.test(time);
}

/**
 * Validate reminder service type
 */
export function isValidReminderService(service: string): boolean {
	if (!service || typeof service !== 'string') {
		return false;
	}

	return service === 'push' || service === 'ntfy';
}

/**
 * Validate and sanitize Ntfy URL
 * Accepts formats:
 * - https://ntfy.sh/topic
 * - https://user:pass@ntfy.example.com/topic
 * - http://192.168.1.100:8080/topic (for local instances)
 */
export function validateNtfyUrl(url: string): {
	valid: boolean;
	sanitized?: string;
	error?: string;
} {
	if (!url || typeof url !== 'string') {
		return { valid: false, error: 'Ntfy URL is required' };
	}

	const trimmed = url.trim();

	if (trimmed.length === 0) {
		return { valid: false, error: 'Ntfy URL cannot be empty' };
	}

	if (trimmed.length > 500) {
		return { valid: false, error: 'Ntfy URL is too long' };
	}

	// Basic URL validation
	try {
		const parsedUrl = new URL(trimmed);

		// Must be HTTP or HTTPS
		if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
			return { valid: false, error: 'Ntfy URL must use HTTP or HTTPS protocol' };
		}

		// Must have a pathname (topic)
		if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
			return { valid: false, error: 'Ntfy URL must include a topic path' };
		}

		return { valid: true, sanitized: trimmed };
	} catch {
		return { valid: false, error: 'Invalid Ntfy URL format' };
	}
}

/**
 * Validate push subscription object
 */
export function isValidPushSubscription(subscription: unknown): boolean {
	if (!subscription || typeof subscription !== 'object') {
		return false;
	}

	const sub = subscription as Record<string, unknown>;

	// Must have endpoint and keys
	if (!sub.endpoint || typeof sub.endpoint !== 'string') {
		return false;
	}

	if (!sub.keys || typeof sub.keys !== 'object') {
		return false;
	}

	const keys = sub.keys as Record<string, unknown>;

	// Must have p256dh and auth keys
	if (!keys.p256dh || typeof keys.p256dh !== 'string') {
		return false;
	}

	if (!keys.auth || typeof keys.auth !== 'string') {
		return false;
	}

	return true;
}

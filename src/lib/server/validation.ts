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

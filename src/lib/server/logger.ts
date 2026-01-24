/**
 * Logging utility for security events and general application logging
 * In production, this should write to a proper logging system
 */

type SecurityEventType =
	| 'login_success'
	| 'login_failed'
	| 'login_rate_limited'
	| 'signup_success'
	| 'signup_failed'
	| 'signup_rate_limited'
	| 'verification_failed'
	| 'verification_rate_limited'
	| 'unauthorized_access';

interface SecurityEvent {
	type: SecurityEventType;
	ip: string;
	email?: string;
	userId?: string;
	message?: string;
	timestamp: Date;
}

/**
 * Log a security event
 * In production, this should write to a proper logging system
 */
export function logSecurityEvent(event: SecurityEvent): void {
	const logEntry = {
		...event,
		timestamp: event.timestamp.toISOString()
	};

	// Console log for now - in production, replace with proper logging
	// e.g., Winston, Pino, or a logging service like Datadog, Sentry
	console.log('[SECURITY]', JSON.stringify(logEntry));

	// TODO: In production, also write to:
	// - File-based logs
	// - External logging service
	// - Security monitoring system
}

/**
 * Helper to create a security event
 */
export function createSecurityEvent(
	type: SecurityEventType,
	ip: string,
	additionalData?: Partial<SecurityEvent>
): SecurityEvent {
	return {
		type,
		ip,
		timestamp: new Date(),
		...additionalData
	};
}

/**
 * General application logger
 * In production, replace with a proper logging library like Winston or Pino
 */
export const logger = {
	info(message: string, data?: Record<string, unknown>): void {
		console.log('[INFO]', message, data ? JSON.stringify(data) : '');
	},

	warn(message: string, data?: Record<string, unknown>): void {
		console.warn('[WARN]', message, data ? JSON.stringify(data) : '');
	},

	error(message: string, data?: Record<string, unknown>): void {
		console.error('[ERROR]', message, data ? JSON.stringify(data) : '');
	},

	debug(message: string, data?: Record<string, unknown>): void {
		if (process.env.NODE_ENV === 'development') {
			console.debug('[DEBUG]', message, data ? JSON.stringify(data) : '');
		}
	}
};

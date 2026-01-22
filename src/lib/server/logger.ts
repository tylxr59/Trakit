/**
 * Security event logging utility
 * Logs important security events for monitoring and auditing
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

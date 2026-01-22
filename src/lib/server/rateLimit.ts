/**
 * Rate limiting utility to prevent brute force attacks
 * Tracks attempts by IP address or identifier
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

class RateLimiter {
	private attempts: Map<string, RateLimitEntry> = new Map();
	private maxAttempts: number;
	private windowMs: number;

	constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
		this.maxAttempts = maxAttempts;
		this.windowMs = windowMs;

		// Clean up expired entries every minute
		setInterval(() => this.cleanup(), 60 * 1000);
	}

	/**
	 * Check if the identifier has exceeded the rate limit
	 */
	isRateLimited(identifier: string): boolean {
		const now = Date.now();
		const entry = this.attempts.get(identifier);

		if (!entry) {
			return false;
		}

		if (now > entry.resetTime) {
			this.attempts.delete(identifier);
			return false;
		}

		return entry.count >= this.maxAttempts;
	}

	/**
	 * Record an attempt for the identifier
	 */
	recordAttempt(identifier: string): void {
		const now = Date.now();
		const entry = this.attempts.get(identifier);

		if (!entry || now > entry.resetTime) {
			this.attempts.set(identifier, {
				count: 1,
				resetTime: now + this.windowMs
			});
		} else {
			entry.count++;
		}
	}

	/**
	 * Reset attempts for an identifier (e.g., after successful login)
	 */
	reset(identifier: string): void {
		this.attempts.delete(identifier);
	}

	/**
	 * Get time until rate limit resets (in seconds)
	 */
	getResetTime(identifier: string): number {
		const entry = this.attempts.get(identifier);
		if (!entry) return 0;

		const now = Date.now();
		if (now > entry.resetTime) return 0;

		return Math.ceil((entry.resetTime - now) / 1000);
	}

	/**
	 * Clean up expired entries
	 */
	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.attempts.entries()) {
			if (now > entry.resetTime) {
				this.attempts.delete(key);
			}
		}
	}
}

// Rate limiters for different endpoints
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const signupRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
export const verificationRateLimiter = new RateLimiter(10, 60 * 60 * 1000); // 10 attempts per hour

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
	// Check common headers for IP address
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}

	const realIP = request.headers.get('x-real-ip');
	if (realIP) {
		return realIP;
	}

	// Fallback to a generic identifier if IP is not available
	return 'unknown';
}

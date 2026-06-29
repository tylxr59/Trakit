/**
 * SQLite-backed rate limiting for auth-sensitive endpoints.
 */

import { env } from '$env/dynamic/private';
import { pool } from './db';

class RateLimiter {
	constructor(
		private type: string,
		private maxAttempts: number = 5,
		private windowMs: number = 15 * 60 * 1000
	) {}

	async isRateLimited(identifier: string): Promise<boolean> {
		const now = Date.now();
		const result = await pool.query<{ count: number; reset_time: number }>(
			'SELECT count, reset_time FROM auth_rate_limits WHERE type = $1 AND identifier = $2',
			[this.type, identifier]
		);
		const entry = result.rows[0];

		if (!entry) {
			return false;
		}

		if (now > entry.reset_time) {
			await this.reset(identifier);
			return false;
		}

		return entry.count >= this.maxAttempts;
	}

	async recordAttempt(identifier: string): Promise<void> {
		const now = Date.now();
		const resetTime = now + this.windowMs;

		await pool.query(
			`INSERT INTO auth_rate_limits (type, identifier, count, reset_time)
			VALUES ($1, $2, 1, $3)
			ON CONFLICT (type, identifier)
			DO UPDATE SET
				count = CASE
					WHEN auth_rate_limits.reset_time <= $4 THEN 1
					ELSE auth_rate_limits.count + 1
				END,
				reset_time = CASE
					WHEN auth_rate_limits.reset_time <= $4 THEN $3
					ELSE auth_rate_limits.reset_time
				END`,
			[this.type, identifier, resetTime, now]
		);
	}

	async reset(identifier: string): Promise<void> {
		await pool.query('DELETE FROM auth_rate_limits WHERE type = $1 AND identifier = $2', [
			this.type,
			identifier
		]);
	}

	async getResetTime(identifier: string): Promise<number> {
		const result = await pool.query<{ reset_time: number }>(
			'SELECT reset_time FROM auth_rate_limits WHERE type = $1 AND identifier = $2',
			[this.type, identifier]
		);
		const entry = result.rows[0];
		if (!entry) return 0;

		const now = Date.now();
		if (now > entry.reset_time) return 0;

		return Math.ceil((entry.reset_time - now) / 1000);
	}
}

export const loginRateLimiter = new RateLimiter('login', 5, 15 * 60 * 1000);
export const signupRateLimiter = new RateLimiter('signup', 3, 60 * 60 * 1000);
export const verificationRateLimiter = new RateLimiter('verification', 10, 60 * 60 * 1000);

/**
 * Get client IP address from request.
 *
 * Proxy headers are only trusted when TRUST_PROXY=true. Without that, a client
 * can spoof X-Forwarded-For and bypass IP-based limits.
 */
export function getClientIP(request: Request): string {
	if (env.TRUST_PROXY === 'true') {
		const forwarded = request.headers.get('x-forwarded-for');
		if (forwarded) {
			return forwarded.split(',')[0].trim();
		}

		const realIP = request.headers.get('x-real-ip');
		if (realIP) {
			return realIP;
		}
	}

	return 'local';
}

import { pool } from './db';
import { dev } from '$app/environment';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { Cookies as SvelteKitCookies } from '@sveltejs/kit';

/**
 * Custom session management to replace deprecated Lucia v3
 * Based on recommendations from https://lucia-auth.com/sessions/basic-api/node
 */

type Cookies = SvelteKitCookies;

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	csrfToken: string;
}

export interface User {
	id: string;
	email: string;
	emailVerified: boolean;
	displayName: string | null;
	timezone: string | null;
}

// Session configuration
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15; // Refresh if < 15 days remaining
const SESSION_COOKIE_NAME = 'auth_session';
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

/**
 * Create a session ID by hashing the token
 */
function hashSessionToken(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

/**
 * Create a new session for a user
 * @returns Object with session token (to set in cookie) and session data
 */
export async function createSession(userId: string): Promise<{ token: string; session: Session }> {
	const token = generateSessionToken();
	const sessionId = hashSessionToken(token);
	const csrfToken = generateCSRFToken();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	await pool.query(
		'INSERT INTO sessions (id, user_id, expires_at, csrf_token) VALUES ($1, $2, $3, $4)',
		[sessionId, userId, expiresAt, csrfToken]
	);

	const session: Session = {
		id: sessionId,
		userId,
		expiresAt,
		csrfToken
	};

	return { token, session };
}

/**
 * Validate a session token and return session + user data
 * @returns Object with session, user, and fresh flag (true if session was refreshed)
 */
export async function validateSession(
	token: string
): Promise<
	{ session: Session; user: User; fresh: boolean } | { session: null; user: null; fresh: false }
> {
	const sessionId = hashSessionToken(token);

	const result = await pool.query(
		`SELECT 
			s.id, s.user_id, s.expires_at, s.csrf_token,
			u.email, u.email_verified, u.display_name, u.timezone
		FROM sessions s
		JOIN users u ON s.user_id = u.id
		WHERE s.id = $1`,
		[sessionId]
	);

	if (result.rows.length === 0) {
		return { session: null, user: null, fresh: false };
	}

	const row = result.rows[0];
	const session: Session = {
		id: row.id,
		userId: row.user_id,
		expiresAt: new Date(row.expires_at),
		csrfToken: row.csrf_token
	};

	const user: User = {
		id: row.user_id,
		email: row.email,
		emailVerified: row.email_verified,
		displayName: row.display_name,
		timezone: row.timezone
	};

	// Check if session is expired
	if (Date.now() >= session.expiresAt.getTime()) {
		await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
		return { session: null, user: null, fresh: false };
	}

	// Check if session needs refresh (less than 15 days remaining)
	const needsRefresh = Date.now() >= session.expiresAt.getTime() - SESSION_REFRESH_THRESHOLD_MS;

	if (needsRefresh) {
		const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await pool.query('UPDATE sessions SET expires_at = $1 WHERE id = $2', [
			newExpiresAt,
			sessionId
		]);
		session.expiresAt = newExpiresAt;
		return { session, user, fresh: true };
	}

	return { session, user, fresh: false };
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(sessionId: string): Promise<void> {
	await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
	await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

/**
 * Set session cookie
 */
export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

/**
 * Set CSRF token cookie (needs to be readable by JavaScript)
 */
export function setCSRFCookie(cookies: Cookies, csrfToken: string, expiresAt: Date): void {
	cookies.set(CSRF_COOKIE_NAME, csrfToken, {
		httpOnly: false, // Needs to be readable by JavaScript
		secure: !dev,
		sameSite: 'strict',
		expires: expiresAt,
		path: '/'
	});
}

/**
 * Delete session cookie
 */
export function deleteSessionCookie(cookies: Cookies): void {
	cookies.set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}

/**
 * Delete CSRF token cookie
 */
export function deleteCSRFCookie(cookies: Cookies): void {
	cookies.set(CSRF_COOKIE_NAME, '', {
		httpOnly: false,
		secure: !dev,
		sameSite: 'strict',
		maxAge: 0,
		path: '/'
	});
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(
	sessionCSRFToken: string,
	requestCSRFToken: string | null
): boolean {
	if (!requestCSRFToken) {
		return false;
	}
	// Use constant-time comparison to prevent timing attacks
	return timingSafeEqual(sessionCSRFToken, requestCSRFToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
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
 * Get session cookie name (for reading)
 */
export function getSessionCookieName(): string {
	return SESSION_COOKIE_NAME;
}

/**
 * Get CSRF cookie name (for reading)
 */
export function getCSRFCookieName(): string {
	return CSRF_COOKIE_NAME;
}

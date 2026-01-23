import { redirect, fail } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { pool } from '$lib/server/db';
import { createSession, setSessionCookie, setCSRFCookie } from '$lib/server/sessions';
import { sendVerificationEmail } from '$lib/server/email';
import { signupRateLimiter, getClientIP } from '$lib/server/rateLimit';
import { isValidEmail } from '$lib/server/validation';
import { logSecurityEvent, createSecurityEvent } from '$lib/server/logger';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}
	return {
		allowRegistration: env.ALLOW_REGISTRATION === 'true',
		emailVerificationRequired: env.EMAIL_VERIFICATION_REQUIRED === 'true'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const clientIP = getClientIP(request);

		// Check rate limit
		if (signupRateLimiter.isRateLimited(clientIP)) {
			const resetTime = signupRateLimiter.getResetTime(clientIP);
			logSecurityEvent(
				createSecurityEvent('signup_rate_limited', clientIP, {
					message: `Rate limit exceeded, resets in ${resetTime}s`
				})
			);
			return fail(429, {
				message: `Too many signup attempts. Please try again in ${Math.ceil(resetTime / 60)} minutes.`
			});
		}

		if (env.ALLOW_REGISTRATION !== 'true') {
			return fail(403, { message: 'Registration is currently disabled' });
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			signupRateLimiter.recordAttempt(clientIP);
			return fail(400, { message: 'Email and password are required' });
		}

		// Validate email format
		if (!isValidEmail(email)) {
			signupRateLimiter.recordAttempt(clientIP);
			logSecurityEvent(
				createSecurityEvent('signup_failed', clientIP, {
					email,
					message: 'Invalid email format'
				})
			);
			return fail(400, { message: 'Invalid email address format' });
		}

		if (password.length < 8) {
			signupRateLimiter.recordAttempt(clientIP);
			return fail(400, { message: 'Password must be at least 8 characters' });
		}

		if (password.length > 128) {
			signupRateLimiter.recordAttempt(clientIP);
			return fail(400, { message: 'Password is too long' });
		}

		// Check if user exists
		const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
		if (existingUser.rows.length > 0) {
			signupRateLimiter.recordAttempt(clientIP);
			logSecurityEvent(
				createSecurityEvent('signup_failed', clientIP, {
					email,
					message: 'Email already registered'
				})
			);
			return fail(400, { message: 'Email already registered' });
		}

		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		const emailVerified = env.EMAIL_VERIFICATION_REQUIRED !== 'true';

		// Insert user and get the generated UUID
		const userResult = await pool.query(
			'INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, $3) RETURNING id',
			[email, passwordHash, emailVerified]
		);

		const userId = userResult.rows[0].id;

		logSecurityEvent(
			createSecurityEvent('signup_success', clientIP, {
				email,
				userId
			})
		);

		// Reset rate limit on successful signup
		signupRateLimiter.reset(clientIP);

		if (env.EMAIL_VERIFICATION_REQUIRED === 'true') {
			// Generate 6-digit code
			const code = Math.floor(100000 + Math.random() * 900000).toString();
			const expiresAt = new Date();
			expiresAt.setMinutes(expiresAt.getMinutes() + 15);

			await pool.query(
				'INSERT INTO email_verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
				[userId, code, expiresAt]
			);

			await sendVerificationEmail(email, code);

			return {
				success: true,
				requiresVerification: true,
				userId
			};
		}

		// Auto-login if verification not required
		const { token, session } = await createSession(userId);
		setSessionCookie(cookies, token, session.expiresAt);
		setCSRFCookie(cookies, session.csrfToken, session.expiresAt);

		throw redirect(302, '/');
	}
};

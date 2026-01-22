import { redirect, fail } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { pool } from '$lib/server/db';
import { lucia } from '$lib/server/lucia';
import { loginRateLimiter, verificationRateLimiter, getClientIP } from '$lib/server/rateLimit';
import { constantTimeCompare } from '$lib/server/validation';
import { logSecurityEvent, createSecurityEvent } from '$lib/server/logger';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}
	return {
		emailVerificationRequired: env.EMAIL_VERIFICATION_REQUIRED === 'true'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const clientIP = getClientIP(request);

		// Check rate limit
		if (loginRateLimiter.isRateLimited(clientIP)) {
			const resetTime = loginRateLimiter.getResetTime(clientIP);
			logSecurityEvent(
				createSecurityEvent('login_rate_limited', clientIP, {
					message: `Rate limit exceeded, resets in ${resetTime}s`
				})
			);
			return fail(429, {
				message: `Too many login attempts. Please try again in ${Math.ceil(resetTime / 60)} minutes.`
			});
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const verificationCode = formData.get('verificationCode') as string;

		if (!email || !password) {
			loginRateLimiter.recordAttempt(clientIP);
			return fail(400, { message: 'Email and password are required' });
		}

		const userResult = await pool.query(
			'SELECT id, password_hash, email_verified FROM users WHERE email = $1',
			[email]
		);

		// Use constant error message to prevent user enumeration
		const invalidCredentialsMessage = 'Invalid email or password';

		if (userResult.rows.length === 0) {
			loginRateLimiter.recordAttempt(clientIP);
			logSecurityEvent(
				createSecurityEvent('login_failed', clientIP, {
					email,
					message: 'User not found'
				})
			);
			return fail(400, { message: invalidCredentialsMessage });
		}

		const user = userResult.rows[0];

		const validPassword = await verify(user.password_hash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			loginRateLimiter.recordAttempt(clientIP);
			logSecurityEvent(
				createSecurityEvent('login_failed', clientIP, {
					email,
					userId: user.id,
					message: 'Invalid password'
				})
			);
			return fail(400, { message: invalidCredentialsMessage });
		}

		// Check email verification if required
		if (env.EMAIL_VERIFICATION_REQUIRED === 'true' && !user.email_verified) {
			if (!verificationCode) {
				return fail(400, {
					message: 'Email verification required. Please enter your verification code.',
					requiresVerification: true
				});
			}

			// Check verification rate limit
			if (verificationRateLimiter.isRateLimited(clientIP + ':' + user.id)) {
				const resetTime = verificationRateLimiter.getResetTime(clientIP + ':' + user.id);
				logSecurityEvent(
					createSecurityEvent('verification_rate_limited', clientIP, {
						email,
						userId: user.id,
						message: `Verification rate limit exceeded`
					})
				);
				return fail(429, {
					message: `Too many verification attempts. Please try again in ${Math.ceil(resetTime / 60)} minutes.`
				});
			}

			// Verify code
			const codeResult = await pool.query(
				'SELECT code, expires_at FROM email_verification_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
				[user.id]
			);

			if (codeResult.rows.length === 0) {
				verificationRateLimiter.recordAttempt(clientIP + ':' + user.id);
				return fail(400, { message: 'No verification code found. Please sign up again.' });
			}

			const codeData = codeResult.rows[0];

			if (new Date() > new Date(codeData.expires_at)) {
				verificationRateLimiter.recordAttempt(clientIP + ':' + user.id);
				return fail(400, { message: 'Verification code expired. Please sign up again.' });
			}

			// Use constant-time comparison to prevent timing attacks
			if (!constantTimeCompare(codeData.code, verificationCode)) {
				verificationRateLimiter.recordAttempt(clientIP + ':' + user.id);
				logSecurityEvent(
					createSecurityEvent('verification_failed', clientIP, {
						email,
						userId: user.id,
						message: 'Invalid verification code'
					})
				);
				return fail(400, { message: 'Invalid verification code', requiresVerification: true });
			}

			// Mark email as verified
			await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [user.id]);
			await pool.query('DELETE FROM email_verification_codes WHERE user_id = $1', [user.id]);
			verificationRateLimiter.reset(clientIP + ':' + user.id);
		}

		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		// Reset rate limit on successful login
		loginRateLimiter.reset(clientIP);

		logSecurityEvent(
			createSecurityEvent('login_success', clientIP, {
				email,
				userId: user.id
			})
		);

		throw redirect(302, '/');
	}
};

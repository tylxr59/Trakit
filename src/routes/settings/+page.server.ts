import { redirect, fail } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { hash, verify } from '@node-rs/argon2';
import { isValidEmail, validatePassword, isValidWeekStart } from '$lib/server/validation';
import { invalidateUserSessions } from '$lib/server/sessions';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Get full user data including notification preferences
	const result = await pool.query(
		`SELECT 
			email, 
			display_name, 
			timezone, 
			week_start,
			reminder_enabled,
			reminder_service,
			reminder_time
		FROM users 
		WHERE id = $1`,
		[locals.user.id]
	);

	if (result.rows.length === 0) {
		throw redirect(302, '/login');
	}

	const user = result.rows[0];

	return {
		email: user.email,
		displayName: user.display_name || '',
		timezone: user.timezone || 'UTC',
		weekStart: user.week_start || 'sunday',
		reminderEnabled: user.reminder_enabled || false,
		reminderService: user.reminder_service || null,
		reminderTime: user.reminder_time || '17:00',
		vapidPublicKey: env.VAPID_PUBLIC_KEY || ''
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const displayName = formData.get('displayName') as string;
		const timezone = formData.get('timezone') as string;
		const weekStart = formData.get('weekStart') as string;

		if (!displayName || displayName.length < 1 || displayName.length > 100) {
			return fail(400, { message: 'Display name must be between 1 and 100 characters' });
		}

		if (!timezone) {
			return fail(400, { message: 'Timezone is required' });
		}

		if (!isValidWeekStart(weekStart)) {
			return fail(400, { message: 'Invalid week start value' });
		}

		try {
			await pool.query(
				'UPDATE users SET display_name = $1, timezone = $2, week_start = $3 WHERE id = $4',
				[displayName, timezone, weekStart, locals.user.id]
			);

			return { success: true, message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Error updating profile:', error);
			return fail(500, { message: 'Failed to update profile' });
		}
	},

	updateEmail: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const newEmail = formData.get('newEmail') as string;
		const password = formData.get('password') as string;

		if (!newEmail || !password) {
			return fail(400, { message: 'Email and password are required' });
		}

		if (!isValidEmail(newEmail)) {
			return fail(400, { message: 'Invalid email address' });
		}

		// Verify current password
		const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [
			locals.user.id
		]);

		if (userResult.rows.length === 0) {
			return fail(401, { message: 'User not found' });
		}

		const validPassword = await verify(userResult.rows[0].password_hash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			return fail(400, { message: 'Invalid password' });
		}

		// Check if email is already taken
		const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);

		if (existingUser.rows.length > 0) {
			return fail(400, { message: 'Email already in use' });
		}

		try {
			await pool.query('UPDATE users SET email = $1, email_verified = false WHERE id = $2', [
				newEmail,
				locals.user.id
			]);

			return {
				success: true,
				message: 'Email updated successfully. Please verify your new email.'
			};
		} catch (error) {
			console.error('Error updating email:', error);
			return fail(500, { message: 'Failed to update email' });
		}
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword') as string;
		const newPassword = formData.get('newPassword') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { message: 'All password fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { message: 'New passwords do not match' });
		}

		const passwordError = validatePassword(newPassword);
		if (passwordError) {
			return fail(400, { message: passwordError });
		}

		// Verify current password
		const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [
			locals.user.id
		]);

		if (userResult.rows.length === 0) {
			return fail(401, { message: 'User not found' });
		}

		const validPassword = await verify(userResult.rows[0].password_hash, currentPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			return fail(400, { message: 'Current password is incorrect' });
		}

		try {
			// Hash new password
			const passwordHash = await hash(newPassword, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
				passwordHash,
				locals.user.id
			]);

			// Invalidate all other sessions (keep current one)
			// This forces re-login on other devices
			await invalidateUserSessions(locals.user.id);

			return { success: true, message: 'Password updated successfully' };
		} catch (error) {
			console.error('Error updating password:', error);
			return fail(500, { message: 'Failed to update password' });
		}
	}
};

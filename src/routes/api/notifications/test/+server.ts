/**
 * API endpoint for testing notification delivery
 * POST /api/notifications/test
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pool } from '$lib/server/db';
import { sendWebPushNotification, sendNtfyNotification } from '$lib/server/notifications';
import { logger } from '$lib/server/logger';

export const POST: RequestHandler = async ({ locals }) => {
	// Auth check
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get user's notification preferences
		const result = await pool.query(
			`SELECT 
				reminder_service,
				push_subscription,
				ntfy_url_encrypted,
				ntfy_encryption_iv
			FROM users 
			WHERE id = $1`,
			[locals.user.id]
		);

		const user = result.rows[0];

		if (!user || !user.reminder_service) {
			throw error(400, 'No notification service configured');
		}

		// Create test message
		const testPayload = {
			title: '🎉 Test Notification',
			body: "Your Trakit reminders are working! You'll receive daily reminders at your scheduled time.",
			tag: 'test-notification'
		};

		// Send based on service
		if (user.reminder_service === 'push') {
			if (!user.push_subscription) {
				throw error(400, 'No push subscription found');
			}

			const result = await sendWebPushNotification(user.push_subscription, testPayload);

			if (!result.success) {
				if (result.error === 'subscription_expired') {
					// Clear expired subscription
					await pool.query('UPDATE users SET push_subscription = NULL WHERE id = $1', [
						locals.user.id
					]);
					throw error(
						400,
						'Push subscription expired. Please re-enable notifications in your browser.'
					);
				}
				throw error(500, result.error || 'Failed to send test notification');
			}
		} else if (user.reminder_service === 'ntfy') {
			if (!user.ntfy_url_encrypted || !user.ntfy_encryption_iv) {
				throw error(400, 'Ntfy not configured');
			}

			const result = await sendNtfyNotification(
				user.ntfy_url_encrypted,
				user.ntfy_encryption_iv,
				testPayload
			);

			if (!result.success) {
				throw error(500, result.error || 'Failed to send test notification');
			}
		}

		logger.info('Test notification sent', {
			userId: locals.user.id,
			service: user.reminder_service
		});

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}

		logger.error('Failed to send test notification', {
			error: err instanceof Error ? err.message : String(err),
			userId: locals.user.id
		});

		throw error(500, 'Failed to send test notification');
	}
};

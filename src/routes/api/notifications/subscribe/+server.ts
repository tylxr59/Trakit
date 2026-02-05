/**
 * API endpoint for subscribing to push notifications
 * POST /api/notifications/subscribe
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pool } from '$lib/server/db';
import { isValidPushSubscription } from '$lib/server/validation';
import { logger } from '$lib/server/logger';

export const POST: RequestHandler = async ({ locals, request }) => {
	// Auth check
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const { subscription } = body;

		// Validate subscription format
		if (!isValidPushSubscription(subscription)) {
			throw error(400, 'Invalid push subscription format');
		}

		// Store subscription in database
		await pool.query('UPDATE users SET push_subscription = $1 WHERE id = $2', [
			JSON.stringify(subscription),
			locals.user.id
		]);

		logger.info('Push subscription registered', { userId: locals.user.id });

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}

		logger.error('Failed to register push subscription', {
			error: err instanceof Error ? err.message : String(err),
			userId: locals.user.id
		});

		throw error(500, 'Failed to register push subscription');
	}
};

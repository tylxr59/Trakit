/**
 * API endpoint for updating notification preferences
 * PATCH /api/notifications/preferences
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pool } from '$lib/server/db';
import { isValidTimeFormat, isValidReminderService, validateNtfyUrl } from '$lib/server/validation';
import { encryptNtfyUrl } from '$lib/server/encryption';
import { logger } from '$lib/server/logger';

export const PATCH: RequestHandler = async ({ locals, request }) => {
	// Auth check
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const { reminderEnabled, reminderService, reminderTime, ntfyUrl } = body;

		// Validate enabled flag
		if (typeof reminderEnabled !== 'boolean') {
			throw error(400, 'Invalid reminderEnabled value');
		}

		// If reminders are disabled, just update that and return
		if (!reminderEnabled) {
			await pool.query('UPDATE users SET reminder_enabled = false WHERE id = $1', [locals.user.id]);

			logger.info('Reminders disabled', { userId: locals.user.id });
			return json({ success: true });
		}

		// If enabled, validate all required fields
		if (!reminderService || !isValidReminderService(reminderService)) {
			throw error(400, 'Invalid or missing reminder service');
		}

		if (!reminderTime || !isValidTimeFormat(reminderTime)) {
			throw error(400, 'Invalid or missing reminder time (must be HH:MM format)');
		}

		// If service is Ntfy, validate and encrypt URL
		let ntfyUrlEncrypted: string | null = null;
		let ntfyEncryptionIv: string | null = null;

		if (reminderService === 'ntfy') {
			if (!ntfyUrl) {
				throw error(400, 'Ntfy URL is required when using Ntfy service');
			}

			const validation = validateNtfyUrl(ntfyUrl);
			if (!validation.valid) {
				throw error(400, validation.error || 'Invalid Ntfy URL');
			}

			// Encrypt the URL (which may contain credentials)
			const encrypted = encryptNtfyUrl(validation.sanitized!);
			if (!encrypted) {
				throw error(500, 'Failed to encrypt Ntfy URL');
			}

			ntfyUrlEncrypted = encrypted.encrypted;
			ntfyEncryptionIv = encrypted.iv;
		} else if (reminderService === 'push') {
			// Verify user has a push subscription
			const result = await pool.query('SELECT push_subscription FROM users WHERE id = $1', [
				locals.user.id
			]);

			if (!result.rows[0]?.push_subscription) {
				throw error(
					400,
					'No push subscription found. Please enable notifications in your browser first.'
				);
			}
		}

		// Update preferences in database
		await pool.query(
			`UPDATE users SET 
				reminder_enabled = $1,
				reminder_service = $2,
				reminder_time = $3,
				ntfy_url_encrypted = $4,
				ntfy_encryption_iv = $5
			WHERE id = $6`,
			[
				reminderEnabled,
				reminderService,
				reminderTime,
				ntfyUrlEncrypted,
				ntfyEncryptionIv,
				locals.user.id
			]
		);

		logger.info('Notification preferences updated', {
			userId: locals.user.id,
			service: reminderService,
			time: reminderTime
		});

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}

		logger.error('Failed to update notification preferences', {
			error: err instanceof Error ? err.message : String(err),
			userId: locals.user.id
		});

		throw error(500, 'Failed to update notification preferences');
	}
};

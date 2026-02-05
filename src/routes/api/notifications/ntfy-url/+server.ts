import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { decryptNtfyUrl } from '$lib/server/encryption';
import type { RequestHandler } from './$types';

/**
 * GET - Retrieve decrypted Ntfy URL for the current user
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get encrypted URL and IV from database
		const result = await pool.query(
			'SELECT ntfy_url_encrypted, ntfy_encryption_iv FROM users WHERE id = $1',
			[locals.user.id]
		);

		if (result.rows.length === 0) {
			throw error(404, 'User not found');
		}

		const { ntfy_url_encrypted, ntfy_encryption_iv } = result.rows[0];

		if (!ntfy_url_encrypted || !ntfy_encryption_iv) {
			return json({ ntfyUrl: null });
		}

		// Decrypt the URL
		const decryptedUrl = decryptNtfyUrl(ntfy_url_encrypted, ntfy_encryption_iv);

		return json({ ntfyUrl: decryptedUrl });
	} catch (err) {
		console.error('Failed to retrieve Ntfy URL:', err);
		throw error(500, 'Failed to retrieve Ntfy URL');
	}
};

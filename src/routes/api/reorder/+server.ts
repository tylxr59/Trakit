import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { validateCSRFFromHeaders } from '$lib/server/sessions';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!validateCSRFFromHeaders(locals.session?.csrfToken, request)) {
		throw error(403, 'Invalid CSRF token');
	}

	const { habitIds } = await request.json();

	if (!Array.isArray(habitIds)) {
		throw error(400, 'Invalid request');
	}

	if (habitIds.length === 0) {
		return json({ success: true });
	}

	if (!habitIds.every((id) => typeof id === 'string')) {
		throw error(400, 'Invalid habit IDs');
	}

	// Verify all habits belong to the user
	const placeholders = habitIds.map((_, index) => `$${index + 2}`).join(', ');
	const habitsResult = await pool.query(
		`SELECT id FROM habits WHERE user_id = $1 AND id IN (${placeholders})`,
		[locals.user.id, ...habitIds]
	);

	if (habitsResult.rows.length !== habitIds.length) {
		throw error(403, 'Unauthorized');
	}

	// Update sort order for each habit
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		for (let i = 0; i < habitIds.length; i++) {
			await client.query('UPDATE habits SET sort_order = $1 WHERE id = $2', [i, habitIds[i]]);
		}

		await client.query('COMMIT');
	} catch (e) {
		await client.query('ROLLBACK');
		throw e;
	} finally {
		client.release();
	}

	return json({ success: true });
};

import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { validateHabitName, isValidColor } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { habitId, name, color } = await request.json();

	if (!habitId) {
		throw error(400, 'Habit ID is required');
	}

	// Verify habit ownership
	const habitResult = await pool.query('SELECT user_id FROM habits WHERE id = $1', [habitId]);

	if (habitResult.rows.length === 0 || habitResult.rows[0].user_id !== locals.user.id) {
		throw error(404, 'Habit not found');
	}

	// Build update query dynamically
	const updates: string[] = [];
	const values: any[] = [];
	let paramCount = 1;

	if (name !== undefined) {
		const validation = validateHabitName(name);
		if (!validation.valid) {
			throw error(400, validation.error || 'Invalid habit name');
		}
		updates.push(`name = $${paramCount++}`);
		values.push(validation.sanitized);
	}

	if (color !== undefined) {
		if (!isValidColor(color)) {
			throw error(400, 'Invalid color format. Must be hex color like #FF5733');
		}
		updates.push(`color = $${paramCount++}`);
		values.push(color);
	}

	if (updates.length === 0) {
		return json({ success: true });
	}

	values.push(habitId);
	const query = `UPDATE habits SET ${updates.join(', ')} WHERE id = $${paramCount}`;

	await pool.query(query, values);

	return json({ success: true });
};

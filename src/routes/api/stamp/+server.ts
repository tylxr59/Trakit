import { json, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { isValidStampValue, isValidDateString } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { habitId, date, value } = await request.json();

	// Validate input
	if (!habitId || !date) {
		throw error(400, 'Habit ID and date are required');
	}

	if (!isValidDateString(date)) {
		throw error(400, 'Invalid date format. Must be YYYY-MM-DD');
	}

	if (!isValidStampValue(value)) {
		throw error(400, 'Invalid stamp value. Must be 0 or 1');
	}

	// Verify habit ownership
	const habitResult = await pool.query('SELECT user_id FROM habits WHERE id = $1', [habitId]);

	if (habitResult.rows.length === 0 || habitResult.rows[0].user_id !== locals.user.id) {
		throw error(404, 'Habit not found');
	}

	// Upsert stamp
	if (value === 0) {
		// Delete stamp
		await pool.query('DELETE FROM habit_stamps WHERE habit_id = $1 AND day = $2', [habitId, date]);
	} else {
		// Insert or update stamp
		await pool.query(
			`INSERT INTO habit_stamps (habit_id, day, value) 
       VALUES ($1, $2, $3)
       ON CONFLICT (habit_id, day) 
       DO UPDATE SET value = $3`,
			[habitId, date, value]
		);
	}

	return json({ success: true });
};

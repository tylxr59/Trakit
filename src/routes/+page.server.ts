import { redirect } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { validateHabitName, isValidColor, isValidFrequency } from '$lib/server/validation';
import { calculateStreak, aggregateHabitData } from '$lib/server/habitUtils';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const userTimezone = locals.user.timezone || 'UTC';

	// Load user's habits
	const habitsResult = await pool.query(
		'SELECT id, name, color, frequency, created_at, sort_order FROM habits WHERE user_id = $1 ORDER BY sort_order ASC',
		[locals.user.id]
	);

	// Load stamps for the last 365 days
	const oneYearAgo = new Date();
	oneYearAgo.setDate(oneYearAgo.getDate() - 364);
	const stampsResult = await pool.query(
		`SELECT hs.habit_id, hs.day::text as day, hs.value 
     FROM habit_stamps hs
     JOIN habits h ON h.id = hs.habit_id
     WHERE h.user_id = $1 AND hs.day >= $2
     ORDER BY hs.day DESC`,
		[locals.user.id, oneYearAgo.toISOString().split('T')[0]]
	);

	// Group stamps by habit
	const stampsByHabit: Record<string, Array<{ date: string; value: number }>> = {};
	for (const stamp of stampsResult.rows) {
		if (!stampsByHabit[stamp.habit_id]) {
			stampsByHabit[stamp.habit_id] = [];
		}
		stampsByHabit[stamp.habit_id].push({
			date: stamp.day,
			value: stamp.value
		});
	}

	const habits = habitsResult.rows.map((h) => ({
		id: h.id,
		name: h.name,
		color: h.color,
		frequency: h.frequency || 'daily',
		createdAt: h.created_at,
		stamps: stampsByHabit[h.id] || [],
		currentStreak: calculateStreak(
			stampsByHabit[h.id] || [],
			h.frequency || 'daily',
			userTimezone,
			locals.user?.week_start || 'sunday'
		)
	}));

	// Calculate aggregated calendar data
	const aggregatedData = aggregateHabitData(habits);

	return {
		habits,
		aggregatedData,
		userTimezone,
		weekStart: locals.user?.week_start || 'sunday'
	};
};

export const actions: Actions = {
	createHabit: async ({ locals, request }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const color = (data.get('color') as string) || '#4caf50';
		const frequency = (data.get('frequency') as string) || 'daily';

		const nameValidation = validateHabitName(name);
		if (!nameValidation.valid) {
			return { error: nameValidation.error };
		}

		if (!isValidColor(color)) {
			return { error: 'Invalid color format' };
		}

		if (!isValidFrequency(frequency)) {
			return { error: 'Invalid frequency' };
		}

		await pool.query(
			'INSERT INTO habits (user_id, name, color, frequency) VALUES ($1, $2, $3, $4)',
			[locals.user.id, nameValidation.sanitized, color, frequency]
		);

		return { success: true };
	},

	deleteHabit: async ({ locals, request }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const habitId = data.get('habitId') as string;

		// Verify ownership
		const result = await pool.query('SELECT user_id FROM habits WHERE id = $1', [habitId]);
		if (result.rows.length === 0 || result.rows[0].user_id !== locals.user.id) {
			return { error: 'Habit not found' };
		}

		await pool.query('DELETE FROM habits WHERE id = $1', [habitId]);

		return { success: true };
	}
};

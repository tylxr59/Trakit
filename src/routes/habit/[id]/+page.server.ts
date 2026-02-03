import { redirect, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { calculateStreak } from '$lib/server/habitUtils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const habitId = params.id;

	// Load habit details
	const habitResult = await pool.query(
		'SELECT id, name, color, frequency, created_at FROM habits WHERE id = $1 AND user_id = $2',
		[habitId, locals.user.id]
	);

	if (habitResult.rows.length === 0) {
		throw error(404, 'Habit not found');
	}

	const habit = habitResult.rows[0];

	// Load all stamps for this habit
	const stampsResult = await pool.query(
		'SELECT day, value FROM habit_stamps WHERE habit_id = $1 ORDER BY day DESC',
		[habitId]
	);

	const stamps = stampsResult.rows.map((s) => ({
		date: s.day instanceof Date ? s.day.toISOString().split('T')[0] : s.day,
		value: s.value
	}));

	const userTimezone = locals.user.timezone || 'UTC';
	const currentStreak = calculateStreak(
		stamps,
		habit.frequency || 'daily',
		userTimezone,
		locals.user.week_start
	);

	return {
		habit: {
			id: habit.id,
			name: habit.name,
			color: habit.color,
			frequency: habit.frequency || 'daily',
			createdAt: habit.created_at
		},
		stamps,
		currentStreak,
		userTimezone,
		weekStart: locals.user.week_start
	};
};

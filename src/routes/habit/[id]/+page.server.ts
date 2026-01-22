import { redirect, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import type { PageServerLoad } from './$types';

// Calculate current streak for a habit
function calculateStreak(stamps: Array<{ date: string; value: number }>): number {
	if (stamps.length === 0) return 0;

	// Sort stamps by date descending
	const sortedStamps = [...stamps].sort((a, b) => b.date.localeCompare(a.date));

	const today = new Date().toISOString().split('T')[0];
	let streak = 0;
	let currentDate = new Date();

	// Check if today or yesterday has a stamp (to allow for flexibility)
	const todayStamp = sortedStamps.find((s) => s.date === today);
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = yesterday.toISOString().split('T')[0];
	const yesterdayStamp = sortedStamps.find((s) => s.date === yesterdayStr);

	const hasTodayCompletion = todayStamp && todayStamp.value > 0;
	const hasYesterdayCompletion = yesterdayStamp && yesterdayStamp.value > 0;

	if (!hasTodayCompletion && !hasYesterdayCompletion) {
		return 0;
	}

	// Start from today or yesterday
	if (hasTodayCompletion) {
		streak = 1;
		currentDate.setDate(currentDate.getDate() - 1);
	} else if (hasYesterdayCompletion) {
		streak = 1;
		currentDate = yesterday;
		currentDate.setDate(currentDate.getDate() - 1);
	}

	// Count consecutive days backwards
	for (let i = 0; i < 365; i++) {
		const dateStr = currentDate.toISOString().split('T')[0];
		const stamp = sortedStamps.find((s) => s.date === dateStr);

		if (stamp && stamp.value > 0) {
			streak++;
			currentDate.setDate(currentDate.getDate() - 1);
		} else {
			break;
		}
	}

	return streak;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const habitId = params.id;

	// Load habit details
	const habitResult = await pool.query(
		'SELECT id, name, color, created_at FROM habits WHERE id = $1 AND user_id = $2',
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

	const currentStreak = calculateStreak(stamps);

	return {
		habit: {
			id: habit.id,
			name: habit.name,
			color: habit.color,
			createdAt: habit.created_at
		},
		stamps,
		currentStreak
	};
};

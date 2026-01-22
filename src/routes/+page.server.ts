import { redirect } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import { validateHabitName, isValidColor } from '$lib/server/validation';
import type { PageServerLoad, Actions } from './$types';

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

// Calculate aggregated data for all habits per day
function aggregateHabitData(
	habits: Array<{ id: string; stamps: Array<{ date: string; value: number }> }>
): Array<{ date: string; value: number }> {
	const dateMap = new Map<string, { completed: number; total: number }>();

	// Generate all dates for the last 365 days
	const today = new Date();
	for (let i = 0; i < 365; i++) {
		const date = new Date(today);
		date.setDate(date.getDate() - (364 - i));
		const dateStr = date.toISOString().split('T')[0];
		dateMap.set(dateStr, { completed: 0, total: habits.length });
	}

	// Count completed habits per day
	for (const habit of habits) {
		for (const stamp of habit.stamps) {
			const existing = dateMap.get(stamp.date);
			if (existing && stamp.value > 0) {
				existing.completed++;
			}
		}
	}

	// Convert to percentage values (0-100)
	return Array.from(dateMap.entries()).map(([date, { completed, total }]) => ({
		date,
		value: total > 0 ? (completed / total) * 100 : 0
	}));
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Load user's habits
	const habitsResult = await pool.query(
		'SELECT id, name, color, created_at, sort_order FROM habits WHERE user_id = $1 ORDER BY sort_order ASC',
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
		createdAt: h.created_at,
		stamps: stampsByHabit[h.id] || [],
		currentStreak: calculateStreak(stampsByHabit[h.id] || [])
	}));

	// Calculate aggregated calendar data
	const aggregatedData = aggregateHabitData(habits);

	return {
		habits,
		aggregatedData
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

		const nameValidation = validateHabitName(name);
		if (!nameValidation.valid) {
			return { error: nameValidation.error };
		}

		if (!isValidColor(color)) {
			return { error: 'Invalid color format' };
		}

		await pool.query('INSERT INTO habits (user_id, name, color) VALUES ($1, $2, $3)', [
			locals.user.id,
			nameValidation.sanitized,
			color
		]);

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

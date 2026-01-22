import { redirect, error } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import type { PageServerLoad } from './$types';

// Calculate current streak for a habit
function calculateStreak(
	stamps: Array<{ date: string; value: number }>,
	frequency: string = 'daily'
): number {
	if (stamps.length === 0) return 0;

	// Sort stamps by date descending
	const sortedStamps = [...stamps].sort((a, b) => b.date.localeCompare(a.date));

	const today = new Date().toISOString().split('T')[0];

	if (frequency === 'daily') {
		// Daily frequency: count consecutive days
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
	} else if (frequency === 'weekly') {
		// Weekly frequency: count consecutive weeks with at least one completion
		const getWeekKey = (dateStr: string) => {
			const date = new Date(dateStr);
			const startOfYear = new Date(date.getFullYear(), 0, 1);
			const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
			const week = Math.floor(days / 7);
			return `${date.getFullYear()}-W${week}`;
		};

		// Group stamps by week
		const weekMap = new Map<string, boolean>();
		for (const stamp of sortedStamps) {
			if (stamp.value > 0) {
				weekMap.set(getWeekKey(stamp.date), true);
			}
		}

		const currentWeek = getWeekKey(today);
		const lastWeek = getWeekKey(
			new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
		);

		// Must have completion in current or last week to start streak
		if (!weekMap.has(currentWeek) && !weekMap.has(lastWeek)) {
			return 0;
		}

		let streak = 0;
		let checkDate = new Date();

		// Count backwards by weeks
		for (let i = 0; i < 104; i++) {
			// Check up to 2 years of weeks
			const weekKey = getWeekKey(checkDate.toISOString().split('T')[0]);
			if (weekMap.has(weekKey)) {
				streak++;
				checkDate.setDate(checkDate.getDate() - 7);
			} else {
				break;
			}
		}

		return streak;
	} else if (frequency === 'monthly') {
		// Monthly frequency: count consecutive months with at least one completion
		const getMonthKey = (dateStr: string) => {
			const date = new Date(dateStr);
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		};

		// Group stamps by month
		const monthMap = new Map<string, boolean>();
		for (const stamp of sortedStamps) {
			if (stamp.value > 0) {
				monthMap.set(getMonthKey(stamp.date), true);
			}
		}

		const currentMonth = getMonthKey(today);
		const lastMonth = (() => {
			const date = new Date();
			date.setMonth(date.getMonth() - 1);
			return getMonthKey(date.toISOString().split('T')[0]);
		})();

		// Must have completion in current or last month to start streak
		if (!monthMap.has(currentMonth) && !monthMap.has(lastMonth)) {
			return 0;
		}

		let streak = 0;
		let checkDate = new Date();

		// Count backwards by months
		for (let i = 0; i < 24; i++) {
			// Check up to 2 years of months
			const monthKey = getMonthKey(checkDate.toISOString().split('T')[0]);
			if (monthMap.has(monthKey)) {
				streak++;
				checkDate.setMonth(checkDate.getMonth() - 1);
			} else {
				break;
			}
		}

		return streak;
	}

	return 0;
}

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

	const currentStreak = calculateStreak(stamps, habit.frequency || 'daily');

	return {
		habit: {
			id: habit.id,
			name: habit.name,
			color: habit.color,
			frequency: habit.frequency || 'daily',
			createdAt: habit.created_at
		},
		stamps,
		currentStreak
	};
};

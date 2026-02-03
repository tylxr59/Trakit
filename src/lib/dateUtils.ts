/**
 * Shared date utility functions for habit tracking
 * These functions can be used on both client and server
 */

/**
 * Get the week key for a given date string, respecting timezone and week start preference
 * @param dateStr ISO date string (YYYY-MM-DD)
 * @param _timezone User's timezone (IANA timezone string) - reserved for future use
 * @param weekStart Week start preference: 'sunday' or 'monday'
 * @returns Week key in format: YYYY-MM-DD (date of the week's start day)
 */
export function getWeekKey(
	dateStr: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_timezone: string = 'UTC',
	weekStart:
		| 'sunday'
		| 'monday'
		| 'tuesday'
		| 'wednesday'
		| 'thursday'
		| 'friday'
		| 'saturday' = 'sunday'
): string {
	// Create date in user's timezone
	const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid DST issues

	// Get the day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
	const dayOfWeek = date.getDay();

	// Map week start day names to their day numbers
	const dayMap: Record<string, number> = {
		sunday: 0,
		monday: 1,
		tuesday: 2,
		wednesday: 3,
		thursday: 4,
		friday: 5,
		saturday: 6
	};

	const weekStartDay = dayMap[weekStart];

	// Calculate offset to the start of the week
	let offset = (dayOfWeek - weekStartDay + 7) % 7;

	// Get the start of the week
	const weekStartDate = new Date(date);
	weekStartDate.setDate(date.getDate() - offset);

	// Return ISO date string of week start
	return weekStartDate.toISOString().split('T')[0];
}

/**
 * Get the month key for a given date string, respecting timezone
 * @param dateStr ISO date string (YYYY-MM-DD)
 * @param _timezone User's timezone (IANA timezone string) - reserved for future use
 * @returns Month key in format: YYYY-MM
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMonthKey(dateStr: string, _timezone: string = 'UTC'): string {
	const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid DST issues
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

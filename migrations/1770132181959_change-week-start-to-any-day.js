/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
	// Drop the old constraint
	pgm.dropConstraint('users', 'users_week_start_check');

	// Add new constraint allowing any day of the week
	pgm.addConstraint('users', 'users_week_start_check', {
		check:
			"week_start IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')"
	});
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
	// Drop the new constraint
	pgm.dropConstraint('users', 'users_week_start_check');

	// Restore the old constraint (only sunday/monday)
	pgm.addConstraint('users', 'users_week_start_check', {
		check: "week_start IN ('sunday', 'monday')"
	});
};

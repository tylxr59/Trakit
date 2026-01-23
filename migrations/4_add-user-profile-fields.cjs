/**
 * Add display_name and timezone columns to users table
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
	pgm.addColumns('users', {
		display_name: {
			type: 'varchar(100)',
			notNull: false // Allow null initially
		},
		timezone: {
			type: 'varchar(100)',
			notNull: false,
			default: 'UTC'
		}
	});

	// Set default display name from email (part before @) for existing users
	pgm.sql(`
		UPDATE users 
		SET display_name = SPLIT_PART(email, '@', 1)
		WHERE display_name IS NULL
	`);

	// Set default timezone to UTC for existing users
	pgm.sql(`
		UPDATE users 
		SET timezone = 'UTC'
		WHERE timezone IS NULL
	`);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
	pgm.dropColumns('users', ['display_name', 'timezone']);
};

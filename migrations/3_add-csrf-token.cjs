/**
 * Add CSRF token column to sessions table for CSRF protection
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
	pgm.addColumns('sessions', {
		csrf_token: {
			type: 'varchar(255)',
			notNull: false // Allow null for existing sessions during migration
		}
	});

	// Generate CSRF tokens for existing sessions
	pgm.sql(`
		UPDATE sessions 
		SET csrf_token = md5(random()::text || clock_timestamp()::text)
		WHERE csrf_token IS NULL
	`);

	// Make csrf_token not null after backfill
	pgm.alterColumn('sessions', 'csrf_token', {
		notNull: true
	});
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
	pgm.dropColumns('sessions', ['csrf_token']);
};

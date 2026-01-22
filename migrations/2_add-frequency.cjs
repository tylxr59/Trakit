/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
	pgm.addColumns('habits', {
		frequency: {
			type: 'varchar(20)',
			notNull: true,
			default: 'daily'
		}
	});
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
	pgm.dropColumns('habits', ['frequency']);
};

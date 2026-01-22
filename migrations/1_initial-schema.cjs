/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
	// Users table
	pgm.createTable('users', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()')
		},
		email: {
			type: 'varchar(255)',
			notNull: true,
			unique: true
		},
		email_verified: {
			type: 'boolean',
			notNull: true,
			default: false
		},
		password_hash: {
			type: 'text',
			notNull: true
		},
		created_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp')
		}
	});

	// Email verification codes table
	pgm.createTable('email_verification_codes', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()')
		},
		user_id: {
			type: 'uuid',
			notNull: true,
			references: 'users',
			onDelete: 'CASCADE'
		},
		code: {
			type: 'varchar(6)',
			notNull: true
		},
		expires_at: {
			type: 'timestamp',
			notNull: true
		},
		created_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp')
		}
	});

	// Lucia sessions table
	pgm.createTable('sessions', {
		id: {
			type: 'text',
			primaryKey: true
		},
		user_id: {
			type: 'uuid',
			notNull: true,
			references: 'users',
			onDelete: 'CASCADE'
		},
		expires_at: {
			type: 'timestamp',
			notNull: true
		}
	});

	// Habits table
	pgm.createTable('habits', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()')
		},
		user_id: {
			type: 'uuid',
			notNull: true,
			references: 'users',
			onDelete: 'CASCADE'
		},
		name: {
			type: 'varchar(255)',
			notNull: true
		},
		color: {
			type: 'varchar(7)',
			notNull: true,
			default: "'#4caf50'"
		},
		sort_order: {
			type: 'integer',
			notNull: true,
			default: 0
		},
		created_at: {
			type: 'timestamp',
			notNull: true,
			default: pgm.func('current_timestamp')
		}
	});

	// Habit stamps table
	pgm.createTable('habit_stamps', {
		id: {
			type: 'uuid',
			primaryKey: true,
			default: pgm.func('gen_random_uuid()')
		},
		habit_id: {
			type: 'uuid',
			notNull: true,
			references: 'habits',
			onDelete: 'CASCADE'
		},
		day: {
			type: 'date',
			notNull: true
		},
		value: {
			type: 'smallint',
			notNull: true,
			default: 1
		}
	});

	// Indexes
	pgm.createIndex('users', 'email');
	pgm.createIndex('email_verification_codes', 'user_id');
	pgm.createIndex('sessions', 'user_id');
	pgm.createIndex('habits', 'user_id');
	pgm.createIndex('habits', ['user_id', 'sort_order']);
	pgm.createIndex('habit_stamps', 'habit_id');
	pgm.createIndex('habit_stamps', ['habit_id', 'day'], { unique: true });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
	pgm.dropTable('habit_stamps');
	pgm.dropTable('habits');
	pgm.dropTable('sessions');
	pgm.dropTable('email_verification_codes');
	pgm.dropTable('users');
};

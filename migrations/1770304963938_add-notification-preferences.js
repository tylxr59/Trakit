/**
 * Migration: Add notification preferences to users table
 *
 * Adds columns for:
 * - reminder_enabled: Boolean to enable/disable reminders
 * - reminder_service: Service type ('push' or 'ntfy')
 * - reminder_time: Time of day for reminder (HH:MM format in user's timezone)
 * - ntfy_url_encrypted: Encrypted Ntfy URL (includes auth credentials)
 * - ntfy_encryption_iv: Initialization vector for AES-256-GCM encryption
 * - push_subscription: JSON blob containing web push subscription details
 */

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
	// Add reminder enabled flag (default false)
	pgm.addColumn('users', {
		reminder_enabled: {
			type: 'boolean',
			notNull: true,
			default: false
		}
	});

	// Add reminder service type
	pgm.addColumn('users', {
		reminder_service: {
			type: 'varchar(20)',
			notNull: false,
			default: null
		}
	});

	// Add constraint to ensure valid service types
	pgm.addConstraint('users', 'valid_reminder_service', {
		check: "reminder_service IS NULL OR reminder_service IN ('push', 'ntfy')"
	});

	// Add reminder time (stored as HH:MM string, interpreted in user's timezone)
	pgm.addColumn('users', {
		reminder_time: {
			type: 'varchar(5)',
			notNull: false,
			default: null
		}
	});

	// Add encrypted Ntfy URL storage
	pgm.addColumn('users', {
		ntfy_url_encrypted: {
			type: 'text',
			notNull: false,
			default: null
		}
	});

	// Add encryption IV for Ntfy URL
	pgm.addColumn('users', {
		ntfy_encryption_iv: {
			type: 'varchar(32)',
			notNull: false,
			default: null
		}
	});

	// Add push subscription data (JSON)
	pgm.addColumn('users', {
		push_subscription: {
			type: 'jsonb',
			notNull: false,
			default: null
		}
	});

	// Add index for efficient reminder scheduling queries
	pgm.createIndex('users', ['reminder_enabled', 'reminder_time'], {
		name: 'idx_users_reminders',
		where: 'reminder_enabled = true'
	});
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
	pgm.dropIndex('users', ['reminder_enabled', 'reminder_time'], {
		name: 'idx_users_reminders'
	});
	pgm.dropColumn('users', 'push_subscription');
	pgm.dropColumn('users', 'ntfy_encryption_iv');
	pgm.dropColumn('users', 'ntfy_url_encrypted');
	pgm.dropColumn('users', 'reminder_time');
	pgm.dropConstraint('users', 'valid_reminder_service');
	pgm.dropColumn('users', 'reminder_service');
	pgm.dropColumn('users', 'reminder_enabled');
};

CREATE TABLE users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
	password_hash TEXT NOT NULL,
	display_name TEXT,
	timezone TEXT DEFAULT 'UTC',
	week_start TEXT NOT NULL DEFAULT 'sunday' CHECK (
		week_start IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')
	),
	reminder_enabled INTEGER NOT NULL DEFAULT 0 CHECK (reminder_enabled IN (0, 1)),
	reminder_service TEXT CHECK (reminder_service IS NULL OR reminder_service IN ('push', 'ntfy')),
	reminder_time TEXT,
	ntfy_url_encrypted TEXT,
	ntfy_encryption_iv TEXT,
	push_subscription TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE email_verification_codes (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	code TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL,
	csrf_token TEXT NOT NULL
);

CREATE TABLE habits (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	color TEXT NOT NULL DEFAULT '#4caf50',
	sort_order INTEGER NOT NULL DEFAULT 0,
	frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE habit_stamps (
	id TEXT PRIMARY KEY,
	habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
	day TEXT NOT NULL,
	value INTEGER NOT NULL DEFAULT 1 CHECK (value IN (0, 1)),
	UNIQUE (habit_id, day)
);

CREATE TABLE reminder_deliveries (
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	reminder_date TEXT NOT NULL,
	reminder_time TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY (user_id, reminder_date, reminder_time)
);

CREATE TABLE auth_rate_limits (
	type TEXT NOT NULL,
	identifier TEXT NOT NULL,
	count INTEGER NOT NULL,
	reset_time INTEGER NOT NULL,
	PRIMARY KEY (type, identifier)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_email_verification_codes_user_id ON email_verification_codes(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_user_id_sort_order ON habits(user_id, sort_order);
CREATE INDEX idx_habit_stamps_habit_id ON habit_stamps(habit_id);
CREATE INDEX idx_habit_stamps_habit_id_day ON habit_stamps(habit_id, day);
CREATE INDEX idx_users_reminders ON users(reminder_enabled, reminder_time)
WHERE reminder_enabled = 1;
CREATE INDEX idx_auth_rate_limits_reset_time ON auth_rate_limits(reset_time);

import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import fs from 'node:fs';
import path from 'node:path';

type SqlParam =
	string | number | bigint | boolean | Date | null | undefined | Record<string, unknown>;

type UntypedRow = Record<string, never>;

export interface QueryResult<T = UntypedRow> {
	rows: T[];
	rowCount: number;
}

function getDatabasePath(): string {
	const configuredPath = env.SQLITE_DB_PATH || env.DATABASE_URL || './data/trakit.db';

	if (configuredPath.startsWith('file:')) {
		return configuredPath.slice('file:'.length);
	}

	return configuredPath;
}

const databasePath = getDatabasePath();
const databaseDir = path.dirname(databasePath);

if (databaseDir && databaseDir !== '.') {
	fs.mkdirSync(databaseDir, { recursive: true });
}

const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function normalizeValue(value: SqlParam): string | number | bigint | null {
	if (value === undefined || value === null) {
		return null;
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === 'boolean') {
		return value ? 1 : 0;
	}

	if (typeof value === 'object') {
		return JSON.stringify(value);
	}

	return value;
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
	const normalized = { ...row };

	for (const key of ['email_verified', 'reminder_enabled']) {
		if (key in normalized) {
			normalized[key] = Boolean(normalized[key]);
		}
	}

	if (typeof normalized.push_subscription === 'string') {
		try {
			normalized.push_subscription = JSON.parse(normalized.push_subscription);
		} catch {
			normalized.push_subscription = null;
		}
	}

	return normalized;
}

function prepareSql(sql: string, values: SqlParam[] = []): { sql: string; values: unknown[] } {
	const normalizedValues: unknown[] = [];
	const normalizedSql = sql.replace(/\$(\d+)/g, (_match, index: string) => {
		normalizedValues.push(normalizeValue(values[Number(index) - 1]));
		return '?';
	});

	return {
		sql: normalizedSql,
		values: normalizedValues
	};
}

function returnsRows(sql: string): boolean {
	const trimmed = sql.trim().toLowerCase();
	return (
		trimmed.startsWith('select') ||
		trimmed.startsWith('pragma') ||
		trimmed.startsWith('with') ||
		/\breturning\b/i.test(sql)
	);
}

class SQLitePoolClient {
	query<T = UntypedRow>(sql: string, values: SqlParam[] = []): Promise<QueryResult<T>> {
		return pool.query<T>(sql, values);
	}

	release(): void {
		// better-sqlite3 uses one local connection for this process.
	}
}

export const pool = {
	async query<T = UntypedRow>(sql: string, values: SqlParam[] = []): Promise<QueryResult<T>> {
		const prepared = prepareSql(sql, values);
		const statement = db.prepare(prepared.sql);

		if (returnsRows(prepared.sql)) {
			const rows = statement
				.all(...prepared.values)
				.map((row) => normalizeRow(row as Record<string, unknown>));
			return { rows: rows as T[], rowCount: rows.length };
		}

		const result = statement.run(...prepared.values);
		return { rows: [], rowCount: result.changes };
	},

	async connect(): Promise<SQLitePoolClient> {
		return new SQLitePoolClient();
	}
};

export interface User {
	id: string;
	email: string;
	email_verified: boolean;
	password_hash: string;
	display_name: string | null;
	timezone: string | null;
	week_start: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
	reminder_enabled: boolean;
	reminder_service: 'push' | 'ntfy' | null;
	reminder_time: string | null;
	ntfy_url_encrypted: string | null;
	ntfy_encryption_iv: string | null;
	push_subscription: Record<string, unknown> | null;
	created_at: Date;
}

export interface Habit {
	id: string;
	user_id: string;
	name: string;
	color: string;
	frequency: 'daily' | 'weekly' | 'monthly';
	created_at: Date;
}

export interface HabitStamp {
	id: string;
	habit_id: string;
	day: string;
	value: number;
}

export interface EmailVerificationCode {
	id: string;
	user_id: string;
	code: string;
	expires_at: Date;
	created_at: Date;
}

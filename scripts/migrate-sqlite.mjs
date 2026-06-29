#!/usr/bin/env node

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const migrationsDir = path.join(rootDir, 'migrations', 'sqlite');

function loadEnvFile() {
	const envPath = path.join(rootDir, '.env');
	if (!fs.existsSync(envPath)) {
		return;
	}

	const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, separatorIndex).trim();
		let value = trimmed.slice(separatorIndex + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		process.env[key] ??= value;
	}
}

function getDatabasePath() {
	const configuredPath =
		process.env.SQLITE_DB_PATH || process.env.DATABASE_URL || path.join('data', 'trakit.db');

	if (configuredPath.startsWith('file:')) {
		return configuredPath.slice('file:'.length);
	}

	return configuredPath;
}

function getDatabase() {
	const databasePath = getDatabasePath();
	const databaseDir = path.dirname(databasePath);

	if (databaseDir && databaseDir !== '.') {
		fs.mkdirSync(databaseDir, { recursive: true });
	}

	const db = new Database(databasePath);
	db.pragma('foreign_keys = ON');
	db.pragma('journal_mode = WAL');
	db.exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL DEFAULT (datetime('now'))
		)
	`);

	return db;
}

function listMigrations() {
	if (!fs.existsSync(migrationsDir)) {
		return [];
	}

	return fs
		.readdirSync(migrationsDir)
		.filter((file) => file.endsWith('.sql'))
		.sort();
}

function migrateUp() {
	loadEnvFile();

	const db = getDatabase();
	const applied = new Set(
		db
			.prepare('SELECT name FROM schema_migrations')
			.all()
			.map((row) => row.name)
	);
	const pending = listMigrations().filter((file) => !applied.has(file));

	if (pending.length === 0) {
		console.log('No pending migrations.');
		db.close();
		return;
	}

	const applyMigration = db.transaction((file) => {
		const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
		db.exec(sql);
		db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
	});

	for (const file of pending) {
		console.log(`Applying ${file}`);
		applyMigration(file);
	}

	console.log(`Applied ${pending.length} migration(s).`);
	db.close();
}

function createMigration(name) {
	if (!name) {
		console.error('Usage: npm run migrate:create -- migration-name');
		process.exit(1);
	}

	fs.mkdirSync(migrationsDir, { recursive: true });
	const slug = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	const file = `${Date.now()}_${slug}.sql`;
	const filePath = path.join(migrationsDir, file);

	fs.writeFileSync(filePath, '-- Write SQLite migration SQL here.\n');
	console.log(filePath);
}

const [command = 'up', name] = process.argv.slice(2);

if (command === 'up') {
	migrateUp();
} else if (command === 'create') {
	createMigration(name);
} else if (command === 'down') {
	console.error('SQLite down migrations are not implemented for this project.');
	process.exit(1);
} else {
	console.error(`Unknown migration command: ${command}`);
	process.exit(1);
}

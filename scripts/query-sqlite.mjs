#!/usr/bin/env node

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function loadEnvFile() {
	const envPath = path.join(process.cwd(), '.env');
	if (!fs.existsSync(envPath)) {
		return;
	}

	for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}

		process.env[trimmed.slice(0, separatorIndex).trim()] ??= trimmed
			.slice(separatorIndex + 1)
			.trim();
	}
}

function getDatabasePath() {
	const configuredPath =
		process.env.SQLITE_DB_PATH || process.env.DATABASE_URL || path.join('data', 'trakit.db');

	return configuredPath.startsWith('file:') ? configuredPath.slice('file:'.length) : configuredPath;
}

function printTable(rows) {
	if (rows.length === 0) {
		console.log('(no rows)');
		return;
	}

	const columns = Object.keys(rows[0]);
	const widths = columns.map((column) =>
		Math.max(column.length, ...rows.map((row) => String(row[column] ?? '').length))
	);
	const formatRow = (values) =>
		values.map((value, index) => String(value ?? '').padEnd(widths[index])).join('  ');

	console.log(formatRow(columns));
	console.log(formatRow(widths.map((width) => '-'.repeat(width))));
	for (const row of rows) {
		console.log(formatRow(columns.map((column) => row[column])));
	}
}

loadEnvFile();

const [mode, ...sqlParts] = process.argv.slice(2);
const sql = sqlParts.join(' ');

if (!mode || !sql) {
	console.error('Usage: node scripts/query-sqlite.mjs --value|--table "SQL"');
	process.exit(1);
}

const db = new Database(getDatabasePath(), { readonly: /^\s*select/i.test(sql) });
db.pragma('foreign_keys = ON');

try {
	const statement = db.prepare(sql);

	if (/^\s*select/i.test(sql)) {
		const rows = statement.all();
		if (mode === '--table') {
			printTable(rows);
		} else {
			for (const row of rows) {
				console.log(Object.values(row).join('|'));
			}
		}
	} else {
		const result = statement.run();
		if (mode === '--table') {
			console.log(`changes: ${result.changes}`);
		}
	}
} finally {
	db.close();
}

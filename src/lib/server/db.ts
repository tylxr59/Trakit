import pg from 'pg';
import { env } from '$env/dynamic/private';

const { Pool } = pg;

export const pool = new Pool({
	connectionString: env.DATABASE_URL
});

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
	reminder_time: string | null; // HH:MM format
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
	day: string; // ISO date string
	value: number;
}

export interface EmailVerificationCode {
	id: string;
	user_id: string;
	code: string;
	expires_at: Date;
	created_at: Date;
}

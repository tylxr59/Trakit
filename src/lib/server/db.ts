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

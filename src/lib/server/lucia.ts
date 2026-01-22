import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import { dev } from '$app/environment';
import { pool } from './db';

const adapter = new NodePostgresAdapter(pool, {
	user: 'users',
	session: 'sessions'
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			email: attributes.email,
			emailVerified: attributes.email_verified
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			email: string;
			email_verified: boolean;
		};
	}
}

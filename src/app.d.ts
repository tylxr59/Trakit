// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				email: string;
				emailVerified: boolean;
				displayName: string | null;
				timezone: string | null;
			} | null;
			session: {
				id: string;
				userId: string;
				expiresAt: Date;
				csrfToken: string;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

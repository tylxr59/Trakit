import {
	validateSession,
	setSessionCookie,
	deleteSessionCookie,
	deleteCSRFCookie,
	getSessionCookieName,
	setCSRFCookie
} from '$lib/server/sessions';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(getSessionCookieName());
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user, fresh } = await validateSession(sessionToken);

	if (session && fresh) {
		// Session was refreshed, update cookies
		setSessionCookie(event.cookies, sessionToken, session.expiresAt);
		setCSRFCookie(event.cookies, session.csrfToken, session.expiresAt);
	}

	if (!session) {
		// Invalid or expired session, clear cookies
		deleteSessionCookie(event.cookies);
		deleteCSRFCookie(event.cookies);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

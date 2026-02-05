import {
	validateSession,
	setSessionCookie,
	deleteSessionCookie,
	deleteCSRFCookie,
	getSessionCookieName,
	setCSRFCookie
} from '$lib/server/sessions';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import { startReminderScheduler } from '$lib/server/scheduler';

// Initialize reminder scheduler on startup
startReminderScheduler();

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

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	// Log the error with context
	const errorId = crypto.randomUUID();

	logger.error('Server error occurred', {
		errorId,
		status,
		message,
		path: event.url.pathname,
		method: event.request.method,
		userId: event.locals.user?.id,
		error:
			error instanceof Error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack
					}
				: error
	});

	// Don't expose internal error details to the client in production
	const isDev = process.env.NODE_ENV === 'development';

	return {
		message: isDev ? message : 'An unexpected error occurred',
		errorId: isDev ? errorId : undefined
	};
};

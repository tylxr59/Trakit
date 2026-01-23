import { redirect, error } from '@sveltejs/kit';
import {
	invalidateSession,
	deleteSessionCookie,
	deleteCSRFCookie,
	validateCSRFToken
} from '$lib/server/sessions';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies, request }) => {
	if (!locals.session) {
		throw redirect(302, '/login');
	}

	// Validate CSRF token
	const formData = await request.formData();
	const csrfToken = formData.get('csrf_token')?.toString() ?? null;

	if (!validateCSRFToken(locals.session.csrfToken, csrfToken)) {
		throw error(403, 'Invalid CSRF token');
	}

	await invalidateSession(locals.session.id);
	deleteSessionCookie(cookies);
	deleteCSRFCookie(cookies);

	throw redirect(302, '/login');
};

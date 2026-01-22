import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const theme = cookies.get('theme') || 'light';
	return {
		user: locals.user,
		theme: theme as 'light' | 'dark'
	};
};

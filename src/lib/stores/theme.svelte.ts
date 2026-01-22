import { browser } from '$app/environment';

function createThemeStore() {
	let theme = $state<'light' | 'dark'>('light');

	return {
		get value() {
			return theme;
		},
		set(newTheme: 'light' | 'dark') {
			theme = newTheme;
			if (browser) {
				document.documentElement.classList.toggle('dark', newTheme === 'dark');
				document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
			}
		},
		toggle() {
			this.set(theme === 'light' ? 'dark' : 'light');
		},
		init(initialTheme: 'light' | 'dark') {
			theme = initialTheme;
			if (browser) {
				document.documentElement.classList.toggle('dark', initialTheme === 'dark');
			}
		}
	};
}

export const themeStore = createThemeStore();

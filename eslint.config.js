import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,ts,svelte}'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				// Svelte 5 runes
				$state: 'readonly',
				$derived: 'readonly',
				$effect: 'readonly',
				$props: 'readonly',
				$bindable: 'readonly',
				$inspect: 'readonly'
			}
		}
	},
	{
		files: ['**/*.ts', '!**/*.svelte.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				projectService: {
					allowDefaultProject: ['*.js', '*.mjs', '*.ts']
				}
			}
		},
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			...ts.configs.recommended.rules
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				extraFileExtensions: ['.svelte'],
				projectService: {
					allowDefaultProject: ['*.js', '*.mjs']
				}
			}
		},
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			...ts.configs.recommended.rules
		}
	},
	...svelte.configs['flat/recommended'],
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				parser: tsParser
			}
		},
		rules: {
			'svelte/prefer-svelte-reactivity': 'off', // Too strict for simple cases
			'svelte/require-each-key': 'off', // Not needed for static lists
			'svelte/no-navigation-without-resolve': 'off', // Not using resolve() pattern
			'svelte/no-unused-props': 'off' // Too many false positives
		}
	},
	prettier,
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'*.config.ts',
			'*.config.js',
			'migrations/',
			'scripts/',
			'src/service-worker.ts'
		]
	}
];

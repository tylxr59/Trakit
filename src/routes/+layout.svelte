<script lang="ts">
	import '../app.css';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	let { data, children } = $props();

	onMount(() => {
		themeStore.init(data.theme);
	});
</script>

<div class="app">
	{#if data.user}
		<header class="header">
			<div class="container">
				<h1 class="logo">
					<Icon icon="material-symbols:check-circle" width="32" />
					Trakit
				</h1>
				<div class="header-actions">
					<button
						class="theme-toggle"
						onclick={() => themeStore.toggle()}
						aria-label="Toggle theme"
					>
						<Icon
							icon={themeStore.value === 'dark'
								? 'material-symbols:light-mode'
								: 'material-symbols:dark-mode'}
							width="24"
						/>
					</button>
					<form method="POST" action="/logout">
						<button class="logout-btn" type="submit">
							<Icon icon="material-symbols:logout" width="20" />
							Logout
						</button>
					</form>
				</div>
			</div>
		</header>
	{/if}

	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		background: rgb(var(--color-surface));
		border-bottom: 1px solid rgb(var(--color-outline-variant));
		padding: 16px 0;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 24px;
		font-weight: 700;
		color: rgb(var(--color-primary));
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-actions {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.theme-toggle {
		background: none;
		border: none;
		cursor: pointer;
		color: rgb(var(--color-on-surface));
		padding: 8px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.theme-toggle:hover {
		background: rgb(var(--color-surface-variant) / 0.3);
	}

	.logout-btn {
		background: rgb(var(--color-error) / 0.1);
		color: rgb(var(--color-error));
		border: none;
		padding: 8px 16px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: rgb(var(--color-error) / 0.15);
	}

	.main {
		flex: 1;
		padding: 24px 0;
	}
</style>

<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	// Error status from SvelteKit
	const status = $derived($page.status);

	// Map error codes to user-friendly information
	const errorInfo = $derived.by(() => {
		switch (status) {
			case 400:
				return {
					title: 'Bad Request',
					description: 'The request could not be understood or was missing required parameters.',
					icon: 'material-symbols:error-outline',
					color: 'error'
				};
			case 401:
				return {
					title: 'Unauthorized',
					description: 'You need to be logged in to access this page.',
					icon: 'material-symbols:lock-outline',
					color: 'error',
					action: { text: 'Go to Login', href: '/login' }
				};
			case 403:
				return {
					title: 'Forbidden',
					description: "You don't have permission to access this resource.",
					icon: 'material-symbols:block',
					color: 'error'
				};
			case 404:
				return {
					title: 'Page Not Found',
					description: "The page you're looking for doesn't exist or has been moved.",
					icon: 'material-symbols:search-off',
					color: 'tertiary'
				};
			case 429:
				return {
					title: 'Too Many Requests',
					description: 'Please slow down and try again in a moment.',
					icon: 'material-symbols:speed',
					color: 'error'
				};
			case 500:
				return {
					title: 'Internal Server Error',
					description: 'Something went wrong on our end. Please try again later.',
					icon: 'material-symbols:warning-outline',
					color: 'error'
				};
			case 503:
				return {
					title: 'Service Unavailable',
					description: 'The service is temporarily unavailable. Please try again later.',
					icon: 'material-symbols:cloud-off',
					color: 'error'
				};
			default:
				return {
					title: 'Error',
					description: 'An unexpected error occurred.',
					icon: 'material-symbols:error-outline',
					color: 'error'
				};
		}
	});
</script>

<svelte:head>
	<title>{status} - {errorInfo.title} | Trakit</title>
</svelte:head>

<div class="error-container">
	<div class="error-card">
		<div class="error-icon" class:error={errorInfo.color === 'error'}>
			<Icon icon={errorInfo.icon} width="64" />
		</div>

		<div class="error-content">
			<h1 class="error-status">{status}</h1>
			<h2 class="error-title">{errorInfo.title}</h2>
			<p class="error-description">{errorInfo.description}</p>
		</div>

		<div class="error-actions">
			{#if errorInfo.action}
				<a href={errorInfo.action.href} class="btn btn-primary">
					{errorInfo.action.text}
				</a>
			{/if}
			<a href="/" class="btn btn-secondary">
				<Icon icon="material-symbols:home" width="20" />
				Go Home
			</a>
			<button onclick={() => window.history.back()} class="btn btn-secondary">
				<Icon icon="material-symbols:arrow-back" width="20" />
				Go Back
			</button>
		</div>
	</div>
</div>

<style>
	.error-container {
		min-height: 70vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.error-card {
		max-width: 600px;
		width: 100%;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 12px;
		padding: 48px 32px;
		text-align: center;
		transition: all 0.2s;
	}

	.error-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.error-icon {
		color: rgb(var(--color-tertiary));
		margin-bottom: 24px;
		display: flex;
		justify-content: center;
		opacity: 0.9;
	}

	.error-icon.error {
		color: rgb(var(--color-error));
	}

	.error-content {
		margin-bottom: 32px;
	}

	.error-status {
		font-size: 72px;
		font-weight: 700;
		color: rgb(var(--color-primary));
		margin: 0 0 8px 0;
		line-height: 1;
	}

	.error-title {
		font-size: 28px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		margin: 0 0 16px 0;
	}

	.error-description {
		font-size: 16px;
		color: rgb(var(--color-on-surface-variant));
		margin: 0;
		line-height: 1.5;
	}

	.error-actions {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 500;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: none;
	}

	.btn-primary {
		background: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
	}

	.btn-primary:hover {
		background: rgb(var(--color-primary) / 0.9);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.btn-secondary {
		background: rgb(var(--color-surface-variant));
		color: rgb(var(--color-on-surface-variant));
	}

	.btn-secondary:hover {
		background: rgb(var(--color-surface-variant) / 0.8);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 640px) {
		.error-card {
			padding: 32px 24px;
		}

		.error-status {
			font-size: 56px;
		}

		.error-title {
			font-size: 24px;
		}

		.error-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>

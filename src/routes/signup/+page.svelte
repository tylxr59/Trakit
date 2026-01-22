<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Sign Up - Trakit</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<div class="auth-header">
			<Icon icon="material-symbols:check-circle" width="48" />
			<h1>Create Account</h1>
			<p>Start tracking your habits today</p>
		</div>

		{#if !data.allowRegistration}
			<div class="error-message">
				Registration is currently disabled. Please contact the administrator.
			</div>
		{:else if form?.success && form?.requiresVerification}
			<div class="success-message">
				<Icon icon="material-symbols:check-circle" width="24" />
				<p>
					Account created! Please check your email for a verification code and enter it on the
					login page.
				</p>
			</div>
			<a href="/login" class="link-btn">Go to Login</a>
		{:else}
			{#if form?.message}
				<div class="error-message">{form.message}</div>
			{/if}

			<form method="POST" use:enhance>
				<div class="form-group">
					<label for="email">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						autocomplete="email"
						class="form-input"
					/>
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						minlength="8"
						autocomplete="new-password"
						class="form-input"
					/>
					<small>Minimum 8 characters</small>
				</div>

				<button type="submit" class="submit-btn">Create Account</button>
			</form>

			<div class="auth-footer">
				Already have an account? <a href="/login">Log in</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-container {
		min-height: calc(100vh - 100px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.auth-card {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 16px;
		padding: 40px;
		max-width: 440px;
		width: 100%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.auth-header {
		text-align: center;
		margin-bottom: 32px;
		color: rgb(var(--color-primary));
	}

	.auth-header h1 {
		font-size: 28px;
		font-weight: 700;
		margin: 16px 0 8px;
		color: rgb(var(--color-on-surface));
	}

	.auth-header p {
		color: rgb(var(--color-on-surface-variant));
		margin: 0;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: rgb(var(--color-on-surface));
	}

	.form-input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid rgb(var(--color-outline));
		border-radius: 8px;
		background: rgb(var(--color-background));
		color: rgb(var(--color-on-background));
		font-size: 16px;
		transition: all 0.2s;
	}

	.form-input:focus {
		outline: 2px solid rgb(var(--color-primary));
		border-color: transparent;
	}

	.form-group small {
		display: block;
		margin-top: 4px;
		color: rgb(var(--color-on-surface-variant));
		font-size: 14px;
	}

	.submit-btn {
		width: 100%;
		background: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
		border: none;
		padding: 14px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.submit-btn:hover {
		background: rgb(var(--color-primary) / 0.9);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.auth-footer {
		text-align: center;
		margin-top: 24px;
		color: rgb(var(--color-on-surface-variant));
	}

	.auth-footer a {
		color: rgb(var(--color-primary));
		text-decoration: none;
		font-weight: 600;
	}

	.auth-footer a:hover {
		text-decoration: underline;
	}

	.error-message {
		background: rgb(var(--color-error-container));
		color: rgb(var(--color-on-error-container));
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 20px;
	}

	.success-message {
		background: rgb(var(--color-primary-container));
		color: rgb(var(--color-on-primary-container));
		padding: 16px;
		border-radius: 8px;
		margin-bottom: 20px;
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.success-message p {
		margin: 0;
	}

	.link-btn {
		display: block;
		width: 100%;
		background: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
		text-align: center;
		padding: 14px;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s;
	}

	.link-btn:hover {
		background: rgb(var(--color-primary) / 0.9);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
</style>

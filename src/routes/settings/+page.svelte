<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';

	let { data, form } = $props();

	let showEmailForm = $state(false);
	let showPasswordForm = $state(false);

	// Get list of common timezones
	const timezones = [
		'UTC',
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'America/Anchorage',
		'Pacific/Honolulu',
		'Europe/London',
		'Europe/Paris',
		'Europe/Berlin',
		'Europe/Madrid',
		'Europe/Rome',
		'Europe/Amsterdam',
		'Europe/Brussels',
		'Europe/Vienna',
		'Europe/Stockholm',
		'Europe/Warsaw',
		'Europe/Athens',
		'Europe/Helsinki',
		'Europe/Dublin',
		'Asia/Dubai',
		'Asia/Kolkata',
		'Asia/Shanghai',
		'Asia/Tokyo',
		'Asia/Hong_Kong',
		'Asia/Singapore',
		'Asia/Seoul',
		'Asia/Bangkok',
		'Asia/Manila',
		'Australia/Sydney',
		'Australia/Melbourne',
		'Australia/Brisbane',
		'Australia/Perth',
		'Pacific/Auckland'
	];
</script>

<svelte:head>
	<title>Settings - Trakit</title>
</svelte:head>

<div class="settings-container">
	<div class="settings-header">
		<h1>Settings</h1>
		<a href="/" class="back-link">
			<Icon icon="material-symbols:arrow-back" />
			Back to Dashboard
		</a>
	</div>

	{#if form?.message}
		<div class="message" class:success={form.success} class:error={!form.success}>
			{form.message}
		</div>
	{/if}

	<!-- Profile Section -->
	<section class="settings-section">
		<h2>
			<Icon icon="material-symbols:person" />
			Profile
		</h2>
		<form
			method="POST"
			action="?/updateProfile"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
				};
			}}
		>
			<div class="form-group">
				<label for="displayName">Display Name</label>
				<input
					type="text"
					id="displayName"
					name="displayName"
					value={data.displayName}
					required
					maxlength="100"
					class="form-input"
				/>
			</div>

			<div class="form-group">
				<label for="timezone">Timezone</label>
				<select id="timezone" name="timezone" class="form-input" required>
					{#each timezones as tz}
						<option value={tz} selected={data.timezone === tz}>{tz}</option>
					{/each}
				</select>
				<small>Used to accurately display when you completed habits</small>
			</div>

		<div class="form-group">
			<label for="weekStart">Week Starts On</label>
			<select id="weekStart" name="weekStart" class="form-input" required>
				<option value="sunday" selected={(data as unknown as { weekStart: string }).weekStart === 'sunday'}>Sunday</option>
				<option value="monday" selected={(data as unknown as { weekStart: string }).weekStart === 'monday'}>Monday</option>
				<option value="tuesday" selected={(data as unknown as { weekStart: string }).weekStart === 'tuesday'}>Tuesday</option>
				<option value="wednesday" selected={(data as unknown as { weekStart: string }).weekStart === 'wednesday'}>Wednesday</option>
				<option value="thursday" selected={(data as unknown as { weekStart: string }).weekStart === 'thursday'}>Thursday</option>
				<option value="friday" selected={(data as unknown as { weekStart: string }).weekStart === 'friday'}>Friday</option>
				<option value="saturday" selected={(data as unknown as { weekStart: string }).weekStart === 'saturday'}>Saturday</option>
			</select>
			<small>Affects weekly habit tracking and calendar display</small>
		</div>

		<button type="submit" class="submit-btn">
			<Icon icon="material-symbols:save" />
			Save Profile
		</button>
	</form>
	</section>

	<!-- Email Section -->
	<section class="settings-section">
		<h2>
			<Icon icon="material-symbols:mail" />
			Email Address
		</h2>
		<div class="current-value">
			<strong>Current email:</strong> {data.email}
		</div>

		{#if !showEmailForm}
			<button type="button" class="secondary-btn" onclick={() => (showEmailForm = true)}>
				Change Email
			</button>
		{:else}
			<form
				method="POST"
				action="?/updateEmail"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						showEmailForm = false;
					};
				}}
			>
				<div class="form-group">
					<label for="newEmail">New Email</label>
					<input
						type="email"
						id="newEmail"
						name="newEmail"
						required
						autocomplete="email"
						class="form-input"
					/>
				</div>

				<div class="form-group">
					<label for="emailPassword">Current Password</label>
					<input
						type="password"
						id="emailPassword"
						name="password"
						required
						autocomplete="current-password"
						class="form-input"
					/>
					<small>Verify your identity to change your email</small>
				</div>

				<div class="button-group">
					<button type="submit" class="submit-btn">
						<Icon icon="material-symbols:save" />
						Update Email
					</button>
					<button type="button" class="secondary-btn" onclick={() => (showEmailForm = false)}>
						Cancel
					</button>
				</div>
			</form>
		{/if}
	</section>

	<!-- Password Section -->
	<section class="settings-section">
		<h2>
			<Icon icon="material-symbols:lock" />
			Password
		</h2>

		{#if !showPasswordForm}
			<button type="button" class="secondary-btn" onclick={() => (showPasswordForm = true)}>
				Change Password
			</button>
		{:else}
			<form
				method="POST"
				action="?/updatePassword"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						showPasswordForm = false;
					};
				}}
			>
				<div class="form-group">
					<label for="currentPassword">Current Password</label>
					<input
						type="password"
						id="currentPassword"
						name="currentPassword"
						required
						autocomplete="current-password"
						class="form-input"
					/>
				</div>

				<div class="form-group">
					<label for="newPassword">New Password</label>
					<input
						type="password"
						id="newPassword"
						name="newPassword"
						required
						autocomplete="new-password"
						class="form-input"
					/>
					<small>At least 8 characters</small>
				</div>

				<div class="form-group">
					<label for="confirmPassword">Confirm New Password</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						required
						autocomplete="new-password"
						class="form-input"
					/>
				</div>

				<div class="button-group">
					<button type="submit" class="submit-btn">
						<Icon icon="material-symbols:save" />
						Update Password
					</button>
					<button type="button" class="secondary-btn" onclick={() => (showPasswordForm = false)}>
						Cancel
					</button>
				</div>
			</form>
		{/if}
	</section>
</div>

<style>
	.settings-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
	}

	.settings-header h1 {
		font-size: 32px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		margin: 0;
	}

	.back-link {
		display: flex;
		align-items: center;
		gap: 8px;
		color: rgb(var(--color-primary));
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.back-link:hover {
		opacity: 0.8;
	}

	.message {
		padding: 16px;
		border-radius: 8px;
		margin-bottom: 20px;
		font-weight: 500;
	}

	.message.success {
		background: rgba(34, 197, 94, 0.1);
		color: rgb(34, 197, 94);
		border: 1px solid rgb(34, 197, 94);
	}

	.message.error {
		background: rgba(239, 68, 68, 0.1);
		color: rgb(239, 68, 68);
		border: 1px solid rgb(239, 68, 68);
	}

	.settings-section {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 20px;
	}

	.settings-section h2 {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 20px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		margin: 0 0 20px 0;
	}

	.current-value {
		padding: 12px;
		background: rgb(var(--color-surface-variant));
		border-radius: 8px;
		margin-bottom: 16px;
		color: rgb(var(--color-on-surface-variant));
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
		font-size: 16px;
		background: rgb(var(--color-surface));
		color: rgb(var(--color-on-surface));
		transition: border-color 0.2s;
	}

	.form-input:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.form-group small {
		display: block;
		margin-top: 6px;
		font-size: 14px;
		color: rgb(var(--color-on-surface-variant));
	}

	.submit-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.submit-btn:hover {
		opacity: 0.9;
	}

	.secondary-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: rgb(var(--color-surface-variant));
		color: rgb(var(--color-on-surface-variant));
		border: 1px solid rgb(var(--color-outline));
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.secondary-btn:hover {
		opacity: 0.8;
	}

	.button-group {
		display: flex;
		gap: 12px;
		margin-top: 20px;
	}

	@media (max-width: 640px) {
		.settings-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.button-group {
			flex-direction: column;
		}

		.button-group button {
			width: 100%;
		}
	}
</style>

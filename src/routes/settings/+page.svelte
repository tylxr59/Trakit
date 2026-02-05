<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';

	let { data, form } = $props();

	let showEmailForm = $state(false);
	let showPasswordForm = $state(false);
	
	// Notification state
	let notificationPermission = $state<NotificationPermission>('default');
	let reminderEnabled = $state(false);
	let reminderService = $state<'push' | 'ntfy' | null>(null);
	let reminderTime = $state('17:00');
	let ntfyUrl = $state('');
	let ntfyUrlRevealed = $state(false);
	let revealingUrl = $state(false);
	let testingNotification = $state(false);
	let notificationMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Initialize from server data
	$effect(() => {
		reminderEnabled = data.reminderEnabled;
		reminderService = data.reminderService;
		reminderTime = data.reminderTime;
	});

	// Check notification permission on mount
	if (typeof window !== 'undefined' && 'Notification' in window) {
		notificationPermission = Notification.permission;
	}

	// Request push notification permission
	async function requestPushPermission() {
		if (!('Notification' in window)) {
			notificationMessage = { type: 'error', text: 'Notifications not supported in this browser' };
			return;
		}

		if (!('serviceWorker' in navigator)) {
			notificationMessage = { type: 'error', text: 'Service Worker not supported' };
			return;
		}

		try {
			const permission = await Notification.requestPermission();
			notificationPermission = permission;

			if (permission === 'granted') {
				// Register service worker and subscribe
				const registration = await navigator.serviceWorker.ready;
				
				// Get VAPID public key from page data
				const vapidKey = data.vapidPublicKey;
				if (!vapidKey) {
					notificationMessage = { type: 'error', text: 'Push notifications not configured' };
					return;
				}

				const subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: vapidKey
				});

				// Send subscription to server
				const response = await fetch('/api/notifications/subscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ subscription: subscription.toJSON() })
				});

				if (!response.ok) {
					throw new Error('Failed to register push subscription');
				}

				notificationMessage = { type: 'success', text: 'Push notifications enabled!' };
				reminderService = 'push';
			} else {
				notificationMessage = { type: 'error', text: 'Notification permission denied' };
			}
		} catch (error) {
			console.error('Failed to enable push notifications:', error);
			notificationMessage = { type: 'error', text: 'Failed to enable push notifications' };
		}
	}

	// Save notification preferences
	async function saveNotificationPreferences() {
		try {
			const response = await fetch('/api/notifications/preferences', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reminderEnabled,
					reminderService,
					reminderTime,
					ntfyUrl: reminderService === 'ntfy' ? ntfyUrl : null
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to save preferences');
			}

			notificationMessage = { type: 'success', text: 'Notification preferences saved!' };
		} catch (error) {
			console.error('Failed to save preferences:', error);
			notificationMessage = { 
				type: 'error', 
				text: error instanceof Error ? error.message : 'Failed to save preferences' 
			};
		}
	}

	// Reveal Ntfy URL
	async function revealNtfyUrl() {
		revealingUrl = true;
		notificationMessage = null;

		try {
			const response = await fetch('/api/notifications/ntfy-url');

			if (!response.ok) {
				throw new Error('Failed to retrieve Ntfy URL');
			}

			const data = await response.json();
			ntfyUrl = data.ntfyUrl || '';
			ntfyUrlRevealed = true;
		} catch (error) {
			console.error('Failed to reveal Ntfy URL:', error);
			notificationMessage = {
				type: 'error',
				text: 'Failed to retrieve Ntfy URL'
			};
		} finally {
			revealingUrl = false;
		}
	}

	// Hide Ntfy URL
	function hideNtfyUrl() {
		ntfyUrl = '';
		ntfyUrlRevealed = false;
	}

	// Test notification
	async function testNotification() {
		testingNotification = true;
		notificationMessage = null;

		try {
			const response = await fetch('/api/notifications/test', {
				method: 'POST'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to send test notification');
			}

			notificationMessage = { type: 'success', text: 'Test notification sent! Check your device.' };
		} catch (error) {
			console.error('Failed to send test notification:', error);
			notificationMessage = { 
				type: 'error', 
				text: error instanceof Error ? error.message : 'Failed to send test notification' 
			};
		} finally {
			testingNotification = false;
		}
	}

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

	<!-- Notifications Section -->
	<section class="settings-section">
		<h2>
			<Icon icon="material-symbols:notifications" />
			Notifications
		</h2>

		<p class="section-description">
			Get daily reminders to complete your habits.
		</p>

		{#if notificationMessage}
			<div class="message" class:success={notificationMessage.type === 'success'} class:error={notificationMessage.type === 'error'}>
				{notificationMessage.text}
			</div>
		{/if}

		<div class="notification-settings">
			<div class="form-row">
				<label class="toggle-label">
					<input
						type="checkbox"
						bind:checked={reminderEnabled}
						onchange={() => {
							if (!reminderEnabled && reminderService) {
								saveNotificationPreferences();
							}
						}}
					/>
					<span>Enable daily reminders</span>
				</label>

				{#if reminderEnabled}
					<div class="time-input-wrapper">
						<label for="reminderTime" class="visually-hidden">Reminder Time</label>
						<input
							type="time"
							id="reminderTime"
							bind:value={reminderTime}
							class="time-input"
							required
						/>
					</div>
				{/if}
			</div>

			{#if reminderEnabled}
				<div class="service-selector">
					<label class="service-option" class:selected={reminderService === 'push'} class:disabled={notificationPermission !== 'granted'}>
						<input
							type="radio"
							name="reminderService"
							value="push"
							bind:group={reminderService}
							disabled={notificationPermission !== 'granted'}
						/>
						<div class="service-content">
							<Icon icon="material-symbols:notifications" width="20" />
							<div class="service-info">
								<strong>Push Notifications</strong>
								<small>Browser & mobile PWA</small>
							</div>
						</div>
					</label>

					{#if notificationPermission !== 'granted' && reminderService === 'push'}
						<button type="button" class="enable-service-btn" onclick={requestPushPermission}>
							<Icon icon="material-symbols:notifications-active" />
							Enable Push Notifications
						</button>
					{/if}

					<label class="service-option" class:selected={reminderService === 'ntfy'}>
						<input
							type="radio"
							name="reminderService"
							value="ntfy"
							bind:group={reminderService}
						/>
						<div class="service-content">
							<Icon icon="material-symbols:webhook" width="20" />
							<div class="service-info">
								<strong>Ntfy</strong>
								<small>Self-hosted service</small>
							</div>
						</div>
					</label>
				</div>

				{#if reminderService === 'ntfy'}
					<div class="ntfy-config">
						{#if !ntfyUrlRevealed}
							<div class="url-reveal-container">
								<input
									type="text"
									value="••••••••••••••••••••••••••••"
									disabled
									class="url-masked"
								/>
								<button type="button" class="reveal-btn" onclick={revealNtfyUrl} disabled={revealingUrl}>
									<Icon icon="material-symbols:visibility" width="18" />
									{revealingUrl ? 'Loading...' : 'Reveal'}
								</button>
							</div>
						{:else}
							<div class="url-reveal-container">
								<input
									type="url"
									id="ntfyUrl"
									bind:value={ntfyUrl}
									placeholder="https://user:pass@ntfy.example.com/topic"
									class="url-input"
									required
								/>
								<button type="button" class="hide-btn" onclick={hideNtfyUrl}>
									<Icon icon="material-symbols:visibility-off" width="18" />
									Hide
								</button>
							</div>
						{/if}
						<small class="url-hint">Include credentials in URL. Encrypted before storage.</small>
					</div>
				{/if}

				<div class="action-buttons">
					<button type="button" class="primary-action-btn" onclick={saveNotificationPreferences}>
						<Icon icon="material-symbols:save" />
						Save Settings
					</button>

					{#if reminderService}
						<button
							type="button"
							class="secondary-action-btn"
							onclick={testNotification}
							disabled={testingNotification}
						>
							<Icon icon="material-symbols:send" />
							{testingNotification ? 'Sending...' : 'Test'}
						</button>
					{/if}
				</div>
			{/if}
		</div>
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

	.section-description {
		margin: 0 0 20px 0;
		color: rgb(var(--color-on-surface-variant));
		font-size: 15px;
		line-height: 1.5;
	}

	.notification-settings {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 16px;
		background: rgb(var(--color-surface-container));
		border-radius: 8px;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		font-size: 16px;
		font-weight: 500;
	}

	.toggle-label input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.time-input-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.time-input {
		padding: 8px 12px;
		border: 2px solid rgb(var(--color-outline));
		border-radius: 6px;
		background: rgb(var(--color-surface));
		color: rgb(var(--color-on-surface));
		font-size: 16px;
		transition: border-color 0.2s;
		color-scheme: light dark;
	}

	.time-input:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	/* Ensure time input icon is readable in both themes */
	.time-input::-webkit-calendar-picker-indicator {
		filter: invert(var(--icon-invert, 0));
		opacity: 0.7;
		cursor: pointer;
	}

	.time-input::-webkit-calendar-picker-indicator:hover {
		opacity: 1;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.service-selector {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.service-option {
		position: relative;
		display: flex;
		align-items: center;
		padding: 16px;
		background: rgb(var(--color-surface-container));
		border: 2px solid rgb(var(--color-outline));
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.service-option:hover:not(.disabled) {
		border-color: rgb(var(--color-primary));
	}

	.service-option.selected {
		border-color: rgb(var(--color-primary));
		background: rgb(var(--color-primary-container));
	}

	.service-option.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.service-option input[type='radio'] {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.service-content {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
	}

	.service-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.service-info strong {
		font-size: 15px;
		color: rgb(var(--color-on-surface));
	}

	.service-info small {
		font-size: 13px;
		color: rgb(var(--color-on-surface-variant));
	}

	.enable-service-btn {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
		border: none;
		padding: 12px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.enable-service-btn:hover {
		opacity: 0.9;
	}

	.ntfy-config {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		background: rgb(var(--color-surface-container));
		border-radius: 8px;
	}

	.url-reveal-container {
		display: flex;
		gap: 8px;
		align-items: stretch;
	}

	.url-masked,
	.url-input {
		flex: 1;
		padding: 10px 12px;
		border: 2px solid rgb(var(--color-outline));
		border-radius: 6px;
		background: rgb(var(--color-surface));
		color: rgb(var(--color-on-surface));
		font-size: 14px;
		transition: border-color 0.2s;
	}

	.url-masked {
		font-family: monospace;
		letter-spacing: 2px;
	}

	.url-input:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.url-hint {
		font-size: 12px;
		color: rgb(var(--color-on-surface-variant));
		margin-top: 4px;
	}

	.reveal-btn,
	.hide-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: rgb(var(--color-secondary-container));
		color: rgb(var(--color-on-secondary-container));
		border: none;
		padding: 10px 16px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
		white-space: nowrap;
	}

	.reveal-btn:hover:not(:disabled),
	.hide-btn:hover {
		opacity: 0.85;
	}

	.reveal-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-buttons {
		display: flex;
		gap: 12px;
	}

	.primary-action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
		border: none;
		padding: 12px 20px;
		border-radius: 6px;
		font-size: 15px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.primary-action-btn:hover {
		opacity: 0.9;
	}

	.secondary-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: rgb(var(--color-secondary-container));
		color: rgb(var(--color-on-secondary-container));
		border: none;
		padding: 12px 20px;
		border-radius: 6px;
		font-size: 15px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
		white-space: nowrap;
	}

	.secondary-action-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.secondary-action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

		.form-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.time-input-wrapper {
			width: 100%;
		}

		.time-input {
			width: 100%;
		}

		.service-selector {
			grid-template-columns: 1fr;
		}

		.url-reveal-container {
			flex-direction: column;
		}

		.reveal-btn,
		.hide-btn {
			width: 100%;
		}

		.action-buttons {
			flex-direction: column;
		}

		.primary-action-btn,
		.secondary-action-btn {
			width: 100%;
		}
	}
</style>

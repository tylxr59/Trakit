<script lang="ts">
	import CalendarGrid from '$lib/components/CalendarGrid.svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { themeStore } from '$lib/stores/theme.svelte';

	let { data } = $props();

	let showDeleteConfirm = $state(false);
	let showEditForm = $state(false);
	let showColorPicker = $state(false);
	let editName = $state(data.habit.name);
	let editColor = $state(data.habit.color);
	let habitName = $state(data.habit.name);
	let habitColor = $state(data.habit.color);
	let stamps = $state(data.stamps);
	let currentStreak = $state(data.currentStreak);
	let isSharing = $state(false);
	let shareableSection: HTMLElement;

	const colorMap = $derived({
		level0: themeStore.value === 'dark' ? 'rgb(30 30 35)' : 'rgb(235 237 240)',
		level1: themeStore.value === 'dark' ? 'rgb(103 80 164 / 0.3)' : 'rgb(103 80 164 / 0.2)',
		level2: themeStore.value === 'dark' ? 'rgb(103 80 164 / 0.5)' : 'rgb(103 80 164 / 0.4)',
		level3: themeStore.value === 'dark' ? 'rgb(103 80 164 / 0.7)' : 'rgb(103 80 164 / 0.6)',
		level4: themeStore.value === 'dark' ? 'rgb(103 80 164 / 0.9)' : 'rgb(103 80 164 / 0.8)'
	});

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function shareProgress() {
		isSharing = true;
		try {
			const html2canvas = (await import('html2canvas')).default;
			const canvas = await html2canvas(shareableSection, {
				backgroundColor: themeStore.value === 'dark' ? '#1a1a1f' : '#ffffff',
				scale: 2
			});
			
			const blob = await new Promise<Blob>((resolve) => {
				canvas.toBlob((b) => resolve(b!), 'image/png');
			});
			
			const file = new File([blob], 'habit-progress.png', { type: 'image/png' });
			const streakText = currentStreak === 1 ? '1 day streak' : `${currentStreak} day streak`;
			const shareText = `I'm on a ${streakText} with ${habitName}! 🔥\n\nTrack your habits at gettrakit.app`;
			
			if (navigator.share && navigator.canShare({ files: [file] })) {
				await navigator.share({
					files: [file],
					title: `My ${habitName} Progress`,
					text: shareText
				});
			} else {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'habit-progress.png';
				a.click();
				URL.revokeObjectURL(url);
			}
		} finally {
			isSharing = false;
		}
	}

	async function deleteHabit() {
		const formData = new FormData();
		formData.append('habitId', data.habit.id);
		
		const response = await fetch('/?/deleteHabit', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			goto('/');
		}
	}

	async function saveEdit() {
		const response = await fetch('/api/habit', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				habitId: data.habit.id,
				name: editName,
				color: editColor
			})
		});

		if (response.ok) {
			data.habit.name = editName;
			data.habit.color = editColor;
			habitName = editName;
			habitColor = editColor;
			showEditForm = false;
		}
	}

	function cancelEdit() {
		editName = data.habit.name;
		editColor = data.habit.color;
		showEditForm = false;
	}
</script>

<div class="container">
	<div class="header">
		<a href="/" class="back-btn">
			<Icon icon="material-symbols:arrow-back" width="24" />
			Back to Dashboard
		</a>
		<div class="header-actions">
			<button class="share-btn" onclick={shareProgress} disabled={isSharing} title="Share">
				<Icon icon={isSharing ? 'svg-spinners:180-ring' : 'material-symbols:share'} width="20" />
				<span class="btn-text">Share</span>
			</button>
			<button class="edit-btn" onclick={() => (showEditForm = !showEditForm)}>
				<Icon icon="material-symbols:edit-outline" width="20" />
				Edit
			</button>
			<button class="delete-btn" onclick={() => (showDeleteConfirm = true)}>
				<Icon icon="material-symbols:delete-outline" width="20" />
				Delete
			</button>
		</div>
	</div>

	{#if showEditForm}
		<div class="edit-form">
			<div class="form-row">
				<div class="form-group">
					<label for="edit-name">Habit Name</label>
					<input
						type="text"
						id="edit-name"
						bind:value={editName}
						class="form-input"
						placeholder="Habit name"
					/>
				</div>
				<div class="form-group">
					<label>Color</label>
					<button
						type="button"
						class="color-button"
						style="background-color: {editColor}"
						onclick={() => (showColorPicker = true)}
					>
						<Icon icon="material-symbols:palette-outline" width="20" />
					</button>
				</div>
			</div>
			<div class="form-actions">
				<button class="save-btn" onclick={saveEdit}>Save Changes</button>
				<button class="cancel-btn" onclick={cancelEdit}>Cancel</button>
			</div>
		</div>
	{/if}

	<div class="shareable-content" bind:this={shareableSection}>
		<div class="habit-header">
			<div class="title-row">
				<div class="color-indicator" style="background-color: {habitColor}"></div>
				<h1 class="habit-name">{habitName}</h1>
				<div class="title-actions">
					<button class="share-btn" onclick={shareProgress} disabled={isSharing} title="Share">
						<Icon icon={isSharing ? 'svg-spinners:180-ring' : 'material-symbols:share'} width="20" />
						<span class="btn-text">Share</span>
					</button>
					<button class="edit-btn" onclick={() => (showEditForm = !showEditForm)} title="Edit">
						<Icon icon="material-symbols:edit-outline" width="20" />
						<span class="btn-text">Edit</span>
					</button>
					<button class="delete-btn" onclick={() => (showDeleteConfirm = true)} title="Delete">
						<Icon icon="material-symbols:delete-outline" width="20" />
						<span class="btn-text">Delete</span>
					</button>
				</div>
			</div>
			<p class="start-date">Started {formatDate(new Date(data.habit.createdAt))}</p>
		</div>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">
				<Icon icon="mdi:fire" width="32" />
			</div>
			<div class="stat-content">
				<div class="stat-value">{currentStreak}</div>
				<div class="stat-label">Current Streak</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">
				<Icon icon="material-symbols:check-circle" width="32" />
			</div>
			<div class="stat-content">
				<div class="stat-value">{stamps.filter((s) => s.value > 0).length}</div>
				<div class="stat-label">Total Completions</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">
				<Icon icon="material-symbols:calendar-month" width="32" />
			</div>
			<div class="stat-content">
				<div class="stat-value">
					{Math.round(
						(stamps.filter((s) => s.value > 0).length /
							Math.max(stamps.length, 1)) *
							100
					)}%
				</div>
				<div class="stat-label">Completion Rate</div>
			</div>
		</div>
	</div>

	<div class="calendar-section">
		<h2 class="section-title">Activity History</h2>
		<div class="calendar-container">
			<CalendarGrid data={stamps} color={habitColor} {colorMap} />
		</div>
	</div>
	</div>
</div>

<!-- Color Picker Modal -->
{#if showColorPicker}
	<ColorPicker
		selectedColor={editColor}
		onSelect={(color) => (editColor = color)}
		onClose={() => (showColorPicker = false)}
	/>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="modal-overlay" onclick={() => (showDeleteConfirm = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h3 class="modal-title">Delete Habit?</h3>
			<p class="modal-text">
				Are you sure you want to delete "{data.habit.name}"? This will permanently delete all
				tracking data for this habit.
			</p>
			<div class="modal-actions">
				<button class="modal-cancel" onclick={() => (showDeleteConfirm = false)}>Cancel</button>
				<button class="modal-confirm" onclick={deleteHabit}>Delete</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.header {
		margin-bottom: 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-actions {
		display: flex;
		gap: 12px;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: rgb(var(--color-on-surface-variant));
		text-decoration: none;
		font-weight: 500;
		padding: 8px 16px;
		border-radius: 8px;
		transition: all 0.2s;
	}

	.back-btn:hover {
		background: rgb(var(--color-surface-variant) / 0.3);
		color: rgb(var(--color-primary));
	}

	.share-btn {
		background: rgb(103 80 164 / 0.15);
		color: rgb(103 80 164);
		border: none;
		padding: 10px 20px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: all 0.2s;
	}

	.share-btn:hover {
		background: rgb(103 80 164 / 0.25);
		color: rgb(103 80 164);
	}

	@media (prefers-color-scheme: dark) {
		.share-btn {
			background: rgb(167 139 250 / 0.15);
			color: rgb(167 139 250);
		}

		.share-btn:hover {
			background: rgb(167 139 250 / 0.25);
			color: rgb(167 139 250);
		}
	}

	.share-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.edit-btn {
		background: rgb(59 130 246 / 0.15);
		color: rgb(59 130 246);
		border: none;
		padding: 10px 20px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: all 0.2s;
	}

	.edit-btn:hover {
		background: rgb(59 130 246 / 0.25);
		color: rgb(59 130 246);
	}

	.delete-btn {
		background: rgb(239 68 68 / 0.15);
		color: rgb(239 68 68);
		border: none;
		padding: 10px 20px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: all 0.2s;
	}

	.delete-btn:hover {
		background: rgb(239 68 68 / 0.25);
		color: rgb(239 68 68);
	}

	.edit-form {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 24px;
	}

	.form-row {
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
	}

	.form-group {
		flex: 1;
	}

	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: rgb(var(--color-on-surface));
		font-size: 14px;
	}

	.form-input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid rgb(var(--color-outline));
		border-radius: 8px;
		background: rgb(var(--color-background));
		color: rgb(var(--color-on-background));
		font-size: 16px;
	}

	.form-input:focus {
		outline: 2px solid rgb(var(--color-primary));
		border-color: transparent;
	}

	.color-button {
		width: 100%;
		height: 44px;
		border: 1px solid rgb(var(--color-outline));
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		transition: all 0.2s;
	}

	.color-button:hover {
		transform: scale(1.02);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.form-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.save-btn {
		background: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
		border: none;
		padding: 10px 24px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.save-btn:hover {
		background: rgb(var(--color-primary) / 0.9);
	}

	.cancel-btn {
		background: rgb(var(--color-surface-variant));
		color: rgb(var(--color-on-surface-variant));
		border: none;
		padding: 10px 24px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.cancel-btn:hover {
		background: rgb(var(--color-surface-variant) / 0.8);
	}

	.habit-header {
		margin-bottom: 32px;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 8px;
	}

	.color-indicator {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.habit-name {
		font-size: 36px;
		font-weight: 700;
		color: rgb(var(--color-on-background));
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.title-actions {
		display: none;
		gap: 8px;
		align-items: center;
	}

	.shareable-content {
		padding: 24px;
	}

	.start-date {
		font-size: 14px;
		color: rgb(var(--color-on-surface-variant));
		margin: 0;
		padding-left: 40px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 32px;
	}

	.stat-card {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 12px;
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.stat-icon {
		color: rgb(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		font-size: 28px;
		font-weight: 700;
		color: rgb(var(--color-on-surface));
		line-height: 1;
		margin-bottom: 4px;
	}

	.stat-label {
		font-size: 12px;
		color: rgb(var(--color-on-surface-variant));
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.calendar-section {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 32px;
	}

	.section-title {
		font-size: 20px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		margin: 0 0 16px 0;
	}

	.calendar-container {
		overflow-x: auto;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal {
		background: rgb(var(--color-surface));
		border-radius: 16px;
		padding: 32px;
		max-width: 440px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.modal-title {
		font-size: 24px;
		font-weight: 700;
		color: rgb(var(--color-on-surface));
		margin: 0 0 12px 0;
	}

	.modal-text {
		color: rgb(var(--color-on-surface-variant));
		margin: 0 0 24px 0;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.modal-cancel {
		background: rgb(var(--color-surface-variant));
		color: rgb(var(--color-on-surface-variant));
		border: none;
		padding: 12px 24px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.modal-cancel:hover {
		background: rgb(var(--color-surface-variant) / 0.8);
	}

	.modal-confirm {
		background: rgb(var(--color-error));
		color: rgb(var(--color-on-error));
		border: none;
		padding: 12px 24px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.modal-confirm:hover {
		background: rgb(var(--color-error) / 0.9);
	}

	@media (max-width: 768px) {
		.habit-name {
			font-size: 28px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.calendar-section {
			padding: 16px;
		}

		.start-date {
			padding-left: 0;
		}

		.title-row {
			flex-direction: row;
			align-items: center;
			gap: 8px;
			flex-wrap: wrap;
		}

		.title-actions {
			display: flex;
		}

		.header-actions {
			display: none;
		}

		.title-actions .btn-text {
			display: none;
		}

		.title-actions .share-btn,
		.title-actions .edit-btn,
		.title-actions .delete-btn {
			padding: 10px;
			border-radius: 50%;
			width: 40px;
			height: 40px;
			justify-content: center;
		}

		.header {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}

		.form-row {
			flex-direction: column;
		}

		.shareable-content {
			padding: 12px;
		}
	}
</style>

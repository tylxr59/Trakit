<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Habit {
		id: string;
		name: string;
		color: string;
		currentStreak: number;
	}

	interface Props {
		habit: Habit;
		todayStamped: boolean;
		onToggleToday: () => void;
		draggable?: boolean;
	}

	let { habit, todayStamped, onToggleToday, draggable = false }: Props = $props();
</script>

<div class="habit-row" {draggable} data-habit-id={habit.id}>
	{#if draggable}
		<div class="drag-handle" aria-label="Drag to reorder">
			<Icon icon="material-symbols:drag-indicator" width="20" />
		</div>
	{/if}

	<button
		class="checkbox"
		class:checked={todayStamped}
		onclick={onToggleToday}
		aria-label="Toggle today for {habit.name}"
	>
		{#if todayStamped}
			<Icon icon="material-symbols:check" width="18" />
		{/if}
	</button>

	<div class="color-indicator" style="background-color: {habit.color}"></div>

	<span class="habit-name">{habit.name}</span>

	<div class="streak">
		<Icon icon="mdi:fire" width="16" class="fire-icon" />
		<span class="streak-count">{habit.currentStreak}</span>
	</div>

	<a href="/habit/{habit.id}" class="stats-link" aria-label="View stats for {habit.name}">
		<Icon icon="mdi:chart-line" width="20" />
	</a>
</div>

<style>
	.habit-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 8px;
		transition: all 0.2s;
	}

	.habit-row:hover {
		background: rgb(var(--color-surface-variant) / 0.3);
	}

	.habit-row[draggable='true'] {
		cursor: move;
	}

	.habit-row.dragging {
		opacity: 0.5;
	}

	.drag-handle {
		color: rgb(var(--color-on-surface-variant));
		display: flex;
		align-items: center;
		cursor: grab;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.habit-row:hover .drag-handle {
		opacity: 1;
	}

	.checkbox {
		width: 24px;
		height: 24px;
		border: 2px solid rgb(var(--color-outline));
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.checkbox:hover {
		border-color: rgb(var(--color-primary));
	}

	.checkbox.checked {
		background: rgb(var(--color-primary));
		border-color: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
	}

	.color-indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.habit-name {
		flex: 1;
		font-size: 16px;
		font-weight: 500;
		color: rgb(var(--color-on-surface));
	}

	.streak {
		display: flex;
		align-items: center;
		gap: 4px;
		color: rgb(var(--color-on-surface-variant));
		font-size: 14px;
		font-weight: 600;
	}

	.fire-icon {
		color: #ff6b35;
	}

	.stats-link {
		color: rgb(var(--color-on-surface-variant));
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 6px;
		transition: all 0.2s;
		text-decoration: none;
	}

	.stats-link:hover {
		background: rgb(var(--color-surface-variant) / 0.5);
		color: rgb(var(--color-primary));
	}

	@media (max-width: 640px) {
		.habit-row {
			gap: 8px;
			padding: 10px 12px;
		}

		.habit-name {
			font-size: 14px;
		}

		.streak {
			font-size: 12px;
		}
	}
</style>

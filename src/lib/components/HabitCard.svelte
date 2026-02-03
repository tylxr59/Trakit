<script lang="ts">
	import Icon from '@iconify/svelte';
	import CalendarGrid from './CalendarGrid.svelte';

	interface Habit {
		id: string;
		name: string;
		color: string;
	}

	interface Props {
		habit: Habit;
		stamps: Array<{ date: string; value: number }>;
		todayStamped: boolean;
		onToggleToday: () => void;
		onDelete: () => void;
		weekStart?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
	}

	let { habit, stamps, todayStamped, onToggleToday, onDelete, weekStart = 'sunday' }: Props = $props();
</script>

<div class="habit-card">
	<div class="header">
		<div class="title-row">
			<div class="color-indicator" style="background-color: {habit.color}"></div>
			<h3 class="habit-name">{habit.name}</h3>
		</div>
		<div class="actions">
			<button
				class="today-btn"
				class:stamped={todayStamped}
				onclick={onToggleToday}
				aria-label="Toggle today"
			>
				<Icon icon="material-symbols:check-circle" width="24" />
			</button>
			<button class="delete-btn" onclick={onDelete} aria-label="Delete habit">
				<Icon icon="material-symbols:delete-outline" width="20" />
			</button>
		</div>
	</div>
	<div class="calendar">
		<CalendarGrid data={stamps} color={habit.color} weekStart={weekStart} />
	</div>
</div>

<style>
	.habit-card {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 12px;
		padding: 16px;
		transition: all 0.2s;
	}

	.habit-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
	}

	.color-indicator {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.habit-name {
		font-size: 18px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		margin: 0;
	}

	.actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.today-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: rgb(var(--color-on-surface-variant));
		padding: 4px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.today-btn:hover {
		background: rgb(var(--color-surface-variant) / 0.3);
	}

	.today-btn.stamped {
		color: rgb(var(--color-primary));
	}

	.delete-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: rgb(var(--color-error));
		padding: 4px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		opacity: 0.6;
	}

	.delete-btn:hover {
		background: rgb(var(--color-error-container) / 0.3);
		opacity: 1;
	}

	.calendar {
		margin-top: 12px;
	}
</style>
